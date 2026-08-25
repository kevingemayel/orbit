-- ============================================================================
--  Orbit ERP  -  STOCK RESERVATIONS (cut-list / material-plan flow)
--  A reservation commits available stock to a project/cut-list WITHOUT moving it.
--  Available = on-hand (sum of done stock_moves) minus active reservations.
--  Reservations never create stock_moves or valuation, so on-hand is unchanged;
--  they only reduce what is AVAILABLE to reserve elsewhere. Company-scoped RLS.
-- ============================================================================

create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  location_id uuid references public.stock_locations(id) on delete set null,
  qty numeric(20,4) default 0,
  uom text default '',
  project_id uuid references public.projects(id) on delete set null,
  source_type text default 'cutlist',      -- cutlist | manual | requisition
  source_ref text default '',
  status text default 'active',             -- active | released | consumed
  note text default '',
  created_at timestamptz default now()
);
create index if not exists idx_stock_reservations on public.stock_reservations(company_id, product_id, status);

alter table public.stock_reservations enable row level security;
drop policy if exists sres_r on public.stock_reservations;
create policy sres_r on public.stock_reservations for select using (company_id in (select public.my_company_ids()));
drop policy if exists sres_w on public.stock_reservations;
create policy sres_w on public.stock_reservations for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'stock reservations ready' as done;
