-- ============================================================================
--  Spacework ERP  -  USER MANAGEMENT & ACCESS OVERHAUL  (run AFTER 01-40)
--  Turns Orbit from single-user-per-org into real teams, safely:
--   1. org_members gains lifecycle (status) + per-company scoping (company_ids).
--   2. org_invites: invite a teammate by email; they JOIN this org (not a new one).
--   3. the core isolation helpers honor status + company scope (RESTRICTIVE only,
--      so every existing member - status active, company_ids null - is unchanged).
--   4. every member mutation goes through a SECURITY DEFINER rpc with server-side
--      guards (rank, last-owner, self) - today those guards live only in the UI.
-- ============================================================================

-- 1) MEMBER LIFECYCLE + PER-COMPANY SCOPING ----------------------------------
-- org_members' PK is (user_id, org_id) with no stable single-column handle; add one
-- (a volatile default fills each existing row with its own uuid on add).
alter table public.org_members add column if not exists id          uuid not null default gen_random_uuid();
create unique index if not exists idx_org_members_id on public.org_members(id);
alter table public.org_members add column if not exists status      text not null default 'active';  -- active | suspended
alter table public.org_members add column if not exists company_ids uuid[];                            -- null/empty = every company in the org
alter table public.org_members add column if not exists invited_by  uuid;
alter table public.org_members add column if not exists joined_at   timestamptz default now();

-- 2) INVITATIONS -------------------------------------------------------------
create table if not exists public.org_invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  email       text not null,
  role        text not null default 'junior_engineer',
  company_ids uuid[],
  status      text not null default 'pending',   -- pending | accepted | revoked
  token       uuid not null default gen_random_uuid(),
  invited_by  uuid,
  invited_at  timestamptz default now(),
  accepted_at timestamptz,
  accepted_by uuid
);
create unique index if not exists idx_org_invites_pending on public.org_invites(org_id, lower(email)) where status='pending';
create index if not exists idx_org_invites_email on public.org_invites(lower(email)) where status='pending';
alter table public.org_invites enable row level security;
-- admins of the org read its invites; the invitee can read their own pending invite.
-- NOTE: the invitee-email check uses the JWT email claim, NOT a select on auth.users -
-- the `authenticated` role can't read auth.users, and an OR-branch that touches it makes
-- the WHOLE policy raise "permission denied for table users" even for admins.
drop policy if exists oi_r on public.org_invites;
create policy oi_r on public.org_invites for select using (
  public.is_org_admin(org_id)
  or lower(email) = lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'email',''))
);
-- all writes go through the definer rpcs below; no direct client writes
drop policy if exists oi_w on public.org_invites;

-- 3) PATCH THE CORE ISOLATION HELPERS (restrictive additions only) -----------
-- A member sees a company only if they are active AND (unscoped OR the company is
-- in their company_ids). Existing rows (active / null) are unaffected.
create or replace function public.my_company_ids()
returns setof uuid language sql stable security definer set search_path=public as $$
  select id from public.companies where public.is_platform_admin()
  union
  select c.id from public.companies c
  join public.org_members m on m.org_id = c.org_id
  where m.user_id = auth.uid()
    and coalesce(m.status,'active') = 'active'
    and (m.company_ids is null or array_length(m.company_ids,1) is null or c.id = any(m.company_ids));
$$;
-- writes: same scope, and a suspended member can never write
create or replace function public.can_write_company(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_platform_writer()
      or exists (
        select 1 from public.companies c
        join public.org_members m on m.org_id = c.org_id
        where c.id = cid and m.user_id = auth.uid()
          and coalesce(m.status,'active') = 'active'
          and (m.company_ids is null or array_length(m.company_ids,1) is null or c.id = any(m.company_ids))
          and m.role in ('owner','admin','accountant'));
$$;
-- a suspended admin is not an admin
create or replace function public.is_org_admin(oid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_platform_admin()
      or exists (select 1 from public.org_members
                 where org_id = oid and user_id = auth.uid()
                   and coalesce(status,'active') = 'active'
                   and role in ('owner','admin','accountant'));
$$;

-- resolve a user's effective role row in an org (org-specific overrides global)
create or replace function public.member_role_row(p_org uuid, p_user uuid)
returns public.roles language sql stable security definer set search_path=public as $$
  select r.* from public.org_members m
  join public.roles r on r.slug = m.role and (r.org_id = p_org or r.org_id is null)
  where m.org_id = p_org and m.user_id = p_user
  order by (r.org_id is not null) desc
  limit 1;
$$;

-- can the caller manage the team of this org? (owner-class or a can_manage_roles role)
create or replace function public.can_manage_team(p_org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select (r.full_access or r.can_manage_roles)
                   from public.member_role_row(p_org, auth.uid()) r), false)
      or public.is_platform_writer();
$$;

-- 4) MEMBER-MANAGEMENT RPCS (server-side guards) -----------------------------
-- helper: the caller's rank in an org (0 if none / platform admin gets a high rank)
create or replace function public._caller_rank(p_org uuid)
returns int language sql stable security definer set search_path=public as $$
  select case when public.is_platform_writer() then 1000
              else coalesce((select r.rank from public.member_role_row(p_org, auth.uid()) r), 0) end;
$$;

create or replace function public.invite_member(p_org uuid, p_email text, p_role text, p_company_ids uuid[] default null)
returns public.org_invites language plpgsql security definer set search_path=public as $$
declare em text := lower(btrim(p_email)); trole public.roles; inv public.org_invites; existing uuid;
begin
  if not public.can_manage_team(p_org) then raise exception 'You do not have permission to invite people to this team.'; end if;
  if em = '' or position('@' in em) = 0 then raise exception 'Enter a valid email address.'; end if;
  select * into trole from public.roles where slug = p_role and (org_id = p_org or org_id is null) order by (org_id is not null) desc limit 1;
  if trole.slug is null then raise exception 'That role does not exist.'; end if;
  if trole.rank >= public._caller_rank(p_org) and not public.is_platform_writer() then
    raise exception 'You can only invite people to a role below your own.'; end if;
  -- already a member?
  select m.user_id into existing from public.org_members m join auth.users u on u.id=m.user_id
    where m.org_id = p_org and lower(u.email) = em limit 1;
  if existing is not null then raise exception 'That person is already on this team.'; end if;
  insert into public.org_invites(org_id, email, role, company_ids, invited_by)
    values (p_org, em, p_role, p_company_ids, auth.uid())
    on conflict (org_id, lower(email)) where status='pending'
    do update set role = excluded.role, company_ids = excluded.company_ids, invited_by = auth.uid(), invited_at = now()
    returning * into inv;
  return inv;
end; $$;

-- the caller's pending invites (matched to their auth email)
create or replace function public.my_pending_invites()
returns table(id uuid, org_id uuid, org_name text, role text, role_label text, invited_at timestamptz)
language sql stable security definer set search_path=public as $$
  select i.id, i.org_id, o.name, i.role,
         coalesce((select r.label from public.roles r where r.slug=i.role and (r.org_id=i.org_id or r.org_id is null) order by (r.org_id is not null) desc limit 1), i.role),
         i.invited_at
  from public.org_invites i join public.orgs o on o.id = i.org_id
  where i.status = 'pending'
    and lower(i.email) = lower(coalesce((select u.email from auth.users u where u.id = auth.uid()), ''))
  order by i.invited_at desc;
$$;

create or replace function public.accept_invite(p_invite uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare inv public.org_invites; myemail text; cid uuid;
begin
  select lower(u.email) into myemail from auth.users u where u.id = auth.uid();
  select * into inv from public.org_invites where id = p_invite and status = 'pending';
  if inv.id is null then raise exception 'This invitation is no longer valid.'; end if;
  if lower(inv.email) <> coalesce(myemail,'') then raise exception 'This invitation was sent to a different email address.'; end if;
  -- join (or update scope if somehow already a member)
  insert into public.org_members(user_id, org_id, role, company_ids, invited_by, status, joined_at)
    values (auth.uid(), inv.org_id, inv.role, inv.company_ids, inv.invited_by, 'active', now())
    on conflict (user_id, org_id) do update set role = excluded.role, company_ids = excluded.company_ids, status = 'active';
  update public.org_invites set status='accepted', accepted_at=now(), accepted_by=auth.uid() where id = inv.id;
  -- land the user on a company they can see, if they had none
  select id into cid from public.companies where org_id = inv.org_id
    and (inv.company_ids is null or array_length(inv.company_ids,1) is null or id = any(inv.company_ids))
    order by name limit 1;
  update public.profiles set active_org_id = inv.org_id,
         active_company_id = coalesce(active_company_id, cid)
    where id = auth.uid() and (active_company_id is null);
  return inv.org_id;
end; $$;

create or replace function public.revoke_invite(p_invite uuid)
returns void language plpgsql security definer set search_path=public as $$
declare inv public.org_invites;
begin
  select * into inv from public.org_invites where id = p_invite;
  if inv.id is null then return; end if;
  if not public.can_manage_team(inv.org_id) then raise exception 'You do not have permission to do that.'; end if;
  update public.org_invites set status='revoked' where id = p_invite;
end; $$;

-- guard shared by role/scope/status/remove: caller may act on this member?
create or replace function public._can_admin_member(p_member uuid)
returns boolean language plpgsql stable security definer set search_path=public as $$
declare mem public.org_members; trank int;
begin
  select * into mem from public.org_members where id = p_member;
  if mem.id is null then return false; end if;
  if not public.can_manage_team(mem.org_id) then return false; end if;
  if mem.user_id = auth.uid() then return false; end if;                 -- never act on yourself here
  select coalesce(r.rank,0) into trank from public.member_role_row(mem.org_id, mem.user_id) r;
  return public.is_platform_writer() or trank < public._caller_rank(mem.org_id);  -- only manage people below you
end; $$;

-- true if this member is the org's only active owner (protect them)
create or replace function public._is_last_owner(p_member uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select m.role = 'owner' and (
    select count(*) from public.org_members o
    where o.org_id = m.org_id and o.role = 'owner' and coalesce(o.status,'active')='active'
  ) <= 1
  from public.org_members m where m.id = p_member;
$$;

create or replace function public.set_member_role(p_member uuid, p_role text)
returns void language plpgsql security definer set search_path=public as $$
declare mem public.org_members; trole public.roles;
begin
  select * into mem from public.org_members where id = p_member;
  if mem.id is null then raise exception 'That member no longer exists.'; end if;
  if not public._can_admin_member(p_member) then raise exception 'You can only change the role of people below your own rank.'; end if;
  select * into trole from public.roles where slug=p_role and (org_id=mem.org_id or org_id is null) order by (org_id is not null) desc limit 1;
  if trole.slug is null then raise exception 'That role does not exist.'; end if;
  if trole.rank >= public._caller_rank(mem.org_id) and not public.is_platform_writer() then
    raise exception 'You can only assign a role below your own.'; end if;
  if public._is_last_owner(p_member) and p_role <> 'owner' then
    raise exception 'You cannot change the role of the last owner. Make someone else an owner first.'; end if;
  update public.org_members set role = p_role where id = p_member;
end; $$;

create or replace function public.set_member_companies(p_member uuid, p_company_ids uuid[])
returns void language plpgsql security definer set search_path=public as $$
declare mem public.org_members;
begin
  select * into mem from public.org_members where id = p_member;
  if mem.id is null then raise exception 'That member no longer exists.'; end if;
  if not public._can_admin_member(p_member) then raise exception 'You do not have permission to change this member.'; end if;
  update public.org_members set company_ids = case when p_company_ids is null or array_length(p_company_ids,1) is null then null else p_company_ids end
    where id = p_member;
end; $$;

create or replace function public.set_member_status(p_member uuid, p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare mem public.org_members;
begin
  if p_status not in ('active','suspended') then raise exception 'Invalid status.'; end if;
  select * into mem from public.org_members where id = p_member;
  if mem.id is null then raise exception 'That member no longer exists.'; end if;
  if not public._can_admin_member(p_member) then raise exception 'You do not have permission to change this member.'; end if;
  if p_status = 'suspended' and public._is_last_owner(p_member) then
    raise exception 'You cannot suspend the last owner.'; end if;
  update public.org_members set status = p_status where id = p_member;
end; $$;

create or replace function public.remove_member(p_member uuid)
returns void language plpgsql security definer set search_path=public as $$
declare mem public.org_members;
begin
  select * into mem from public.org_members where id = p_member;
  if mem.id is null then return; end if;
  if not public._can_admin_member(p_member) then raise exception 'You do not have permission to remove this member.'; end if;
  if public._is_last_owner(p_member) then raise exception 'You cannot remove the last owner.'; end if;
  delete from public.org_members where id = p_member;
end; $$;

-- the team roster with emails/names (avoids per-teammate profiles RLS); admin-only content
create or replace function public.org_team(p_org uuid)
returns table(member_id uuid, user_id uuid, email text, full_name text, role text, status text, company_ids uuid[], joined_at timestamptz, is_me boolean)
language sql stable security definer set search_path=public as $$
  select m.id, m.user_id, u.email, p.full_name, m.role, coalesce(m.status,'active'), m.company_ids, m.joined_at, (m.user_id = auth.uid())
  from public.org_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.org_id = p_org and (public.is_org_admin(p_org) or m.user_id = auth.uid())
  order by (m.user_id = auth.uid()) desc, m.joined_at nulls last;
$$;

grant execute on function
  public.invite_member(uuid,text,text,uuid[]), public.my_pending_invites(), public.accept_invite(uuid),
  public.revoke_invite(uuid), public.set_member_role(uuid,text), public.set_member_companies(uuid,uuid[]),
  public.set_member_status(uuid,text), public.remove_member(uuid), public.org_team(uuid),
  public.member_role_row(uuid,uuid), public.can_manage_team(uuid)
  to authenticated;

select 'user management ready' as done,
       (select count(*) from public.org_members) as members,
       (select count(*) from public.org_invites) as invites;
