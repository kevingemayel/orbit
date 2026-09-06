-- ============================================================================
-- 104-inventory-depth.sql  -  Inventory depth (Dolphin gap): product variants
-- (size x color), sellable kits/bundles, consignment flag, and multiple
-- (equivalent) barcodes per product. Company-scoped RLS via existing helpers.
-- min/max/replenishment already exists (reordering_rules) - not touched here.
-- Safe to re-run.
-- ============================================================================

-- Product-level flags + variant parent link.
alter table public.products add column if not exists parent_product_id uuid references public.products(id) on delete set null;
alter table public.products add column if not exists is_kit boolean default false;
alter table public.products add column if not exists is_consignment boolean default false;
alter table public.products add column if not exists variant_attrs jsonb not null default '{}'::jsonb;
create index if not exists idx_products_parent on public.products(parent_product_id);

-- Equivalent / additional barcodes (the products.barcode column stays the primary).
create table if not exists public.product_barcodes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  barcode text not null,
  label text default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_product_barcodes on public.product_barcodes(company_id, product_id);
create index if not exists idx_product_barcodes_code on public.product_barcodes(company_id, barcode);

-- Kit / bundle components: a sellable product made of other products.
create table if not exists public.product_kit_components (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kit_product_id uuid not null references public.products(id) on delete cascade,
  component_product_id uuid references public.products(id) on delete set null,
  qty numeric(20,4) not null default 1,
  seq int default 10
);
create index if not exists idx_kit_components on public.product_kit_components(company_id, kit_product_id, seq);

alter table public.product_barcodes        enable row level security;
alter table public.product_kit_components  enable row level security;
drop policy if exists product_barcodes_rw on public.product_barcodes;
create policy product_barcodes_rw on public.product_barcodes using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
drop policy if exists product_kit_components_rw on public.product_kit_components;
create policy product_kit_components_rw on public.product_kit_components using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
