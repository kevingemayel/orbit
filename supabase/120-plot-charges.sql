-- ============================================================================
-- 120-plot-charges.sql  -  Plot part 2: the charge engine.
--
-- Recurring charge templates (Plot's "recurring_items"), plus the two dimensions
-- the split needs: a `block` on units for buildings with several entrances, and
-- a `reserve_percent` uplift on the building. The split itself (budgetCalc) is
-- reproduced client-side in app.js, exactly as Plot did it, and produces normal
-- Orbit draft invoices carrying property_id / property_unit_id.
--
-- See memory plot-charge-model for the algorithm this feeds.
-- Safe to re-run.
-- ============================================================================

-- Block (entrance / wing) on a unit, and a separate block-share table for
-- buildings that split some costs by a different key inside a block.
alter table public.property_units add column if not exists block text;
alter table public.property_units add column if not exists block_shares numeric not null default 0;

-- Reserve-fund uplift applied on top of every unit's fee, per building.
alter table public.properties add column if not exists reserve_percent numeric not null default 0;
-- Which income account property charges credit, and the customer journal they
-- post through, so a building's billing lands in the ledger like any sale.
alter table public.properties add column if not exists income_account_id uuid references public.accounts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Recurring charge templates. These are the building's running costs that get
-- billed to owners each period, NOT the expenses themselves (those are bills).
-- ---------------------------------------------------------------------------
create table if not exists public.property_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  category text not null default 'maintenance',   -- concierge|electricity|generator|water|elevator|cleaning|maintenance|security|salary|insurance|other
  block text,                                      -- null = whole building; else only that block's units
  supplier_partner_id uuid references public.partners(id) on delete set null,
  amount numeric not null default 0,               -- in the company currency
  frequency text not null default 'monthly',       -- monthly | quarterly | yearly
  income_account_id uuid references public.accounts(id) on delete set null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_charges_prop on public.property_charges(property_id, is_active);
create index if not exists idx_charges_co on public.property_charges(company_id);

-- A billing run: the header for one period's generation, so a building can see
-- "May 2026: 16 invoices, USD 4,200 billed" and re-open or reverse it as a set.
create table if not exists public.property_charge_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  period text not null,                            -- "2026-05" or a free label
  issue_date date not null default current_date,
  due_date date,
  reserve_percent numeric not null default 0,      -- snapshot of the setting at run time
  units_billed int not null default 0,
  amount_total numeric not null default 0,
  currency_code text,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_charge_runs_prop on public.property_charge_runs(property_id, period);

-- Tie each generated invoice back to its run (nullable: hand-made invoices have none).
alter table public.invoices add column if not exists property_charge_run_id uuid references public.property_charge_runs(id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS: standard Orbit pattern.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['property_charges','property_charge_runs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format(
      'create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))',
      t || '_rw', t);
  end loop;
end $$;
