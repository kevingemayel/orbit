-- ============================================================================
--  Spacework ERP  -  CLOSE PARTIAL GAPS  (run AFTER 01-19)
--  Adds the missing sub-features inside apps Orbit already has:
--   Sales      : pricelists (+ items), quotation templates (+ lines)
--   Inventory  : storage categories, putaway rules, delivery methods, package types
--   Employees  : skills (+ employee link), certifications, onboarding checklists, appraisals
--   Contacts   : contact tags, partner bank accounts, partners.industry/tags
--   Planning   : shift templates, planning shifts (open shifts = null employee)
--   Settings   : companies.lock_date (posting lock)
--  Company-scoped RLS on all new tables.
-- ============================================================================

-- ---- Sales -------------------------------------------------------------------
create table if not exists public.pricelists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Pricelist', currency_code text default '', is_active boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.pricelist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  pricelist_id uuid not null references public.pricelists(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  min_qty numeric(20,4) default 1, fixed_price numeric(20,4), percent_off numeric(8,3) default 0, sequence int default 10
);
alter table public.partners add column if not exists pricelist_id uuid references public.pricelists(id) on delete set null;
create table if not exists public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Template', note text default '', is_active boolean default true, created_at timestamptz default now()
);
create table if not exists public.quote_template_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid not null references public.quote_templates(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text default '', quantity numeric(20,4) default 1, unit_price numeric(20,4) default 0, sequence int default 10
);

-- ---- Inventory ---------------------------------------------------------------
create table if not exists public.storage_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Category', max_weight numeric(20,4) default 0, capacity numeric(20,4) default 0, notes text default ''
);
create table if not exists public.putaway_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete cascade,
  location_id uuid references public.stock_locations(id) on delete cascade, sequence int default 10
);
create table if not exists public.delivery_methods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Delivery', carrier text default '', price numeric(20,4) default 0, notes text default '', is_active boolean default true
);
create table if not exists public.package_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Package', length numeric(20,4) default 0, width numeric(20,4) default 0, height numeric(20,4) default 0, max_weight numeric(20,4) default 0
);
alter table public.stock_locations add column if not exists storage_category_id uuid references public.storage_categories(id) on delete set null;

-- ---- Employees ---------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Skill', category text default ''
);
create table if not exists public.employee_skills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  level text default 'intermediate'                 -- beginner | intermediate | advanced | expert
);
create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  name text not null default 'Certificate', authority text default '', issued_date date, expiry_date date, notes text default ''
);
create table if not exists public.hr_onboarding (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  kind text default 'onboarding',                   -- onboarding | offboarding
  task text not null default 'Task', done boolean default false, sequence int default 10, due_date date
);
create table if not exists public.appraisals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  appraisal_date date default current_date, period text default '', rating int default 0,
  manager text default '', strengths text default '', improvements text default '',
  state text default 'draft',                        -- draft | done
  created_at timestamptz default now()
);

-- ---- Contacts ----------------------------------------------------------------
create table if not exists public.contact_tags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Tag', color text default ''
);
create table if not exists public.partner_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  bank_name text default '', account_number text default '', iban text default '', currency_code text default ''
);
alter table public.partners add column if not exists industry text;
alter table public.partners add column if not exists tags text;

-- ---- Planning ----------------------------------------------------------------
create table if not exists public.shift_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Shift', role text default '', start_time text default '08:00', end_time text default '17:00', hours numeric(8,2) default 8
);
create table if not exists public.planning_shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete set null,   -- null = open shift
  role text default '', project_id uuid references public.projects(id) on delete set null,
  shift_date date default current_date, start_time text default '08:00', end_time text default '17:00',
  hours numeric(8,2) default 8, published boolean default false, note text default '',
  created_at timestamptz default now()
);
create index if not exists idx_planning_shifts on public.planning_shifts(company_id, shift_date);

-- ---- Settings ----------------------------------------------------------------
alter table public.companies add column if not exists lock_date date;

do $rls$ declare t text;
begin
  foreach t in array array['pricelists','pricelist_items','quote_templates','quote_template_lines',
    'storage_categories','putaway_rules','delivery_methods','package_types',
    'skills','employee_skills','certifications','hr_onboarding','appraisals',
    'contact_tags','partner_bank_accounts','shift_templates','planning_shifts'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;

select 'pricelists' t, count(*) n from public.pricelists
union all select 'skills', count(*) from public.skills
union all select 'planning_shifts', count(*) from public.planning_shifts
union all select 'delivery_methods', count(*) from public.delivery_methods;
