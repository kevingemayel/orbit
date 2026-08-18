-- ============================================================================
--  Spacework ERP  -  header-level cost code on PO + bill (ORB-12/13)  run AFTER 34
--  So the Job Cost report can split Committed (open POs) and Actual (posted
--  supplier bills) by cost code without per-line tagging.
-- ============================================================================
alter table public.purchase_orders add column if not exists cost_code_id uuid references public.cost_codes(id) on delete set null;
alter table public.invoices        add column if not exists cost_code_id uuid references public.cost_codes(id) on delete set null;
create index if not exists idx_po_costcode  on public.purchase_orders(cost_code_id);
create index if not exists idx_inv_costcode on public.invoices(cost_code_id);
select 'header cost codes ready' as done;
