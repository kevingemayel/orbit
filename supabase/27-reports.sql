-- ============================================================================
--  Spacework ERP  -  REPORTS / DASHBOARD BUILDER  (run AFTER 01-26)
--   Saved widgets for the self-serve Insights dashboard. Each report names a
--   data source, a measure (count / sum of a field), a group-by dimension and
--   a chart type. The app computes the numbers live from the source table.
--  Company-scoped RLS.
-- ============================================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Report',
  source text not null default 'inv_out',      -- key into the app's source registry
  measure text not null default 'count',        -- count | <measure key>
  group_by text default '',                     -- dimension key ('' = single KPI total)
  chart text default 'bar',                     -- kpi | bar | line | table
  sort_order int default 10,
  created_at timestamptz default now()
);
create index if not exists idx_reports on public.reports(company_id, sort_order);

alter table public.reports enable row level security;
drop policy if exists reports_r on public.reports;
drop policy if exists reports_w on public.reports;
create policy reports_r on public.reports for select using (company_id in (select public.my_company_ids()));
create policy reports_w on public.reports for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'reports' t, count(*) n from public.reports;
