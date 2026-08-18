-- ============================================================================
--  Spacework ERP  -  PLATFORM (OPERATOR) SUPPORT ACCESS   (run AFTER 01-32)
--  A flagged platform admin (Space Work operator) can view + support every
--  tenant across all orgs, for support. Every tenant they open is logged.
--  Completely inert for normal users (is_platform_admin() = false for them).
-- ============================================================================

-- who the operators are (managed only via SQL / service role, never the client)
create table if not exists public.platform_admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  can_write boolean not null default true,        -- false = view-only support
  added_at  timestamptz default now(),
  note      text default ''
);
alter table public.platform_admins enable row level security;

-- audit trail: which operator opened which tenant, when
create table if not exists public.platform_access_log (
  id            uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id),
  company_id    uuid references public.companies(id) on delete set null,
  org_id        uuid references public.orgs(id)      on delete set null,
  action        text default 'open',
  at            timestamptz default now()
);
create index if not exists idx_pal_admin on public.platform_access_log(admin_user_id, at desc);
alter table public.platform_access_log enable row level security;

-- ---- helpers ---------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;
create or replace function public.is_platform_writer()
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid() and can_write);
$$;
-- the caller's TRUE memberships (NOT expanded by platform admin) so the app can
-- tell "my own org" from "a tenant I'm supporting"
create or replace function public.my_home_orgs()
returns setof uuid language sql stable security definer set search_path=public as $$
  select org_id from public.org_members where user_id = auth.uid();
$$;

-- ---- patch the visibility / write helpers to include the platform admin ----
create or replace function public.my_orgs()
returns setof uuid language sql stable security definer set search_path=public as $$
  select id from public.orgs where public.is_platform_admin()
  union
  select org_id from public.org_members where user_id = auth.uid();
$$;
create or replace function public.my_company_ids()
returns setof uuid language sql stable security definer set search_path=public as $$
  select id from public.companies where public.is_platform_admin()
  union
  select id from public.companies where org_id in (select org_id from public.org_members where user_id = auth.uid());
$$;
create or replace function public.is_org_admin(oid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_platform_admin()
      or exists (select 1 from public.org_members where org_id=oid and user_id=auth.uid() and role in ('owner','admin','accountant'));
$$;
create or replace function public.can_write_company(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.is_platform_writer()
      or exists (select 1 from public.companies c join public.org_members m on m.org_id=c.org_id
                 where c.id=cid and m.user_id=auth.uid() and m.role in ('owner','admin','accountant'));
$$;

-- ---- app-callable audit writer (best-effort; no-op for non-admins) ---------
create or replace function public.log_platform_access(p_company uuid, p_action text default 'open')
returns void language plpgsql security definer set search_path=public as $$
declare oid uuid;
begin
  if not public.is_platform_admin() then return; end if;
  select org_id into oid from public.companies where id = p_company;
  insert into public.platform_access_log(admin_user_id, company_id, org_id, action)
    values (auth.uid(), p_company, oid, coalesce(nullif(btrim(p_action),''),'open'));
end; $$;

-- ---- RLS: roster is admin-readable only, no client writes; log is admin-readable
drop policy if exists pa_read on public.platform_admins;
create policy pa_read on public.platform_admins for select using (public.is_platform_admin());
drop policy if exists pal_read on public.platform_access_log;
create policy pal_read on public.platform_access_log for select using (public.is_platform_admin());

grant execute on function public.is_platform_admin(), public.is_platform_writer(),
  public.my_home_orgs(), public.log_platform_access(uuid,text) to authenticated;

-- ---- seed the platform owner ----------------------------------------------
insert into public.platform_admins(user_id, note)
  select id, 'Space Work platform owner' from auth.users where email = 'kevingemayel@gmail.com'
  on conflict (user_id) do nothing;

select 'platform admin ready' as done,
       (select count(*) from public.platform_admins) as admins,
       (select email from auth.users u join public.platform_admins p on p.user_id=u.id limit 1) as who;
