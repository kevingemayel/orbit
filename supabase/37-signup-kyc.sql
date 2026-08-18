-- ============================================================================
--  Spacework ERP  -  gated KYC signup + approval (run AFTER 01-36)
--  New signups create a PENDING org (no app access) with KYC + T&C acceptance;
--  a platform admin approves/rejects. Existing orgs default to 'active'.
-- ============================================================================
alter table public.orgs add column if not exists status         text not null default 'active';  -- active | pending | rejected
alter table public.orgs add column if not exists business_type  text;
alter table public.orgs add column if not exists scope_of_work  text;
alter table public.orgs add column if not exists employee_count text;
alter table public.orgs add column if not exists contact_phone  text;
alter table public.orgs add column if not exists country        text;
alter table public.orgs add column if not exists city           text;
alter table public.orgs add column if not exists reg_no         text;
alter table public.orgs add column if not exists tc_version     text;
alter table public.orgs add column if not exists tc_accepted_at timestamptz;
alter table public.orgs add column if not exists applied_at     timestamptz;

-- self-serve APPLICATION: creates a pending org + company + owner membership + records KYC & T&C
create or replace function public.apply_for_company(
  p_company text, p_country text, p_business_type text, p_scope text,
  p_employees text, p_phone text, p_city text default '', p_reg_no text default '',
  p_currency text default 'USD', p_tc_version text default 'v1'
) returns uuid language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); oid uuid; cid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.orgs(name, ref_currency, created_by, status, country, city, business_type,
                          scope_of_work, employee_count, contact_phone, reg_no, tc_version, tc_accepted_at, applied_at)
    values (coalesce(nullif(btrim(p_company),''),'My Company'), coalesce(nullif(p_currency,''),'USD'), uid, 'pending',
            p_country, nullif(p_city,''), p_business_type, p_scope, p_employees, p_phone, nullif(p_reg_no,''),
            p_tc_version, now(), now())
    returning id into oid;
  insert into public.org_members(user_id, org_id, role) values (uid, oid, 'owner');
  insert into public.companies(org_id, name, currency_code, country)
    values (oid, coalesce(nullif(btrim(p_company),''),'My Company'), coalesce(nullif(p_currency,''),'USD'), p_country)
    returning id into cid;
  insert into public.currencies(org_id, code, name, decimals)
    values (oid, coalesce(nullif(p_currency,''),'USD'), 'Currency', 2) on conflict do nothing;
  update public.profiles set active_org_id=oid, active_company_id=cid where id=uid;
  return oid;
end; $$;
revoke all on function public.apply_for_company(text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.apply_for_company(text,text,text,text,text,text,text,text,text,text) to authenticated;

-- platform admin approves / rejects
create or replace function public.set_org_status(p_org uuid, p_status text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_platform_admin() then raise exception 'not allowed'; end if;
  if p_status not in ('active','pending','rejected') then raise exception 'bad status'; end if;
  update public.orgs set status = p_status where id = p_org;
end; $$;
grant execute on function public.set_org_status(uuid,text) to authenticated;

-- platform admin: list pending applications (bypasses tenant isolation, admin-only)
create or replace function public.pending_signups()
returns setof public.orgs language sql stable security definer set search_path=public as $$
  select * from public.orgs where public.is_platform_admin() and status = 'pending' order by applied_at desc nulls last;
$$;
grant execute on function public.pending_signups() to authenticated;

select 'signup kyc ready' as done;
