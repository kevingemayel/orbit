-- ============================================================================
--  Orbit ERP  -  UNIT / PANEL TRACKING (feature #2)
--  Each fabricated unit (facade panel, frame, module) is tracked individually
--  with a QR code through: fabrication -> ready -> delivered -> installed.
--  Linked to a project and (optionally) a work order. Company-scoped RLS.
-- ============================================================================

create table if not exists public.panels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  code text default '',              -- QR payload / mark number (scannable)
  label text default '',             -- panel mark / description
  zone text default '',              -- elevation / grid / floor
  width numeric(20,4),
  height numeric(20,4),
  state text default 'fabrication',  -- fabrication | ready | delivered | installed
  fabricated_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  installed_at timestamptz,
  notes text default '',
  created_at timestamptz default now()
);
create unique index if not exists idx_panels_code on public.panels(company_id, code) where code <> '';
create index if not exists idx_panels on public.panels(company_id, project_id, state);

alter table public.panels enable row level security;
drop policy if exists panels_r on public.panels;
create policy panels_r on public.panels for select using (company_id in (select public.my_company_ids()));
drop policy if exists panels_w on public.panels;
create policy panels_w on public.panels for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'panels ready' as done;
