-- ============================================================================
--  Spacework ERP  -  PURCHASE line items: catalog link + per-line size  (AFTER 58)
--  RFQ lines become real catalog items (product_id) like PO lines, every
--  purchase/sale/RFQ line can carry a per-line size (one base product, many
--  sizes), and goods receipts record the size so project stock shows it.
--  All columns are additive + nullable -> nothing existing breaks.
-- ============================================================================

alter table public.rfq_lines            add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.rfq_lines            add column if not exists size text;
alter table public.purchase_order_lines add column if not exists size text;
alter table public.sale_order_lines     add column if not exists size text;
alter table public.stock_moves          add column if not exists size text;

create index if not exists idx_rfqlines_product on public.rfq_lines(product_id);

select 'purchase items ready' as done;
