-- ============================================================================
--  Spacework ERP  -  MATERIAL SPECIFICATION on products  (run AFTER 01-43)
--  Richer material definitions for a fabricator: a classification tree and a
--  form-specific dimensional/pricing spec (bar / sheet / liquid / roll) with the
--  unit conversions kept in `spec` jsonb so the catalog can grow without schema
--  churn. `material_form` + `family` are real columns for grouping/filtering.
-- ============================================================================
alter table public.products add column if not exists material_form text;   -- bar|sheet|liquid|roll|generic
alter table public.products add column if not exists family        text;   -- top classification level (for grouping)
alter table public.products add column if not exists spec          jsonb not null default '{}'::jsonb;
create index if not exists idx_products_family on public.products(company_id, family);
create index if not exists idx_products_form   on public.products(company_id, material_form);

select 'material spec ready' as done;
