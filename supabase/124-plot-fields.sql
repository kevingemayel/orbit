-- ============================================================================
-- 124-plot-fields.sql  -  Carry the Plot fields the first two passes dropped.
--
-- Field-level audit of Adma 92 found real data silently lost inside entities I
-- had already "migrated":
--   * 1 unit is voting_excluded  -> resolution voting was going to count a unit
--     the joint-ownership rules exclude. Governance correctness, not cosmetics.
--   * all 5 tenancies carry pays_charges -> decides whether the tenant or the
--     owner is billed for charges.
--   * all 11 expenses carry a category (needed for budget-vs-actual per line),
--     a payment method and who paid; 3 are linked to a capital project.
--   * all 13 payments carry method / payer type / payer name.
--   * all 7 capital projects carry a category.
--   * unit lot numbers and notes.
-- ============================================================================

alter table public.property_units add column if not exists lot_number text;
alter table public.property_units add column if not exists voting_excluded boolean not null default false;
alter table public.property_units add column if not exists notes text;

alter table public.property_tenancies add column if not exists pays_charges boolean not null default false;

alter table public.property_projects add column if not exists category text;

-- Building expenses are Orbit vendor bills; give them the property-side facts
-- the budget and the project view need.
alter table public.invoices add column if not exists property_category text;
alter table public.invoices add column if not exists property_project_id uuid references public.property_projects(id) on delete set null;
create index if not exists idx_inv_prop_cat on public.invoices(property_id, property_category) where property_id is not null;

-- Payments: how it was paid and who actually handed it over (owner vs tenant).
alter table public.payments add column if not exists method text;
alter table public.payments add column if not exists payer_type text;
alter table public.payments add column if not exists payer_name text;
