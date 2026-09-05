-- ============================================================================
--  Orbit ERP  -  Reconciliation: un-tag historical WAREHOUSE/FACTORY receipts
--  from their project (warehouse-style project costing).
--
--  Context: goods-receipt stock moves used to be tagged with the PO's project,
--  so Job Cost / Project P&L counted the receipt (an inventory ASSET) as if it
--  were "materials issued" - double counting the material against the project.
--  The app no longer does this (receipts are untagged; cost is recognized on
--  issue). This script fixes the rows created BEFORE that change.
--
--  It clears project_id on every move that came FROM a supplier location (i.e. a
--  goods receipt into stock). Genuine issues OUT of stock to a project (from an
--  internal location) are left untouched, so project cost still reflects them.
--
--  Safe: it only nulls a tag on receipt moves; it creates/deletes nothing and
--  does not touch the ledger. Paste into the Supabase SQL editor and Run once.
-- ============================================================================

-- Preview what will change (optional - run this first to see the count/value):
-- select count(*) as receipt_moves_to_untag,
--        coalesce(sum(m.quantity),0) as total_qty
-- from public.stock_moves m
-- join public.stock_locations sl on sl.id = m.location_id
-- where sl.usage = 'supplier' and m.project_id is not null;

update public.stock_moves m
set project_id = null
from public.stock_locations sl
where m.location_id = sl.id
  and sl.usage = 'supplier'
  and m.project_id is not null;

select 'warehouse receipts un-tagged from projects' as done;
