-- ============================================================================
-- 190-roles-enforced.sql  -  the role a person holds is what the database checks.
--
-- Until now every write rule asked one question: is this person an owner, an
-- administrator or an accountant? Anyone else could save nothing, whatever the
-- role screen said, and a role made in Settings could never save at all. This
-- migration gives the database the model the role screen describes:
--
--   1. Depth per app. For each app a role says None, Own records, View, Work or
--      Manage (permissions -> app -> lvl). Older roles keep working: their View
--      and Manage ticks read as View and Manage. app_level(company, app) is the
--      signed-in person's level in that company; 191 applies it to the tables.
--   2. Three money switches: costs and margins, salaries, bank and cash.
--   3. Approval limits per role and document type, checked where a decision is
--      recorded, and a line manager signs their own team's expenses, leave and
--      timesheets.
--   4. Rules no role can break:
--      - nobody approves what they raised;
--      - whoever changed a supplier's bank details does not pay that supplier;
--      - whoever records payments through a bank does not reconcile it;
--      - payroll is approved by someone other than the person posting it;
--      - only someone who manages Accounting closes or reopens a period;
--      - roles and users are managed by the owner and the system administrator,
--        nobody changes their own role or access, and nobody grants more than
--        they hold;
--      - an auditor's account has an end date, and access stops on it.
--      The rules about two people apply once a company has two or more active
--      people who can write, so a business run by one person is never locked out.
--   5. Thirty-two role templates (the owner is the thirty-third), shared by every
--      organisation and customisable per organisation.
-- ============================================================================

-- 1. what a role and a membership can say
alter table public.roles add column if not exists see_costs boolean;
alter table public.roles add column if not exists see_salaries boolean;
alter table public.roles add column if not exists see_bank boolean;
alter table public.roles add column if not exists approval_limits jsonb;
alter table public.roles add column if not exists template_group text;
update public.roles set see_costs = coalesce(can_see_money, true) where see_costs is null;
update public.roles set see_salaries = coalesce(can_see_money, true) where see_salaries is null;
update public.roles set see_bank = coalesce(can_see_money, true) where see_bank is null;
alter table public.org_members add column if not exists expires_at timestamptz;
alter table public.org_invites add column if not exists expires_at timestamptz;

-- 2. levels
create or replace function public._lvl_of(e jsonb) returns text language sql immutable set search_path = public as $fn$
  select case
    when e is null or jsonb_typeof(e) <> 'object' then '-'
    when e ? 'lvl' then case when e ->> 'lvl' in ('O','V','W','M') then e ->> 'lvl' else '-' end
    when coalesce((e ->> 'm')::boolean, false) then 'M'
    when coalesce((e ->> 'v')::boolean, false) then 'V'
    else '-' end
$fn$;
create or replace function public._lvl_rank(l text) returns int language sql immutable set search_path = public as $fn$
  select case l when 'M' then 4 when 'W' then 3 when 'O' then 2 when 'V' then 1 else 0 end
$fn$;
create or replace function public.perm_level(p_perm jsonb, p_mod text) returns text language sql immutable set search_path = public as $fn$
  select case when p_perm is null then '-'
              when p_perm ? p_mod then public._lvl_of(p_perm -> p_mod)
              when p_perm ? '*' then public._lvl_of(p_perm -> '*')
              else '-' end
$fn$;

-- the membership and the role that give the signed-in person access to a company today
create or replace function public.my_member_in(cid uuid) returns public.org_members language sql stable security definer set search_path = public as $fn$
  select m.* from public.companies c
  join public.org_members m on m.org_id = c.org_id and m.user_id = auth.uid()
  where c.id = cid and coalesce(m.status, 'active') = 'active'
    and (m.expires_at is null or m.expires_at > now())
    and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
  limit 1
$fn$;
create or replace function public.my_role_in(cid uuid) returns public.roles language sql stable security definer set search_path = public as $fn$
  select r.* from public.companies c
  join public.org_members m on m.org_id = c.org_id and m.user_id = auth.uid()
  join public.roles r on r.slug = m.role and (r.org_id = c.org_id or r.org_id is null)
  where c.id = cid and coalesce(m.status, 'active') = 'active'
    and (m.expires_at is null or m.expires_at > now())
    and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
  order by (r.org_id is not null) desc
  limit 1
$fn$;

create or replace function public.app_level(cid uuid, p_mod text) returns text language plpgsql stable security definer set search_path = public as $fn$
declare r public.roles;
begin
  if public.is_platform_writer() then return 'M'; end if;
  select * into r from public.my_role_in(cid);
  if r.slug is null then return '-'; end if;
  if r.full_access then return 'M'; end if;
  return public.perm_level(r.permissions, p_mod);
end $fn$;

-- may the signed-in person write (Own, Work or Manage) in any of these apps, in this company?
create or replace function public.can_write_app(cid uuid, p_mods text[]) returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare r public.roles; x text;
begin
  if public.is_platform_writer() then return true; end if;
  if cid is null then return false; end if;
  select * into r from public.my_role_in(cid);
  if r.slug is null then return false; end if;
  if r.full_access then return true; end if;
  foreach x in array coalesce(p_mods, '{}'::text[]) loop
    if public.perm_level(r.permissions, x) in ('O','W','M') then return true; end if;
  end loop;
  return false;
end $fn$;
-- ... and manage (delete, configure) in any of them?
create or replace function public.can_manage_app(cid uuid, p_mods text[]) returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare r public.roles; x text;
begin
  if public.is_platform_writer() then return true; end if;
  if cid is null then return false; end if;
  select * into r from public.my_role_in(cid);
  if r.slug is null then return false; end if;
  if r.full_access then return true; end if;
  foreach x in array coalesce(p_mods, '{}'::text[]) loop
    if public.perm_level(r.permissions, x) = 'M' then return true; end if;
  end loop;
  return false;
end $fn$;

-- the three money switches: costs, salaries, bank
create or replace function public.can_see(cid uuid, p_what text) returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare r public.roles;
begin
  if public.is_platform_admin() then return true; end if;
  select * into r from public.my_role_in(cid);
  if r.slug is null then return false; end if;
  if r.full_access then return true; end if;
  return case p_what
    when 'costs' then coalesce(r.see_costs, r.can_see_money, true)
    when 'salaries' then coalesce(r.see_salaries, r.can_see_money, true)
    when 'bank' then coalesce(r.see_bank, r.can_see_money, true)
    else false end;
end $fn$;

-- does a role (by key, in an organisation) write anywhere?
create or replace function public._role_writes(p_org uuid, p_slug text) returns boolean language sql stable security definer set search_path = public as $fn$
  select p_slug in ('owner','admin') or coalesce((
    select r.full_access or exists (select 1 from jsonb_each(coalesce(r.permissions, '{}'::jsonb)) e where public._lvl_of(e.value) in ('O','W','M'))
      from public.roles r where r.slug = p_slug and (r.org_id = p_org or r.org_id is null)
     order by (r.org_id is not null) desc limit 1), false)
$fn$;

-- 3. the base write test: an active member whose role writes somewhere. 191 narrows it per app.
create or replace function public.can_write_company(cid uuid) returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare mem public.org_members;
begin
  if public.is_platform_writer() then return true; end if;
  select * into mem from public.my_member_in(cid);
  if mem.id is null then return false; end if;
  return public._role_writes(mem.org_id, mem.role);
end $fn$;

-- an organisation administrator: owner, administrator, or a role with full access or the right to manage roles
create or replace function public.is_org_admin(oid uuid) returns boolean language sql stable security definer set search_path = public as $fn$
  select public.is_platform_admin() or exists (
    select 1 from public.org_members m
    where m.org_id = oid and m.user_id = auth.uid() and coalesce(m.status, 'active') = 'active'
      and (m.expires_at is null or m.expires_at > now())
      and (m.company_ids is null or array_length(m.company_ids, 1) is null)
      and (m.role in ('owner','admin') or coalesce((
            select r.full_access or r.can_manage_roles from public.roles r
             where r.slug = m.role and (r.org_id = m.org_id or r.org_id is null)
             order by (r.org_id is not null) desc limit 1), false)))
$fn$;

create or replace function public.my_company_ids() returns setof uuid language sql stable security definer set search_path = public as $fn$
  select id from public.companies where public.is_platform_admin()
  union
  select c.id from public.companies c
  join public.org_members m on m.org_id = c.org_id
  where m.user_id = auth.uid()
    and coalesce(m.status, 'active') = 'active'
    and (m.expires_at is null or m.expires_at > now())
    and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
$fn$;

create or replace function public.can_manage_team(p_org uuid) returns boolean language sql stable security definer set search_path = public as $fn$
  select public.is_platform_writer()
      or (coalesce((select (r.full_access or r.can_manage_roles) from public.member_role_row(p_org, auth.uid()) r), false)
          and exists (select 1 from public.org_members m
                       where m.org_id = p_org and m.user_id = auth.uid()
                         and coalesce(m.status, 'active') = 'active'
                         and (m.expires_at is null or m.expires_at > now())
                         and (m.company_ids is null or array_length(m.company_ids, 1) is null)))
$fn$;

-- the two-person rules apply once a company has two or more active people who can write
create or replace function public.segregation_applies(cid uuid) returns boolean language sql stable security definer set search_path = public as $fn$
  select (select count(distinct m.user_id) from public.companies c
            join public.org_members m on m.org_id = c.org_id
           where c.id = cid and coalesce(m.status, 'active') = 'active'
             and (m.expires_at is null or m.expires_at > now())
             and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
             and public._role_writes(m.org_id, m.role)) >= 2
$fn$;

-- 4. approvals
create or replace function public.approval_limit_ok(cid uuid, p_doc text, p_amount numeric) returns boolean language plpgsql stable security definer set search_path = public as $fn$
declare r public.roles; lim text;
begin
  if public.is_platform_writer() then return true; end if;
  select * into r from public.my_role_in(cid);
  if r.slug is null then return false; end if;
  if r.full_access then return true; end if;
  -- a role made before limits existed signs off as before: any member who can write
  if r.approval_limits is null then return public.can_write_company(cid); end if;
  lim := r.approval_limits ->> p_doc;
  if lim is null then return false; end if;
  if lim = 'any' then return true; end if;
  return coalesce(p_amount, 0) <= lim::numeric;
exception when invalid_text_representation then return false;
end $fn$;

create or replace function public.can_decide_approval(p_approval uuid) returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1
      from public.approvals a
      left join public.approval_rules r on r.id = a.rule_id
     where a.id = p_approval
       and a.company_id in (select public.my_company_ids())
       -- nobody signs off what they raised
       and not (lower(coalesce(a.requested_by, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
                and public.segregation_applies(a.company_id))
       and (
         -- the rule names me
         (r.approver_employee_id is not null and exists (select 1 from public.hr_employees e
                                                         where e.id = r.approver_employee_id and e.user_id = auth.uid()))
         -- the rule names nobody, and my role's limit covers it
         or (r.approver_employee_id is null and public.approval_limit_ok(a.company_id, a.doc_type, a.doc_amount))
         -- the requester's line manager, for their team's expenses, leave and timesheets
         or (a.doc_type in ('expense','leave','timesheet') and exists (
               select 1 from public.hr_employees req
                 join auth.users u on u.id = req.user_id
                 join public.hr_employees mgr on mgr.id = req.manager_id
                where req.company_id = a.company_id
                  and lower(u.email) = lower(coalesce(a.requested_by, ''))
                  and mgr.user_id = auth.uid()))
         -- or I run the organisation
         or public.can_manage_team((select c.org_id from public.companies c where c.id = a.company_id))
       )
  )
$fn$;

create or replace function public.approval_is_mine(p_approval uuid) returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.approvals a where a.id = p_approval and a.status = 'pending')
     and public.can_decide_approval(p_approval)
$fn$;

-- the pending requests the signed-in person may decide, for the inbox's buttons
create or replace function public.approvals_i_can_decide(p_company uuid) returns setof uuid language sql stable security definer set search_path = public as $fn$
  select a.id from public.approvals a
   where a.company_id = p_company and a.status = 'pending'
     and a.company_id in (select public.my_company_ids())
     and public.can_decide_approval(a.id)
$fn$;
revoke all on function public.approvals_i_can_decide(uuid) from public, anon;
grant execute on function public.approvals_i_can_decide(uuid) to authenticated, service_role;

-- an email decision link cannot be used by the person who raised the request
create or replace function public.approval_decide(p_token text, p_decision text, p_note text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $fn$
declare a record; who text; note text; lbl text;
begin
  if p_decision not in ('approved','rejected') then return jsonb_build_object('ok', false, 'reason', 'bad decision'); end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'reason', 'bad token'); end if;
  select * into a from public.approvals where decide_token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if not found then return jsonb_build_object('ok', false, 'reason', 'not found'); end if;
  if a.status is distinct from 'pending' then return jsonb_build_object('ok', false, 'reason', 'already', 'status', a.status); end if;
  if a.token_expires_at is not null and a.token_expires_at < now() then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
  if lower(coalesce(a.approver_email, '')) = lower(coalesce(a.requested_by, '')) and public.segregation_applies(a.company_id) then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;
  who := coalesce(nullif(a.approver_email, ''), 'email link');
  note := nullif(btrim(coalesce(p_note, '')), '');
  lbl := coalesce(nullif(a.doc_number, ''), a.doc_type, 'request');
  update public.approvals set status = p_decision, decided_by = who, decided_at = now(), approver_note = coalesce(note, '') where id = a.id;
  insert into public.notifications (company_id, kind, title, body, link_action, link_id, actor_name, dedupe_key)
    values (a.company_id, 'approval_result', (case when p_decision = 'approved' then 'Approved: ' else 'Rejected: ' end) || lbl,
            coalesce(note, 'Decided by email.'), a.link_action, a.doc_id, who, 'appr-' || a.id::text || '-' || p_decision)
    on conflict do nothing;
  return jsonb_build_object('ok', true, 'status', p_decision);
end $fn$;

-- 5. one person never both changes where a supplier's money goes and sends it
alter table public.partner_bank_accounts add column if not exists changed_by uuid;
alter table public.partner_bank_accounts add column if not exists changed_at timestamptz;
create or replace function public.stamp_bank_change() returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is not null then new.changed_by := auth.uid(); new.changed_at := now(); end if;
  return new;
end $fn$;
drop trigger if exists trg_stamp_bank_change on public.partner_bank_accounts;
create trigger trg_stamp_bank_change before insert or update on public.partner_bank_accounts
  for each row execute function public.stamp_bank_change();

alter table public.payments add column if not exists created_by uuid;
create or replace function public.guard_payment_people() returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null then return new; end if;
  if new.created_by is null then new.created_by := auth.uid(); end if;
  if new.payment_type = 'outbound' and new.partner_id is not null and public.segregation_applies(new.company_id)
     and exists (select 1 from public.partner_bank_accounts b
                  where b.partner_id = new.partner_id and b.changed_by = auth.uid()
                    and b.changed_at > now() - interval '90 days') then
    raise exception 'You changed this supplier''s bank details in the last 90 days, so someone else has to record payments to them. One person never both changes where money goes and sends it.';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_guard_payment_people on public.payments;
create trigger trg_guard_payment_people before insert on public.payments
  for each row execute function public.guard_payment_people();

-- 6. whoever records payments through a bank does not reconcile it
create or replace function public.guard_reconcile_people() returns trigger language plpgsql security definer set search_path = public as $fn$
declare st public.bank_statements; d date;
begin
  if auth.uid() is null or not (new.is_reconciled and not coalesce(old.is_reconciled, false)) then return new; end if;
  if not public.segregation_applies(new.company_id) then return new; end if;
  select * into st from public.bank_statements where id = new.statement_id;
  if st.id is null then return new; end if;
  d := coalesce(new.line_date, st.statement_date, current_date);
  if exists (select 1 from public.payments p
              where p.company_id = new.company_id and p.journal_id = st.journal_id and p.created_by = auth.uid()
                and p.date between d - 31 and d + 31) then
    raise exception 'You recorded payments through this bank account around this date, so someone else has to reconcile it. Reconciling is the check on the recording, so it takes a second person.';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_guard_reconcile_people on public.bank_statement_lines;
create trigger trg_guard_reconcile_people before update on public.bank_statement_lines
  for each row execute function public.guard_reconcile_people();

-- 7. payroll is approved by someone other than the person posting it
create or replace function public.guard_payroll_people() returns trigger language plpgsql security definer set search_path = public as $fn$
declare me text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or new.state is not distinct from old.state or new.state <> 'confirmed' or old.state <> 'draft' then return new; end if;
  if not public.segregation_applies(new.company_id) then return new; end if;
  if exists (select 1 from public.approvals a
              where a.company_id = new.company_id and a.doc_type = 'payroll' and a.status = 'approved'
                and a.doc_id::text in (new.id::text, coalesce(new.run_id::text, ''))
                and lower(coalesce(a.decided_by, '')) <> me) then
    return new;
  end if;
  raise exception 'Payroll is prepared by one person and approved by another. Send it for approval, and post it once someone else has approved it.';
end $fn$;
drop trigger if exists trg_guard_payroll_people on public.hr_payslips;
create trigger trg_guard_payroll_people before update on public.hr_payslips
  for each row execute function public.guard_payroll_people();

-- 8. only someone who manages Accounting closes or reopens a period
create or replace function public.guard_period_lock_people() returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null or public.is_platform_writer() then return new; end if;
  if (new.lock_date is distinct from old.lock_date or new.period_lock_date is distinct from old.period_lock_date)
     and public.app_level(new.id, 'accounting') <> 'M' then
    raise exception 'Only someone who manages Accounting, such as the finance manager or the owner, can close or reopen a period.';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_guard_period_lock on public.companies;
create trigger trg_guard_period_lock before update on public.companies
  for each row execute function public.guard_period_lock_people();

-- 9. roles: managed by whoever manages the team, never beyond what they hold
drop policy if exists roles_w on public.roles;
create policy roles_w on public.roles for all
  using (org_id is not null and public.can_manage_team(org_id))
  with check (org_id is not null and public.can_manage_team(org_id));

create or replace function public.guard_role_grants() returns trigger language plpgsql security definer set search_path = public as $fn$
declare me public.roles; v_org uuid; k text; v jsonb;
begin
  if auth.uid() is null or public.is_platform_writer() then return coalesce(new, old); end if;
  v_org := coalesce(new.org_id, old.org_id);
  select * into me from public.member_role_row(v_org, auth.uid());
  if me.slug is null then raise exception 'You do not hold a role in this organisation.'; end if;
  if me.full_access then return coalesce(new, old); end if;
  if tg_op in ('UPDATE','DELETE') then
    if old.protected then raise exception 'This role is locked so no one can weaken it.'; end if;
    if old.rank >= coalesce(me.rank, 0) then raise exception 'You can only change roles ranked below your own.'; end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.full_access then raise exception 'Only an owner can give a role full access.'; end if;
  if new.rank >= coalesce(me.rank, 0) then raise exception 'A role you create or change must rank below your own.'; end if;
  if coalesce(new.can_manage_roles, false) and not coalesce(me.can_manage_roles, false) then
    raise exception 'You cannot let a role manage roles, because your own role cannot.'; end if;
  if coalesce(new.see_costs, false) and not coalesce(me.see_costs, me.can_see_money, true) then
    raise exception 'You cannot let a role see costs and margins, because your own role does not.'; end if;
  if coalesce(new.see_salaries, false) and not coalesce(me.see_salaries, me.can_see_money, true) then
    raise exception 'You cannot let a role see salaries, because your own role does not.'; end if;
  if coalesce(new.see_bank, false) and not coalesce(me.see_bank, me.can_see_money, true) then
    raise exception 'You cannot let a role see bank and cash, because your own role does not.'; end if;
  for k, v in select key, value from jsonb_each(coalesce(new.permissions, '{}'::jsonb)) loop
    if k <> '*' and public._lvl_rank(public._lvl_of(v)) > public._lvl_rank(public.perm_level(me.permissions, k)) then
      raise exception 'You cannot give a role more access to % than your own role has.', k;
    end if;
  end loop;
  return new;
end $fn$;
drop trigger if exists trg_guard_role_grants on public.roles;
create trigger trg_guard_role_grants before insert or update or delete on public.roles
  for each row execute function public.guard_role_grants();

-- 10. memberships: nobody changes their own role or access; an auditor has an end date
create or replace function public.guard_member_changes() returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if auth.uid() is null or public.is_platform_writer() then return new; end if;
  if tg_op = 'UPDATE' and new.user_id = auth.uid() and coalesce(current_setting('orbit.accepting_invite', true), '') <> '1'
     and (new.role is distinct from old.role or new.company_ids is distinct from old.company_ids or new.expires_at is distinct from old.expires_at) then
    raise exception 'Nobody changes their own role or access. Ask another administrator.';
  end if;
  if new.role = 'external_auditor' and new.expires_at is null then
    raise exception 'An auditor''s account needs an end date. Set when their access ends, then give them the role.';
  end if;
  return new;
end $fn$;
drop trigger if exists trg_guard_member_changes on public.org_members;
create trigger trg_guard_member_changes before insert or update on public.org_members
  for each row execute function public.guard_member_changes();

create or replace function public.set_member_expiry(p_member uuid, p_expires timestamptz) returns void language plpgsql security definer set search_path = public as $fn$
declare mem public.org_members;
begin
  select * into mem from public.org_members where id = p_member;
  if mem.id is null then raise exception 'That member no longer exists.'; end if;
  if not public._can_admin_member(p_member) then raise exception 'You do not have permission to change this member.'; end if;
  if p_expires is null and mem.role = 'external_auditor' then raise exception 'An auditor''s account needs an end date.'; end if;
  update public.org_members set expires_at = p_expires where id = p_member;
end $fn$;
revoke all on function public.set_member_expiry(uuid, timestamptz) from public, anon;
grant execute on function public.set_member_expiry(uuid, timestamptz) to authenticated, service_role;

create or replace function public.set_invite_expiry(p_invite uuid, p_expires timestamptz) returns void language plpgsql security definer set search_path = public as $fn$
declare inv public.org_invites;
begin
  select * into inv from public.org_invites where id = p_invite;
  if inv.id is null then raise exception 'That invitation no longer exists.'; end if;
  if not public.can_manage_team(inv.org_id) then raise exception 'You do not have permission to change this invitation.'; end if;
  update public.org_invites set expires_at = p_expires where id = p_invite and status = 'pending';
end $fn$;
revoke all on function public.set_invite_expiry(uuid, timestamptz) from public, anon;
grant execute on function public.set_invite_expiry(uuid, timestamptz) to authenticated, service_role;

-- an accepted invitation carries its end date onto the membership
create or replace function public.accept_invite(p_invite uuid) returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare inv public.org_invites; myemail text; cid uuid;
begin
  select lower(u.email) into myemail from auth.users u where u.id = auth.uid();
  select * into inv from public.org_invites where id = p_invite and status = 'pending';
  if inv.id is null then raise exception 'This invitation is no longer valid.'; end if;
  if lower(inv.email) <> coalesce(myemail, '') then raise exception 'This invitation was sent to a different email address.'; end if;
  perform set_config('orbit.accepting_invite', '1', true);
  insert into public.org_members(user_id, org_id, role, company_ids, invited_by, status, joined_at, expires_at)
    values (auth.uid(), inv.org_id, inv.role, inv.company_ids, inv.invited_by, 'active', now(), inv.expires_at)
    on conflict (user_id, org_id) do update set role = excluded.role, company_ids = excluded.company_ids, status = 'active', expires_at = excluded.expires_at;
  perform set_config('orbit.accepting_invite', '', true);
  update public.org_invites set status = 'accepted', accepted_at = now(), accepted_by = auth.uid() where id = inv.id;
  select id into cid from public.companies where org_id = inv.org_id
    and (inv.company_ids is null or array_length(inv.company_ids, 1) is null or id = any(inv.company_ids))
    order by name limit 1;
  update public.profiles set active_org_id = inv.org_id, active_company_id = coalesce(active_company_id, cid)
    where id = auth.uid() and (active_company_id is null);
  return inv.org_id;
end $fn$;

-- grants on the new helpers
revoke all on function public.my_member_in(uuid) from public, anon;
revoke all on function public.my_role_in(uuid) from public, anon;
revoke all on function public.app_level(uuid, text) from public, anon;
revoke all on function public.can_write_app(uuid, text[]) from public, anon;
revoke all on function public.can_manage_app(uuid, text[]) from public, anon;
revoke all on function public.can_see(uuid, text) from public, anon;
revoke all on function public._role_writes(uuid, text) from public, anon;
revoke all on function public.segregation_applies(uuid) from public, anon;
revoke all on function public.approval_limit_ok(uuid, text, numeric) from public, anon;
grant execute on function public.my_member_in(uuid) to authenticated, service_role;
grant execute on function public.my_role_in(uuid) to authenticated, service_role;
grant execute on function public.app_level(uuid, text) to authenticated, service_role;
grant execute on function public.can_write_app(uuid, text[]) to authenticated, service_role;
grant execute on function public.can_manage_app(uuid, text[]) to authenticated, service_role;
grant execute on function public.can_see(uuid, text) to authenticated, service_role;
grant execute on function public._role_writes(uuid, text) to authenticated, service_role;
grant execute on function public.segregation_applies(uuid) to authenticated, service_role;
grant execute on function public.approval_limit_ok(uuid, text, numeric) to authenticated, service_role;

-- 11. where each template sits in the role picker, and the templates themselves
update public.roles set template_group = 'Leadership and administration' where org_id is null and slug = 'owner' and template_group is null;
update public.roles set template_group = 'Earlier roles'
 where org_id is null and slug in ('developer','super_admin','admin','administrative_manager','manager','junior_administrator','junior_engineer') and template_group is null;

with t(slug, label, description, rank, can_manage_roles, see_costs, see_salaries, see_bank, permissions, approval_limits, template_group) as (values
  ('general_manager', 'General Manager', 'Runs the company: sells, buys and delivers, reads the books, and signs what the managers cannot.', 85, false, true, true, true, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"V","v":true,"m":false},"crm":{"lvl":"M","v":true,"m":true},"sales":{"lvl":"M","v":true,"m":true},"estimation":{"lvl":"M","v":true,"m":true},"purchase":{"lvl":"M","v":true,"m":true},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"V","v":true,"m":false},"projects":{"lvl":"M","v":true,"m":true,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"M","v":true,"m":true},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"V","v":true,"m":false,"f":{"payroll":true}},"recruitment":{"lvl":"V","v":true,"m":false},"service":{"lvl":"V","v":true,"m":false},"appoint":{"lvl":"V","v":true,"m":false},"pos":{"lvl":"V","v":true,"m":false},"kitchen":{"lvl":"V","v":true,"m":false},"plot":{"lvl":"V","v":true,"m":false},"events":{"lvl":"V","v":true,"m":false},"website":{"lvl":"V","v":true,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"V","v":true,"m":false},"contacts":{"lvl":"M","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"purchase_order":50000,"sales_order":"any","vendor_bill":50000,"customer_invoice":"any","subcontract":50000,"variation":50000,"expense":50000,"journal_entry":50000,"leave":"any","timesheet":"any","submittal":"any","requisition":"any"}'::jsonb, 'Leadership and administration'),
  ('system_administrator', 'System Administrator', 'Users, roles, numbering, backups and privacy requests. Sees no money.', 80, true, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"V","v":true,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"M","v":true,"m":true},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{}'::jsonb, 'Leadership and administration'),
  ('external_auditor', 'External Auditor', 'Reads the books, the documents behind them and payroll for a fixed period. Changes nothing, and the account ends on a set date.', 20, false, true, true, true, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"V","v":true,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"V","v":true,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"V","v":true,"m":false,"f":{"payroll":true}},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"V","v":true,"m":false},"kitchen":{"lvl":"V","v":true,"m":false},"plot":{"lvl":"V","v":true,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"V","v":true,"m":false},"calendar":{"lvl":"V","v":true,"m":false},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{}'::jsonb, 'Leadership and administration'),
  ('finance_manager', 'Finance Manager', 'Owns the ledger: closes the month, locks periods, reconciles, files VAT and runs the reports.', 75, false, true, true, true, '{"accounting":{"lvl":"M","v":true,"m":true,"f":{"reporting":true}},"counter":{"lvl":"M","v":true,"m":true},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"V","v":true,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"V","v":true,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"V","v":true,"m":false,"f":{"payroll":true}},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"V","v":true,"m":false},"appoint":{"lvl":"V","v":true,"m":false},"pos":{"lvl":"V","v":true,"m":false},"kitchen":{"lvl":"V","v":true,"m":false},"plot":{"lvl":"V","v":true,"m":false},"events":{"lvl":"V","v":true,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"V","v":true,"m":false},"contacts":{"lvl":"M","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"vendor_bill":"any","journal_entry":"any","expense":"any","customer_invoice":"any","payroll":"any"}'::jsonb, 'Finance'),
  ('accountant', 'Accountant', 'Posts vouchers, bills and invoices, reconciles the banks and prepares the close.', 55, false, true, false, true, '{"accounting":{"lvl":"W","v":true,"m":true,"f":{"reporting":true}},"counter":{"lvl":"W","v":true,"m":true},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"V","v":true,"m":false},"appoint":{"lvl":"V","v":true,"m":false},"pos":{"lvl":"V","v":true,"m":false},"kitchen":{"lvl":"V","v":true,"m":false},"plot":{"lvl":"V","v":true,"m":false},"events":{"lvl":"V","v":true,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"journal_entry":1000,"vendor_bill":1000}'::jsonb, 'Finance'),
  ('payables_clerk', 'Payables Clerk', 'Enters supplier bills, matches them to orders and receipts, and prepares payments.', 35, false, true, false, true, '{"accounting":{"lvl":"W","v":true,"m":true,"f":{"reporting":true}},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{}'::jsonb, 'Finance'),
  ('receivables_controller', 'Receivables and Credit Controller', 'Raises invoices from certificates and orders, records receipts, chases what is overdue and sends statements.', 35, false, false, false, true, '{"accounting":{"lvl":"W","v":true,"m":true,"f":{"reporting":true}},"counter":{"lvl":"V","v":true,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":false}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"V","v":true,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{"customer_invoice":1000}'::jsonb, 'Finance'),
  ('cashier', 'Cashier', 'Runs the cash desk: money in and out to any party, and the drawer count.', 25, false, false, false, true, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"W","v":true,"m":true},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"V","v":true,"m":false},"kitchen":{"lvl":"V","v":true,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'Finance'),
  ('sales_manager', 'Sales Manager', 'The pipeline, quotes, price lists and the team''s targets.', 60, false, true, false, false, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"M","v":true,"m":true},"sales":{"lvl":"M","v":true,"m":true},"estimation":{"lvl":"M","v":true,"m":true},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"V","v":true,"m":false},"website":{"lvl":"V","v":true,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"M","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"sales_order":10000}'::jsonb, 'Sales and customers'),
  ('sales_representative', 'Sales Representative', 'Their own leads, quotes and customers.', 30, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"O","v":true,"m":true},"sales":{"lvl":"O","v":true,"m":true},"estimation":{"lvl":"V","v":true,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'Sales and customers'),
  ('estimator', 'Estimator', 'Take-offs and cost sheets for tenders; reads supplier prices.', 35, false, true, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"W","v":true,"m":true},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"V","v":true,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{}'::jsonb, 'Sales and customers'),
  ('procurement_manager', 'Procurement Manager', 'Suppliers, price lists, requests for quotation, orders and landed cost.', 60, false, true, false, false, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"V","v":true,"m":false},"purchase":{"lvl":"M","v":true,"m":true},"inventory":{"lvl":"M","v":true,"m":true},"manufacturing":{"lvl":"V","v":true,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"M","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"purchase_order":10000,"requisition":"any"}'::jsonb, 'Procurement and stock'),
  ('buyer', 'Buyer', 'Requests for quotation and draft orders, submitted for approval.', 35, false, true, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"V","v":true,"m":false},"purchase":{"lvl":"W","v":true,"m":true},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{}'::jsonb, 'Procurement and stock'),
  ('storekeeper', 'Storekeeper', 'Receives, issues, counts and moves stock. Sees quantities, not values.', 30, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"W","v":true,"m":true},"manufacturing":{"lvl":"V","v":true,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":false}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"V","v":true,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'Procurement and stock'),
  ('production_manager', 'Production Manager', 'Bills of material, work orders, the plan, capacity and inspections on the bench.', 60, false, true, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"V","v":true,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"W","v":true,"m":true},"manufacturing":{"lvl":"M","v":true,"m":true},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"V","v":true,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"requisition":"any"}'::jsonb, 'Operations'),
  ('workshop_operator', 'Workshop Operator', 'Their own work orders: scans, hours and the panels they build.', 15, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"O","v":true,"m":true},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'Operations'),
  ('project_manager', 'Project Manager', 'Their projects: budget, certificates, variations, subcontracts and the site team.', 60, false, true, false, false, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"V","v":true,"m":false},"purchase":{"lvl":"W","v":true,"m":true},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"V","v":true,"m":false},"projects":{"lvl":"M","v":true,"m":true,"f":{"delivery":true,"execution":true,"costs":true}},"site":{"lvl":"M","v":true,"m":true},"documents":{"lvl":"W","v":true,"m":true},"sign":{"lvl":"W","v":true,"m":true},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"requisition":"any","subcontract":10000,"variation":1000,"timesheet":"any","submittal":"any"}'::jsonb, 'Operations'),
  ('site_engineer', 'Site Engineer', 'The diary, snags, inspections and install jobs on their sites.', 35, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"O","v":true,"m":true,"f":{"delivery":true,"execution":true,"costs":false}},"site":{"lvl":"O","v":true,"m":true},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'Operations'),
  ('quality_inspector', 'Quality Inspector', 'Checklists and inspections in the workshop and on site; closes non-conformances.', 30, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"W","v":true,"m":true},"projects":{"lvl":"W","v":true,"m":true,"f":{"delivery":true,"execution":true,"costs":false}},"site":{"lvl":"W","v":true,"m":true},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'Operations'),
  ('document_controller', 'Document Controller', 'The drawing register, submittals, requests for information and transmittals.', 35, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"V","v":true,"m":false,"f":{"delivery":true,"execution":true,"costs":false}},"site":{"lvl":"V","v":true,"m":false},"documents":{"lvl":"M","v":true,"m":true},"sign":{"lvl":"M","v":true,"m":true},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"submittal":"any"}'::jsonb, 'Operations'),
  ('hr_manager', 'HR Manager', 'Employees, contracts, leave, appraisals and recruitment.', 70, false, false, true, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"M","v":true,"m":true,"f":{"payroll":true}},"recruitment":{"lvl":"M","v":true,"m":true},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"V","v":true,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"leave":"any","payroll":"any","expense":1000}'::jsonb, 'People'),
  ('payroll_officer', 'Payroll Officer', 'Prepares payroll runs and payslips, and the declarations that follow.', 45, false, false, true, false, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"W","v":true,"m":true,"f":{"payroll":true}},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"V","v":true,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'People'),
  ('recruiter', 'Recruiter', 'Positions and applicants. Sees no salaries.', 35, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"W","v":true,"m":true},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"V","v":true,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'People'),
  ('employee', 'Employee', 'Their own tasks, timesheets, leave, expenses and payslips, and the company knowledge.', 10, false, false, true, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"O","v":true,"m":true,"f":{"delivery":true,"execution":true,"costs":false}},"site":{"lvl":"O","v":true,"m":true},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"O","v":true,"m":true,"f":{"payroll":false}},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"V","v":true,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"-","v":false,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'People'),
  ('service_manager', 'Service Manager', 'Tickets, warranties, maintenance plans and the technicians'' schedule.', 60, false, true, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"M","v":true,"m":true},"appoint":{"lvl":"M","v":true,"m":true},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"sales_order":1000}'::jsonb, 'By industry'),
  ('field_technician', 'Field Technician', 'Their own jobs from a phone: arrive, work, parts used and the customer''s signature.', 15, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"O","v":true,"m":true},"appoint":{"lvl":"O","v":true,"m":true},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'By industry'),
  ('store_manager', 'Store or Restaurant Manager', 'The till, the kitchen, the floor, stock and the roster for their store.', 55, false, true, false, true, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"M","v":true,"m":true},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"W","v":true,"m":true},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"V","v":true,"m":false,"f":{"payroll":false}},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"M","v":true,"m":true},"kitchen":{"lvl":"M","v":true,"m":true},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{}'::jsonb, 'By industry'),
  ('waiter_cashier', 'Waiter or Cashier', 'Their own orders and sessions at the till or on the floor.', 10, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"O","v":true,"m":true},"kitchen":{"lvl":"O","v":true,"m":true},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'By industry'),
  ('kitchen_staff', 'Chef or Kitchen Staff', 'The kitchen display and recipes. No prices.', 10, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"-","v":false,"m":false},"sales":{"lvl":"-","v":false,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"V","v":true,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"O","v":true,"m":true},"kitchen":{"lvl":"O","v":true,"m":true},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"-","v":false,"m":false}}'::jsonb, '{}'::jsonb, 'By industry'),
  ('property_manager', 'Property Manager', 'Buildings, units, owners, charges, meetings and the resident portal.', 60, false, true, false, true, '{"accounting":{"lvl":"V","v":true,"m":false,"f":{"reporting":true}},"counter":{"lvl":"V","v":true,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"W","v":true,"m":true},"sign":{"lvl":"W","v":true,"m":true},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"M","v":true,"m":true},"events":{"lvl":"-","v":false,"m":false},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"vendor_bill":1000}'::jsonb, 'By industry'),
  ('events_planner', 'Events Planner', 'Events: guests, seating, suppliers, budget and payments.', 45, false, true, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"V","v":true,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"V","v":true,"m":false},"sign":{"lvl":"V","v":true,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"M","v":true,"m":true},"website":{"lvl":"-","v":false,"m":false},"knowledge":{"lvl":"V","v":true,"m":false},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"W","v":true,"m":true},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{"purchase_order":1000}'::jsonb, 'By industry'),
  ('website_editor', 'Marketing and Website Editor', 'The website, knowledge articles and campaigns from the CRM.', 30, false, false, false, false, '{"accounting":{"lvl":"-","v":false,"m":false},"counter":{"lvl":"-","v":false,"m":false},"crm":{"lvl":"V","v":true,"m":false},"sales":{"lvl":"V","v":true,"m":false},"estimation":{"lvl":"-","v":false,"m":false},"purchase":{"lvl":"-","v":false,"m":false},"inventory":{"lvl":"-","v":false,"m":false},"manufacturing":{"lvl":"-","v":false,"m":false},"projects":{"lvl":"-","v":false,"m":false},"site":{"lvl":"-","v":false,"m":false},"documents":{"lvl":"-","v":false,"m":false},"sign":{"lvl":"-","v":false,"m":false},"employees":{"lvl":"-","v":false,"m":false},"recruitment":{"lvl":"-","v":false,"m":false},"service":{"lvl":"-","v":false,"m":false},"appoint":{"lvl":"-","v":false,"m":false},"pos":{"lvl":"-","v":false,"m":false},"kitchen":{"lvl":"-","v":false,"m":false},"plot":{"lvl":"-","v":false,"m":false},"events":{"lvl":"V","v":true,"m":false},"website":{"lvl":"M","v":true,"m":true},"knowledge":{"lvl":"M","v":true,"m":true},"settings":{"lvl":"-","v":false,"m":false},"contacts":{"lvl":"V","v":true,"m":false},"calendar":{"lvl":"W","v":true,"m":true},"insights":{"lvl":"V","v":true,"m":false}}'::jsonb, '{}'::jsonb, 'By industry')
),
upd as (
  update public.roles r set label = t.label, description = t.description, rank = t.rank, can_manage_roles = t.can_manage_roles,
         see_costs = t.see_costs, see_salaries = t.see_salaries, see_bank = t.see_bank, can_see_money = t.see_costs,
         permissions = t.permissions, approval_limits = t.approval_limits, template_group = t.template_group
    from t where r.org_id is null and r.slug = t.slug and r.template_group is not null and r.template_group <> 'Earlier roles'
  returning r.slug
)
insert into public.roles (org_id, slug, label, description, rank, is_system, protected, full_access, can_manage_roles, can_see_money,
                          see_costs, see_salaries, see_bank, permissions, approval_limits, template_group)
select null, t.slug, t.label, t.description, t.rank, true, false, false, t.can_manage_roles, t.see_costs,
       t.see_costs, t.see_salaries, t.see_bank, t.permissions, t.approval_limits, t.template_group
  from t where not exists (select 1 from public.roles r where r.org_id is null and r.slug = t.slug);
