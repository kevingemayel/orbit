-- ============================================================================
--  Spacework ERP  -  CONTRACTOR PROJECTS  (run AFTER 01-08)
--  Turns Projects into a contractor-grade module: contract value + retention,
--  schedule of values (BOQ), variations/change orders, progress certificates
--  (IPCs) with retention + advance recovery -> client invoice, cost budgets
--  (budget vs actual), and subcontracts. Company-scoped RLS.
-- ============================================================================

-- project-level contract fields --------------------------------------------
alter table public.projects add column if not exists code text default '';
alter table public.projects add column if not exists contract_value numeric(20,4) default 0;
alter table public.projects add column if not exists retention_pct numeric(6,2) default 0;   -- % held back on each certificate
alter table public.projects add column if not exists advance_amount numeric(20,4) default 0; -- advance payment to recover

-- schedule of values / bill of quantities -----------------------------------
create table if not exists public.project_boq (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  code text default '', description text not null, unit text default '',
  quantity numeric(20,4) default 0, rate numeric(20,4) default 0,
  amount numeric(20,4) default 0,          -- quantity * rate (contract value of the line)
  sequence int default 10
);
create index if not exists idx_boq_project on public.project_boq(company_id, project_id, sequence);

-- variations / change orders ------------------------------------------------
create table if not exists public.project_variations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  number text default '', description text not null,
  amount numeric(20,4) default 0, vdate date default current_date,
  state text default 'draft'               -- draft | approved | rejected
);

-- cost budget lines ---------------------------------------------------------
create table if not exists public.project_budgets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null, description text default '',
  amount numeric(20,4) default 0           -- budgeted cost
);

-- subcontracts --------------------------------------------------------------
create table if not exists public.subcontracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  vendor_id uuid references public.partners(id) on delete set null,
  number text default '', name text not null,
  amount numeric(20,4) default 0, retention_pct numeric(6,2) default 0,
  currency_code text, state text default 'draft'   -- draft | active | closed
);

-- progress certificates (Interim Payment Certificates) ----------------------
create table if not exists public.project_certificates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  number text default '', date_to date default current_date,
  work_done numeric(20,4) default 0,          -- sum of BOQ cumulative amounts
  materials_on_site numeric(20,4) default 0,
  variations_done numeric(20,4) default 0,
  gross_to_date numeric(20,4) default 0,      -- work + materials + variations
  retention_pct numeric(6,2) default 0, retention_amount numeric(20,4) default 0,
  advance_recovery numeric(20,4) default 0,
  net_to_date numeric(20,4) default 0,        -- gross - retention - advance recovered
  previous_certified numeric(20,4) default 0, -- net_to_date of the prior certificate
  current_certified numeric(20,4) default 0,  -- payable this period = net_to_date - previous
  state text default 'draft',                 -- draft | certified | invoiced
  invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_cert_project on public.project_certificates(company_id, project_id, date_to);

create table if not exists public.project_certificate_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  certificate_id uuid not null references public.project_certificates(id) on delete cascade,
  boq_id uuid references public.project_boq(id) on delete set null,
  description text default '', contract_amount numeric(20,4) default 0,
  prev_pct numeric(7,3) default 0, cum_pct numeric(7,3) default 0,
  cum_amount numeric(20,4) default 0, prev_amount numeric(20,4) default 0,
  current_amount numeric(20,4) default 0, sequence int default 10
);

-- ---------------------------------------------------------------------------
--  RLS (company-scoped)
-- ---------------------------------------------------------------------------
do $$ declare t text;
begin
  foreach t in array array[
    'project_boq','project_variations','project_budgets','subcontracts',
    'project_certificates','project_certificate_lines'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $$;
