-- ============================================================================
--  Spacework ERP  -  OPERATIONS SCHEMA  (run AFTER accounting-core.sql)
--  The full operational data model, every module, wired to the accounting core:
--  Master data (products) · Sales/CRM · Purchasing · Inventory · Projects &
--  Services · HR · and the Invoice documents that post into the General Ledger.
--  All company-scoped, multi-tenant, Row-Level Security applied at the end.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  MASTER DATA (extends accounting-core): product & service catalog
-- ---------------------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, parent_id uuid references public.product_categories(id) on delete set null
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type text not null default 'service',        -- service | consumable | storable
  category_id uuid references public.product_categories(id) on delete set null,
  uom text default 'Unit',
  default_code text default '', barcode text default '',
  list_price numeric(20,4) default 0,          -- sales price
  cost_price numeric(20,4) default 0,          -- purchase / standard cost
  income_account_id  uuid references public.accounts(id) on delete set null,
  expense_account_id uuid references public.accounts(id) on delete set null,
  stock_account_id   uuid references public.accounts(id) on delete set null,
  sale_tax_id     uuid references public.taxes(id) on delete set null,
  purchase_tax_id uuid references public.taxes(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_products_company on public.products(company_id);

-- ---------------------------------------------------------------------------
--  SALES / CRM  (Order-to-Cash origin)
-- ---------------------------------------------------------------------------
create table if not exists public.sales_teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, leader_id uuid references auth.users(id) on delete set null
);
create table if not exists public.crm_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, sequence int default 10, is_won boolean default false
);
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, partner_id uuid references public.partners(id) on delete set null,
  contact_name text default '', email text default '', phone text default '',
  stage_id uuid references public.crm_stages(id) on delete set null,
  team_id uuid references public.sales_teams(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  expected_revenue numeric(20,4) default 0, probability numeric(5,2) default 0,
  priority int default 0, source text default '', lost_reason text default '',
  is_active boolean default true, created_at timestamptz default now()
);
create table if not exists public.sale_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text, partner_id uuid references public.partners(id) on delete restrict,
  date_order date default current_date, validity_date date,
  state text not null default 'draft',         -- draft | sent | sale | done | cancel
  currency_code text, pricelist text default '',
  team_id uuid references public.sales_teams(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid,                             -- link to a delivery project
  amount_untaxed numeric(20,4) default 0, amount_tax numeric(20,4) default 0, amount_total numeric(20,4) default 0,
  note text default '', created_at timestamptz default now()
);
create table if not exists public.sale_order_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.sale_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text default '', sequence int default 10,
  quantity numeric(20,4) default 1, qty_invoiced numeric(20,4) default 0,
  unit_price numeric(20,4) default 0, discount numeric(7,4) default 0,
  tax_id uuid references public.taxes(id) on delete set null,
  analytic_account_id uuid references public.analytic_accounts(id) on delete set null,
  price_subtotal numeric(20,4) default 0, price_total numeric(20,4) default 0
);
create index if not exists idx_so_company on public.sale_orders(company_id);
create index if not exists idx_sol_order on public.sale_order_lines(order_id);

-- ---------------------------------------------------------------------------
--  PURCHASING  (Procure-to-Pay origin)
-- ---------------------------------------------------------------------------
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text, partner_id uuid references public.partners(id) on delete restrict,
  date_order date default current_date, date_planned date,
  state text not null default 'draft',         -- draft | sent | purchase | done | cancel
  currency_code text,
  amount_untaxed numeric(20,4) default 0, amount_tax numeric(20,4) default 0, amount_total numeric(20,4) default 0,
  note text default '', created_at timestamptz default now()
);
create table if not exists public.purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text default '', quantity numeric(20,4) default 1, qty_received numeric(20,4) default 0, qty_billed numeric(20,4) default 0,
  unit_price numeric(20,4) default 0, tax_id uuid references public.taxes(id) on delete set null,
  analytic_account_id uuid references public.analytic_accounts(id) on delete set null,
  price_subtotal numeric(20,4) default 0
);
create index if not exists idx_po_company on public.purchase_orders(company_id);

-- ---------------------------------------------------------------------------
--  INVENTORY  (stock, moves, valuation -> GL)
-- ---------------------------------------------------------------------------
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, code text default ''
);
create table if not exists public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete cascade,
  name text not null, usage text not null default 'internal',   -- internal|customer|supplier|inventory|transit|production
  parent_id uuid references public.stock_locations(id) on delete set null
);
create table if not exists public.stock_lots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade, name text not null, expiry_date date
);
create table if not exists public.stock_pickings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text, type text not null default 'internal',           -- receipt|delivery|internal
  partner_id uuid references public.partners(id) on delete set null,
  location_id uuid references public.stock_locations(id) on delete set null,
  location_dest_id uuid references public.stock_locations(id) on delete set null,
  scheduled_date timestamptz, state text not null default 'draft', -- draft|waiting|assigned|done|cancel
  origin text default '', created_at timestamptz default now()
);
create table if not exists public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  picking_id uuid references public.stock_pickings(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  quantity numeric(20,4) default 0, uom text default 'Unit',
  location_id uuid references public.stock_locations(id) on delete set null,
  location_dest_id uuid references public.stock_locations(id) on delete set null,
  state text not null default 'draft', date timestamptz default now()
);
create table if not exists public.stock_move_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  move_id uuid references public.stock_moves(id) on delete cascade,
  lot_id uuid references public.stock_lots(id) on delete set null,
  quantity numeric(20,4) default 0
);
-- valuation layer: every stock move that changes value writes one; posts to GL
create table if not exists public.stock_valuation_layers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  move_id uuid references public.stock_moves(id) on delete set null,
  quantity numeric(20,4) default 0, unit_cost numeric(20,4) default 0, value numeric(20,4) default 0,
  remaining_qty numeric(20,4) default 0, remaining_value numeric(20,4) default 0,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz default now()
);
create table if not exists public.reordering_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  location_id uuid references public.stock_locations(id) on delete set null,
  min_qty numeric(20,4) default 0, max_qty numeric(20,4) default 0
);
create index if not exists idx_moves_company on public.stock_moves(company_id);
create index if not exists idx_svl_product on public.stock_valuation_layers(product_id);

-- ---------------------------------------------------------------------------
--  PROJECTS & SERVICES  (PSA)
-- ---------------------------------------------------------------------------
create table if not exists public.project_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, sequence int default 10, fold boolean default false
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, partner_id uuid references public.partners(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  stage_id uuid references public.project_stages(id) on delete set null,
  analytic_account_id uuid references public.analytic_accounts(id) on delete set null,  -- profitability hooks here
  date_start date, date_deadline date,
  billing_type text default 'none',            -- none|fixed|tm|milestone
  is_active boolean default true, created_at timestamptz default now()
);
create table if not exists public.task_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade, name text not null, sequence int default 10
);
create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null, stage_id uuid references public.task_stages(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  parent_task_id uuid references public.project_tasks(id) on delete set null,
  planned_hours numeric(12,2) default 0, date_deadline date, priority int default 0,
  description text default '', created_at timestamptz default now()
);
create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.project_tasks(id) on delete set null,
  employee_id uuid, user_id uuid references auth.users(id) on delete set null,
  work_date date default current_date, name text default '', hours numeric(12,2) default 0,
  analytic_account_id uuid references public.analytic_accounts(id) on delete set null,
  is_invoiced boolean default false
);
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null, amount numeric(20,4) default 0, deadline date,
  is_reached boolean default false, is_invoiced boolean default false
);
create index if not exists idx_tasks_project on public.project_tasks(project_id);
create index if not exists idx_ts_project on public.timesheets(project_id);

-- ---------------------------------------------------------------------------
--  HR
-- ---------------------------------------------------------------------------
create table if not exists public.hr_departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, parent_id uuid references public.hr_departments(id) on delete set null,
  manager_id uuid
);
create table if not exists public.hr_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, department_id uuid references public.hr_departments(id) on delete set null
);
create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, user_id uuid references auth.users(id) on delete set null,
  department_id uuid references public.hr_departments(id) on delete set null,
  job_id uuid references public.hr_jobs(id) on delete set null,
  work_email text default '', manager_id uuid references public.hr_employees(id) on delete set null,
  is_active boolean default true
);
create table if not exists public.hr_attendances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  check_in timestamptz, check_out timestamptz, worked_hours numeric(12,2) default 0
);
create table if not exists public.hr_leaves (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  leave_type text default 'paid', date_from date, date_to date, days numeric(6,2) default 0,
  state text default 'draft'
);
create table if not exists public.hr_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete set null,
  name text not null, product_id uuid references public.products(id) on delete set null,
  amount numeric(20,4) default 0, currency_code text, expense_date date default current_date,
  analytic_account_id uuid references public.analytic_accounts(id) on delete set null,
  state text default 'draft', journal_entry_id uuid references public.journal_entries(id) on delete set null
);

-- ---------------------------------------------------------------------------
--  INVOICE DOCUMENTS  (the bridge: a posted invoice generates a GL entry)
--  move_type: out_invoice | out_refund | in_invoice | in_refund
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  move_type text not null default 'out_invoice',
  journal_id uuid references public.journals(id) on delete set null,
  partner_id uuid references public.partners(id) on delete restrict,
  number text, ref text default '',
  invoice_date date default current_date, due_date date,
  currency_code text,
  state text not null default 'draft',          -- draft | posted | cancel
  payment_state text not null default 'not_paid', -- not_paid | partial | paid | reversed
  amount_untaxed numeric(20,4) default 0, amount_tax numeric(20,4) default 0,
  amount_total numeric(20,4) default 0, amount_residual numeric(20,4) default 0,
  sale_order_id uuid references public.sale_orders(id) on delete set null,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,  -- the posted GL entry
  created_by uuid references auth.users(id), created_at timestamptz default now()
);
create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text default '', sequence int default 10,
  quantity numeric(20,4) default 1, unit_price numeric(20,4) default 0, discount numeric(7,4) default 0,
  tax_id uuid references public.taxes(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,   -- income/expense account
  analytic_account_id uuid references public.analytic_accounts(id) on delete set null,
  price_subtotal numeric(20,4) default 0, price_total numeric(20,4) default 0
);
create index if not exists idx_inv_company on public.invoices(company_id, invoice_date);
create index if not exists idx_invl_invoice on public.invoice_lines(invoice_id);

-- ---------------------------------------------------------------------------
--  ROW LEVEL SECURITY  (all operational tables are company-scoped)
--  Uses the helpers from accounting-core.sql: my_company_ids(), can_write_company()
-- ---------------------------------------------------------------------------
do $$ declare t text;
begin
  foreach t in array array[
    'product_categories','products','sales_teams','crm_stages','crm_leads',
    'sale_orders','sale_order_lines','purchase_orders','purchase_order_lines',
    'warehouses','stock_locations','stock_lots','stock_pickings','stock_moves',
    'stock_move_lines','stock_valuation_layers','reordering_rules',
    'project_stages','projects','task_stages','project_tasks','timesheets','project_milestones',
    'hr_departments','hr_jobs','hr_employees','hr_attendances','hr_leaves','hr_expenses',
    'invoices','invoice_lines'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $$;

-- ============================================================================
--  DONE (operations structure). NEXT (with functions, tested live):
--   * post_invoice(): turn a posted invoice into a balanced GL entry (AR/AP,
--     income/expense, tax lines) + set amount_residual for reconciliation
--   * confirm_sale_order()/confirm_purchase_order(): compute totals, generate
--     invoice / delivery
--   * stock valuation posting on move done (-> stock_valuation_layers -> GL)
--   * project profitability view (analytic revenue vs cost)
--   * one-click company setup: seed chart of accounts, journals, taxes, sequences
-- ============================================================================
