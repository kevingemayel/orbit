-- ============================================================================
--  Spacework ERP  -  structured line dimensions for materials  (AFTER 59)
--  Width + Height are their own numeric columns (mm) so the line can compute
--  Area (m2), Weight/sheet (kg) and price conversions (per sheet / m2 / kg),
--  reusing the product's material_form + thickness + density. price_basis
--  records which unit the buyer quoted in. unit_price stays the per-sheet
--  (canonical) price, so totals + accounting are unchanged. All additive.
-- ============================================================================

alter table public.purchase_order_lines add column if not exists width       numeric;
alter table public.purchase_order_lines add column if not exists height      numeric;
alter table public.purchase_order_lines add column if not exists price_basis text;
alter table public.sale_order_lines     add column if not exists width       numeric;
alter table public.sale_order_lines     add column if not exists height      numeric;
alter table public.sale_order_lines     add column if not exists price_basis text;
alter table public.rfq_lines            add column if not exists width       numeric;
alter table public.rfq_lines            add column if not exists height      numeric;
alter table public.stock_moves          add column if not exists width       numeric;
alter table public.stock_moves          add column if not exists height      numeric;

select 'purchase dims ready' as done;
