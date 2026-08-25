-- ============================================================================
--  Orbit ERP  -  INSPECTION WORKFLOW (feature #6)
--  Reusable inspection checklists (templates), per-inspection pass/fail results,
--  inspection sign-off, and a real snag lifecycle (open -> in_progress -> fixed
--  -> verified -> closed) with timestamps. Company-scoped RLS.
-- ============================================================================

create table if not exists public.inspection_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Checklist',
  insp_type text default 'quality',
  is_active boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.inspection_template_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid not null references public.inspection_templates(id) on delete cascade,
  description text not null default '',
  sequence int default 10
);
create table if not exists public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  description text not null default '',
  result text default 'na',          -- pass | fail | na
  note text default '',
  sequence int default 10
);
create index if not exists idx_inspection_items on public.inspection_items(company_id, inspection_id, sequence);

alter table public.inspections add column if not exists result text default '';
alter table public.inspections add column if not exists signed_by text default '';
alter table public.inspections add column if not exists signed_at timestamptz;
alter table public.snags add column if not exists fixed_at timestamptz;
alter table public.snags add column if not exists verified_at timestamptz;
alter table public.snags add column if not exists closed_at timestamptz;

alter table public.inspection_templates enable row level security;
drop policy if exists itmpl_r on public.inspection_templates;
create policy itmpl_r on public.inspection_templates for select using (company_id in (select public.my_company_ids()));
drop policy if exists itmpl_w on public.inspection_templates;
create policy itmpl_w on public.inspection_templates for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.inspection_template_items enable row level security;
drop policy if exists itmpli_r on public.inspection_template_items;
create policy itmpli_r on public.inspection_template_items for select using (company_id in (select public.my_company_ids()));
drop policy if exists itmpli_w on public.inspection_template_items;
create policy itmpli_w on public.inspection_template_items for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.inspection_items enable row level security;
drop policy if exists iitems_r on public.inspection_items;
create policy iitems_r on public.inspection_items for select using (company_id in (select public.my_company_ids()));
drop policy if exists iitems_w on public.inspection_items;
create policy iitems_w on public.inspection_items for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'inspection workflow ready' as done;
