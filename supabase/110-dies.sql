-- ============================================================================
-- 110-dies.sql  -  Extrusion / production die register (Dolphin Alloy gap).
-- Tracks each die, the profile it produces, cavities, weight per metre, its
-- status and lifetime shot count. Packing & partial billing reuse the existing
-- Delivery Notes + progress-invoicing chain. Company-scoped RLS. Safe to re-run.
-- ============================================================================
create table if not exists public.dies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  die_no text not null default '',
  name text not null default 'Die',
  product_id uuid references public.products(id) on delete set null,   -- profile produced
  cavities int default 1,
  weight_per_m numeric(20,4) default 0,
  status text default 'active',            -- active | repair | retired
  total_shots numeric(20,2) default 0,
  last_used_date date,
  location text default '',
  supplier text default '',
  notes text default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_dies on public.dies(company_id, status);

alter table public.dies enable row level security;
drop policy if exists dies_rw on public.dies;
create policy dies_rw on public.dies using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
