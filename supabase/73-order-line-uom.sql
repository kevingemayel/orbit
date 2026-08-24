-- ============================================================================
--  Spacework ERP  -  unit of measure on order lines  (AFTER 72)
--  purchase_order_lines / sale_order_lines gain a `uom` text column so the unit
--  picked per line (from Units of Measure) is stored and shown on the PO / RFQ /
--  receiving. stock_moves.uom, products.uom and delivery_note_lines.unit already
--  exist. Additive; RLS unchanged.
-- ============================================================================

alter table public.purchase_order_lines add column if not exists uom text;
alter table public.sale_order_lines     add column if not exists uom text;

select 'order line uom ready' as done;
