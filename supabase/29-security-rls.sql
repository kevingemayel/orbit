-- ============================================================================
--  Spacework ERP  -  SECURITY HARDENING: enable RLS on unprotected tables
--   Go-live audit found 4 public tables with RLS OFF (reachable via the anon
--   key). This locks them. my_company_ids() and can_write_company() are
--   SECURITY DEFINER, so they keep working (they bypass RLS).
--   - user_company_access  : the access-control map. Users may read only their
--                            own rows; only existing company writers may change
--                            grants. Closes a self-escalation hole.
--   - consolidation_*       : owner/company-scoped group consolidation data.
-- ============================================================================

-- 1. user_company_access (user_id, company_id, role)
alter table public.user_company_access enable row level security;
drop policy if exists uca_r on public.user_company_access;
drop policy if exists uca_w on public.user_company_access;
create policy uca_r on public.user_company_access for select
  using (user_id = auth.uid() or public.can_write_company(company_id));
create policy uca_w on public.user_company_access for all
  using (public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- 2. consolidation_group_companies (group_id, company_id, ...)
alter table public.consolidation_group_companies enable row level security;
drop policy if exists cgc_r on public.consolidation_group_companies;
drop policy if exists cgc_w on public.consolidation_group_companies;
create policy cgc_r on public.consolidation_group_companies for select
  using (company_id in (select public.my_company_ids()));
create policy cgc_w on public.consolidation_group_companies for all
  using (public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- 3. consolidation_adjustments (run_id, company_id, ...)
alter table public.consolidation_adjustments enable row level security;
drop policy if exists cadj_r on public.consolidation_adjustments;
drop policy if exists cadj_w on public.consolidation_adjustments;
create policy cadj_r on public.consolidation_adjustments for select
  using (company_id in (select public.my_company_ids()));
create policy cadj_w on public.consolidation_adjustments for all
  using (public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- 4. consolidation_runs (group_id, ... ; no company_id -> scope via the group)
alter table public.consolidation_runs enable row level security;
drop policy if exists crun_r on public.consolidation_runs;
drop policy if exists crun_w on public.consolidation_runs;
create policy crun_r on public.consolidation_runs for select
  using (exists (select 1 from public.consolidation_group_companies g
                 where g.group_id = consolidation_runs.group_id
                   and g.company_id in (select public.my_company_ids())));
create policy crun_w on public.consolidation_runs for all
  using (exists (select 1 from public.consolidation_group_companies g
                 where g.group_id = consolidation_runs.group_id
                   and public.can_write_company(g.company_id)))
  with check (exists (select 1 from public.consolidation_group_companies g
                 where g.group_id = consolidation_runs.group_id
                   and public.can_write_company(g.company_id)));

-- verify: these four should now report rls_enabled = true
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policies
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
  and c.relname in ('user_company_access','consolidation_runs','consolidation_adjustments','consolidation_group_companies')
order by c.relname;
