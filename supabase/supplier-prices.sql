-- ============================================================================
--  Orbit ERP  -  Supplier price list per product (product_supplier_prices)
--  Paste into the Supabase SQL editor and Run once.
--
--  Holds "which suppliers sell this item, at what price, unit, MOQ and date".
--  This is what lets a priced material catalog (same item from several suppliers)
--  import without losing prices, and powers best-price procurement.
-- ============================================================================
create table if not exists public.product_supplier_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,   -- linked supplier
  supplier_name text,            -- free-text supplier (if not a linked partner yet)
  supplier_code text,            -- the supplier's own reference for this item
  price numeric(20,4) default 0,
  currency_code text,
  price_basis text,              -- each | sheet | bar | roll | container | m2 | lm | m | kg | L
  uom text,
  moq numeric(20,4),             -- minimum order quantity
  pack_size numeric(20,4),       -- batch / pack size
  lead_days int,                 -- lead time in days
  price_date date,               -- when this price was quoted / captured
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_psp_product on public.product_supplier_prices(product_id);
create index if not exists idx_psp_company on public.product_supplier_prices(company_id);
create index if not exists idx_psp_partner on public.product_supplier_prices(partner_id);

alter table public.product_supplier_prices enable row level security;
drop policy if exists psp_r on public.product_supplier_prices;
create policy psp_r on public.product_supplier_prices for select using (company_id in (select public.my_company_ids()));
drop policy if exists psp_w on public.product_supplier_prices;
create policy psp_w on public.product_supplier_prices for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'product_supplier_prices ready' as done;
