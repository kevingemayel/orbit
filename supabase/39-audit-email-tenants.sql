-- ============================================================================
--  Spacework ERP  -  audit actor email + tenants console  (run AFTER 38)
--  (deployed live via the Management API during the session; kept here for record)
-- ============================================================================

-- capture the actor's email on each audit row (readable log without joining auth.users)
alter table public.audit_log add column if not exists actor_email text;
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $$
declare em text := nullif(current_setting('request.jwt.claims', true), '')::json->>'email';
begin
  begin
    if TG_OP = 'DELETE' then
      insert into public.audit_log(company_id, table_name, row_id, action, actor, actor_email) values (OLD.company_id, TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), em);
      return OLD;
    else
      insert into public.audit_log(company_id, table_name, row_id, action, actor, actor_email) values (NEW.company_id, TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), em);
      return NEW;
    end if;
  exception when others then
    if TG_OP = 'DELETE' then return OLD; else return NEW; end if;
  end;
end; $$;

-- platform admins can read every org (for the Tenants console)
drop policy if exists orgs_platform_r on public.orgs;
create policy orgs_platform_r on public.orgs for select using (public.is_platform_admin());

create or replace function public.all_tenants()
returns table(org_id uuid, org_name text, status text, business_type text, country text, applied_at timestamptz, companies bigint, members bigint)
language sql stable security definer set search_path=public as $$
  select o.id, o.name, o.status, o.business_type, o.country, o.applied_at,
         (select count(*) from public.companies c where c.org_id=o.id),
         (select count(*) from public.org_members m where m.org_id=o.id)
  from public.orgs o
  where public.is_platform_admin()
  order by o.created_at desc;
$$;
grant execute on function public.all_tenants() to authenticated;
