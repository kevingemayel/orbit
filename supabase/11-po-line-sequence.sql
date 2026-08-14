-- ============================================================================
--  Spacework ERP  -  FIX: purchase_order_lines was missing a `sequence` column
--  (sale_order_lines has one). Both renderOrderForm.save() and the new
--  requisition -> PO flow insert `sequence`, so PO lines silently failed to
--  save (42703 column does not exist) and every Purchase Order came out empty.
-- ============================================================================
alter table public.purchase_order_lines add column if not exists sequence int default 10;
