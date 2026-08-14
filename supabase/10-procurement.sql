-- ============================================================================
--  Spacework ERP  -  CONTRACTOR PROCUREMENT + INVENTORY  (run AFTER 01-09)
--  Purchase: material requisitions, subcontract payment certificates (payables
--  IPC with retention -> vendor bill). Inventory: units of measure, material
--  issue to project (stock_moves.project_id). Company-scoped RLS.
-- ============================================================================

-- units of measure ----------------------------------------------------------
create table if not exists public.uoms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,                       -- m, m2, kg, pcs, box, tube ...
  category text default 'unit',             -- length | area | volume | weight | unit
  is_active boolean default true
);

-- material issue to a project (consume stock to a site/project) -------------
alter table public.stock_moves add column if not exists project_id uuid references public.projects(id) on delete set null;

-- material requisitions (site material requests) ----------------------------
create table if not exists public.material_requisitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', project_id uuid references public.projects(id) on delete set null,
  requested_by text default '', req_date date default current_date,
  note text default '', state text default 'draft',  -- draft | approved | ordered
  created_at timestamptz default now()
);
create table if not exists public.material_requisition_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requisition_id uuid not null references public.material_requisitions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text default '', quantity numeric(20,4) default 0, uom text default '', sequence int default 10
);

-- subcontract payment certificates (payables side of the IPC) ---------------
create table if not exists public.subcontract_certificates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subcontract_id uuid not null references public.subcontracts(id) on delete cascade,
  number text default '', date_to date default current_date,
  percent_complete numeric(7,3) default 0,
  gross_to_date numeric(20,4) default 0,
  retention_pct numeric(6,2) default 0, retention_amount numeric(20,4) default 0,
  net_to_date numeric(20,4) default 0,
  previous_certified numeric(20,4) default 0, current_certified numeric(20,4) default 0,
  state text default 'draft',               -- draft | certified | billed
  bill_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_subcert on public.subcontract_certificates(company_id, subcontract_id, date_to);

-- ---------------------------------------------------------------------------
--  RLS (company-scoped)
-- ---------------------------------------------------------------------------
do $$ declare t text;
begin
  foreach t in array array[
    'uoms','material_requisitions','material_requisition_lines','subcontract_certificates'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  SEED: common construction units of measure per company that has none
-- ---------------------------------------------------------------------------
do $$ declare c record;
begin
  for c in select id from public.companies loop
    if not exists (select 1 from public.uoms u where u.company_id = c.id) then
      insert into public.uoms(company_id, name, category) values
        (c.id,'pcs','unit'),(c.id,'ea','unit'),(c.id,'set','unit'),(c.id,'m','length'),
        (c.id,'m2','area'),(c.id,'m3','volume'),(c.id,'kg','weight'),(c.id,'ton','weight'),
        (c.id,'ltr','volume'),(c.id,'box','unit'),(c.id,'roll','unit'),(c.id,'tube','unit'),
        (c.id,'bag','unit'),(c.id,'sheet','unit'),(c.id,'ls','unit');
    end if;
  end loop;
end $$;
