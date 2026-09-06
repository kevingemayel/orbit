-- ============================================================================
-- 119-plot-core.sql  -  Plot (property management) as an Orbit app, part 1:
-- the core entities and the per-building dimension on the ledger.
--
-- Decisions taken with Kevin (2026-09-07):
--   * A building is a RECORD INSIDE a company, not a company of its own. One
--     company is the syndic or owner; it can hold many buildings. This is what
--     Plot already does (its journal_entries carry building_id) and it keeps
--     portfolio reporting across buildings possible.
--   * Property money posts into ORBIT'S ledger, not a second one. Per-building
--     books therefore work exactly like per-project books already do: an
--     explicit property_id on invoices, filtered by the report engine.
--     (journal_lines.analytic_distribution exists but is dead code - 0 uses in
--     the app - so it is deliberately not used here.)
--   * Owners and tenants are PARTNERS, so they reuse contacts, invoicing,
--     statements and the customer portal instead of a second people table.
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Buildings
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,
  kind text not null default 'building',      -- building | compound | villa | tower | mixed
  address text,
  city text,
  country text,
  -- Millièmes: the total the units' shares add up to. 1000 is the Lebanese and
  -- French convention; some buildings use 10000. Set per building so the charge
  -- split never has to guess.
  shares_total numeric not null default 1000,
  manager_partner_id uuid references public.partners(id) on delete set null,
  handover_date date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_properties_co on public.properties(company_id, is_active);

-- ---------------------------------------------------------------------------
-- Units: apartments, parking spaces, storage, shops
-- ---------------------------------------------------------------------------
create table if not exists public.property_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  code text not null,                          -- "A-12", "P-04"
  floor text,
  kind text not null default 'apartment',      -- apartment | parking | storage | shop | office | common
  area_m2 numeric,
  shares numeric not null default 0,           -- this unit's share of the building
  bedrooms int,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_units_prop on public.property_units(property_id, is_active);
create index if not exists idx_units_co on public.property_units(company_id);

-- ---------------------------------------------------------------------------
-- Who owns a unit, and who rents it. Both point at partners, so an owner is a
-- normal contact who can be invoiced, chased and given portal access.
-- ---------------------------------------------------------------------------
create table if not exists public.property_ownerships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid not null references public.property_units(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  share_pct numeric not null default 100,      -- when one unit has several owners
  is_primary boolean not null default true,    -- who receives the charge
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_own_unit on public.property_ownerships(unit_id);
create index if not exists idx_own_partner on public.property_ownerships(partner_id);

create table if not exists public.property_tenancies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid not null references public.property_units(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  start_date date,
  end_date date,
  rent_amount numeric not null default 0,
  rent_period text not null default 'monthly', -- monthly | quarterly | yearly
  deposit numeric not null default 0,
  status text not null default 'active',       -- active | notice | ended
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ten_unit on public.property_tenancies(unit_id, status);
create index if not exists idx_ten_partner on public.property_tenancies(partner_id);

-- ---------------------------------------------------------------------------
-- The per-building dimension on the ledger. Mirrors invoices.project_id, which
-- is how project P&L is already computed, so a building P&L is the same query
-- with a different column rather than a new reporting path.
-- ---------------------------------------------------------------------------
alter table public.invoices add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.invoices add column if not exists property_unit_id uuid references public.property_units(id) on delete set null;
alter table public.journal_entries add column if not exists property_id uuid references public.properties(id) on delete set null;

create index if not exists idx_invoices_property on public.invoices(property_id) where property_id is not null;
create index if not exists idx_je_property on public.journal_entries(property_id) where property_id is not null;

-- ---------------------------------------------------------------------------
-- RLS: the standard Orbit pattern on every new table.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['properties','property_units','property_ownerships','property_tenancies']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format(
      'create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))',
      t || '_rw', t);
  end loop;
end $$;
