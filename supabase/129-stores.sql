-- ============================================================================
-- 129-stores.sql  -  F&B spec Section 0: the store dimension.
--
-- Spec constraint 2: "every transaction carries entity, store, channel, daypart,
-- employee and device dimensions from day one. Retrofitting these is a rewrite."
-- So this lands BEFORE any further operational tables are added.
--
-- Orbit already has company (legal entity) and org (group). A STORE is the
-- trading location below the company: an outlet, a kiosk, a central kitchen, a
-- roastery. Group -> Brand -> Region -> Store, with the brand and region as
-- lightweight labels rather than separate tenancy levels, because tenancy is
-- already company-based and proven (see the isolation test).
--
-- Ownership model (COCO/FOFO/FOCO/managed) rides on the store because that is
-- what decides royalty, consolidation treatment and who may see what.
--
-- Reuses: warehouses (a store's stock lives in one), approval_rules/approvals
-- (the approvals engine already exists), sales_channels from migration 128.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_brands_company on public.brands (company_id, is_active);

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  country text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_regions_company on public.regions (company_id, is_active);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  region_id uuid references public.regions(id) on delete set null,
  code text not null,
  name text not null,
  -- COCO company owned company operated, FOFO franchise owned franchise
  -- operated, FOCO franchise owned company operated, MANAGED under contract
  ownership text not null default 'coco',
  store_type text not null default 'outlet',   -- outlet | kiosk | central_kitchen | roastery | warehouse | popup | truck
  partner_id uuid references public.partners(id) on delete set null,  -- the franchisee, when not company owned
  warehouse_id uuid references public.warehouses(id) on delete set null,
  address text, city text, country text, latitude numeric, longitude numeric, timezone text,
  phone text, email text,
  opened_on date, closed_on date,
  seats int, area_sqm numeric,
  has_drive_thru boolean not null default false,
  has_delivery boolean not null default false,
  delivery_radius_km numeric,
  service_types text[] not null default '{}',   -- dine_in, takeaway, delivery...
  trading_hours jsonb not null default '{}'::jsonb,  -- {"1":["07:00","22:00"], ...} 0=Sunday
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);
create index if not exists idx_stores_company on public.stores (company_id, is_active);
create index if not exists idx_stores_owner on public.stores (company_id, ownership);

-- Which stores a user may act in. Absent rows = every store in the company,
-- so nothing changes for a single-site business.
create table if not exists public.store_access (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  role text not null default 'staff',   -- area_manager | store_manager | shift_lead | staff | franchisee
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_storeaccess on public.store_access (company_id, store_id, is_active);

-- ---------------------------------------------------------------------------
-- The dimension itself, on everything that already records a transaction.
-- Nullable everywhere: a single-site company never fills it in and nothing
-- behaves differently.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['invoices','payments','journal_entries','stock_moves','pos_orders',
                           'pos_sessions','purchase_orders','hr_employees','hr_attendances','hr_roster','cash_counts']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I add column if not exists store_id uuid references public.stores(id) on delete set null', t);
      execute format('create index if not exists %I on public.%I (store_id)', 'idx_' || t || '_store', t);
    end if;
  end loop;
end $$;

-- Channel and daypart on the sales transaction, the other two dimensions the
-- spec insists on. Employee and device already exist on pos_orders/sessions.
alter table public.pos_orders add column if not exists channel_id uuid references public.sales_channels(id) on delete set null;
alter table public.pos_orders add column if not exists daypart text;
alter table public.pos_orders add column if not exists device_id text;
alter table public.invoices add column if not exists channel_id uuid references public.sales_channels(id) on delete set null;

-- A store's own targets, for prime cost tracking later.
alter table public.stores add column if not exists target_food_cost_pct numeric;
alter table public.stores add column if not exists target_labour_pct numeric;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['brands','regions','stores','store_access']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))', t || '_rw', t);
  end loop;
end $$;
