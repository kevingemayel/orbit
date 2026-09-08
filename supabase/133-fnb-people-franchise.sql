-- ============================================================================
-- 133-fnb-people-franchise.sql
--   F&B spec Section 8 (workforce), Section 10 (franchise) and Section 12
--   (ancillary revenue lines).
--
-- Orbit already has hr_employees, hr_contracts, hr_shifts, hr_roster,
-- hr_attendances, hr_payslips, certifications and skills. This adds the parts a
-- shift-based food business needs: a published roster with swaps and open
-- shifts, demand-driven labour targets, and tips into payroll (in 131).
--
-- The franchise module is the piece that turns this from a POS into something a
-- franchisor buys: royalties calculated from reported sales, a portal, brand
-- audits (templates already in 131) and a development pipeline.
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 8: rostering
-- ---------------------------------------------------------------------------
alter table public.hr_roster add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.hr_roster add column if not exists status text not null default 'draft';  -- draft | published | swapped | open
alter table public.hr_roster add column if not exists role text;
alter table public.hr_roster add column if not exists start_time time;
alter table public.hr_roster add column if not exists end_time time;
alter table public.hr_roster add column if not exists break_minutes int;
alter table public.hr_roster add column if not exists published_at timestamptz;
alter table public.hr_roster add column if not exists note text;
alter table public.hr_shifts add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.hr_shifts add column if not exists role text;

create table if not exists public.shift_swaps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  roster_id uuid references public.hr_roster(id) on delete cascade,
  from_employee_id uuid references public.hr_employees(id) on delete set null,
  to_employee_id uuid references public.hr_employees(id) on delete set null,
  kind text not null default 'swap',        -- swap | give_away | claim_open
  status text not null default 'requested', -- requested | accepted | approved | rejected
  reason text,
  decided_by text, decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_availability (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  day_of_week int,                          -- 0 = Sunday; null = a one-off date
  on_date date,
  from_time time, to_time time,
  is_available boolean not null default true,
  note text
);

-- Labour demand: forecast sales for a daypart, turn it into hours needed.
create table if not exists public.labour_standards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  daypart text not null,                    -- breakfast | lunch | afternoon | evening
  from_time time, to_time time,
  -- how much revenue one labour hour should produce, and the floor below which
  -- you cannot run the store whatever the sales say
  sales_per_labour_hour numeric,
  min_staff int not null default 1,
  role text,
  is_active boolean not null default true
);

create table if not exists public.sales_forecasts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  forecast_date date not null,
  daypart text,
  forecast_sales numeric,
  forecast_transactions int,
  actual_sales numeric,
  method text default 'trend',              -- trend | manual | weather_adjusted
  note text,
  unique (store_id, forecast_date, daypart)
);

alter table public.hr_attendances add column if not exists clock_method text;   -- biometric | pin | qr | mobile
alter table public.hr_attendances add column if not exists latitude numeric;
alter table public.hr_attendances add column if not exists longitude numeric;
alter table public.hr_attendances add column if not exists is_corrected boolean not null default false;
alter table public.hr_attendances add column if not exists corrected_by text;

-- ---------------------------------------------------------------------------
-- SECTION 10: franchise
-- ---------------------------------------------------------------------------
create table if not exists public.franchisees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  code text, name text not null,
  principals text,
  agreement_ref text,
  agreement_start date, agreement_end date, renewal_due date,
  territory text,
  exclusivity_radius_km numeric,
  status text not null default 'active',    -- prospect | active | terminated | transferred
  portal_email text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_franchisees on public.franchisees (company_id, status);

alter table public.stores add column if not exists franchisee_id uuid references public.franchisees(id) on delete set null;

-- Royalty terms can be a percentage, a flat fee, tiered, or a minimum.
create table if not exists public.royalty_schemes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  franchisee_id uuid references public.franchisees(id) on delete cascade,
  name text not null,
  kind text not null default 'percent',     -- percent | fixed | tiered | percent_with_minimum
  percent numeric,
  fixed_amount numeric,
  minimum_amount numeric,
  tiers jsonb not null default '[]'::jsonb, -- [{"upto":50000,"percent":5}, ...]
  marketing_percent numeric,                -- ad fund contribution
  period text not null default 'monthly',
  is_active boolean not null default true
);

-- Sales the franchisee reports, which is what royalty is calculated on. Gaps in
-- this series are the under-reporting signal a franchisor cares about most.
create table if not exists public.franchise_sales_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  franchisee_id uuid references public.franchisees(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  period_start date not null, period_end date not null,
  net_sales numeric not null default 0,
  gross_sales numeric,
  transactions int,
  source text not null default 'declared',  -- declared | pos_captured
  status text not null default 'submitted', -- submitted | verified | disputed
  submitted_at timestamptz not null default now(),
  verified_by text, note text,
  unique (store_id, period_start, period_end, source)
);

create table if not exists public.royalty_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  franchisee_id uuid references public.franchisees(id) on delete cascade,
  scheme_id uuid references public.royalty_schemes(id) on delete set null,
  period_start date not null, period_end date not null,
  net_sales numeric not null default 0,
  royalty_amount numeric not null default 0,
  marketing_amount numeric not null default 0,
  other_fees numeric not null default 0,
  total_amount numeric not null default 0,
  invoice_id uuid references public.invoices(id) on delete set null,
  status text not null default 'draft',     -- draft | issued | paid
  created_at timestamptz not null default now()
);
create index if not exists idx_royaltyinv on public.royalty_invoices (company_id, franchisee_id, period_start desc);

-- The advertising fund, so contributions and spend are transparent to the
-- franchisees paying into it.
create table if not exists public.marketing_fund_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  franchisee_id uuid references public.franchisees(id) on delete set null,
  entry_date date not null default current_date,
  kind text not null,                       -- contribution | spend
  amount numeric not null default 0,
  campaign text, description text,
  invoice_id uuid references public.invoices(id) on delete set null
);

create table if not exists public.franchise_pipeline (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  applicant_name text not null,
  contact_email text, contact_phone text,
  territory text, city text, country text,
  stage text not null default 'lead',
  -- lead | application | vetting | approved | site_selection | lease | design |
  -- construction | equipment | training | opening | open | rejected
  net_worth numeric, liquid_capital numeric,
  vetting_note text,
  target_open_date date, actual_open_date date,
  franchisee_id uuid references public.franchisees(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  owner text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pipeline on public.franchise_pipeline (company_id, stage);

create table if not exists public.approved_suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  is_mandatory boolean not null default false,
  rebate_percent numeric,
  valid_from date, valid_to date,
  note text,
  unique (company_id, partner_id, product_id)
);

-- ---------------------------------------------------------------------------
-- SECTION 12: ancillary revenue
-- ---------------------------------------------------------------------------
create table if not exists public.wholesale_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  price_tier text,
  delivery_day text,
  route text,
  credit_limit numeric,
  billing text not null default 'monthly',  -- per_delivery | monthly
  equipment_on_loan text,
  volume_commitment_kg numeric,
  is_active boolean not null default true,
  note text
);
create table if not exists public.standing_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  wholesale_account_id uuid references public.wholesale_accounts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  qty numeric not null default 0,
  uom text,
  frequency text not null default 'weekly',
  next_date date,
  is_active boolean not null default true
);
create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  level text, duration_hours numeric, price numeric,
  is_public boolean not null default true,
  is_active boolean not null default true
);
create table if not exists public.training_bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  course_id uuid references public.training_courses(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  employee_id uuid references public.hr_employees(id) on delete set null,
  session_date date,
  status text not null default 'booked',    -- booked | attended | no_show | cancelled
  amount numeric, paid boolean not null default false,
  certificate_ref text, certificate_issued_on date
);

-- ---------------------------------------------------------------------------
-- Royalty calculation: one place, so the invoice and the statement agree.
-- ---------------------------------------------------------------------------
create or replace function public.royalty_due(p_scheme uuid, p_net_sales numeric)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare s record; amt numeric := 0; t jsonb; prev numeric := 0; band numeric;
begin
  select * into s from public.royalty_schemes where id = p_scheme;
  if s.id is null then return 0; end if;

  if s.kind = 'fixed' then
    amt := coalesce(s.fixed_amount, 0);
  elsif s.kind = 'tiered' then
    -- each band charges its own rate on the slice of sales inside it
    for t in select * from jsonb_array_elements(coalesce(s.tiers, '[]'::jsonb))
    loop
      band := least(coalesce(p_net_sales, 0), coalesce((t->>'upto')::numeric, p_net_sales)) - prev;
      if band > 0 then
        amt := amt + band * coalesce((t->>'percent')::numeric, 0) / 100.0;
        prev := prev + band;
      end if;
    end loop;
    if p_net_sales > prev then
      amt := amt + (p_net_sales - prev) * coalesce(s.percent, 0) / 100.0;
    end if;
  else
    amt := coalesce(p_net_sales, 0) * coalesce(s.percent, 0) / 100.0;
  end if;

  if s.kind = 'percent_with_minimum' or s.minimum_amount is not null then
    amt := greatest(amt, coalesce(s.minimum_amount, 0));
  end if;
  return round(amt, 2);
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['shift_swaps','employee_availability','labour_standards','sales_forecasts',
                           'franchisees','royalty_schemes','franchise_sales_reports','royalty_invoices',
                           'marketing_fund_entries','franchise_pipeline','approved_suppliers',
                           'wholesale_accounts','standing_orders','training_courses','training_bookings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))', t || '_rw', t);
  end loop;
end $$;
