-- ============================================================================
--  Spacework ERP  -  CONTRACTOR: retention RELEASE tracking
--  Records each retention release (cash event) so the Retention report can show
--  held vs released vs outstanding per project (client side) and per subcontract
--  (subcontractor side). The cash journal entry is posted by the app; this table
--  keeps the per-entity released amount the GL balance alone can't split out.
-- ============================================================================
create table if not exists public.retention_releases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  side text not null,                                  -- client | sub
  project_id uuid references public.projects(id) on delete set null,
  subcontract_id uuid references public.subcontracts(id) on delete set null,
  amount numeric(20,4) default 0,
  release_date date default current_date,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.retention_releases enable row level security;
drop policy if exists retention_releases_r on public.retention_releases;
drop policy if exists retention_releases_w on public.retention_releases;
create policy retention_releases_r on public.retention_releases for select using (company_id in (select public.my_company_ids()));
create policy retention_releases_w on public.retention_releases for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));
