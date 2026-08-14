-- ============================================================================
--  Spacework ERP  -  MANUFACTURING / FABRICATION  (run AFTER 01-15)
--  Bills of materials + work orders for fabricating facade units. Completing a
--  work order consumes its BOM components from stock (material cost booked to the
--  work order's project) and records the fabricated quantity. Company-scoped RLS.
-- ============================================================================
create table if not exists public.boms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,   -- finished product
  name text not null default 'BOM',
  output_qty numeric(20,4) default 1,                                   -- units produced per BOM run
  notes text default '', is_active boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.bom_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bom_id uuid not null references public.boms(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,    -- component
  name text default '', quantity numeric(20,4) default 1, unit text default '', sequence int default 10
);
create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', product_id uuid references public.products(id) on delete set null,   -- finished
  bom_id uuid references public.boms(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  quantity numeric(20,4) default 1, quantity_done numeric(20,4) default 0,
  state text default 'draft',                    -- draft | in_progress | done | cancel
  date_planned date default current_date, notes text default '',
  created_at timestamptz default now()
);
create index if not exists idx_wo_company on public.work_orders(company_id, state);

do $rls$ declare t text;
begin
  foreach t in array array['boms','bom_lines','work_orders'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;
