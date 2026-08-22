-- ============================================================================
--  Spacework ERP  -  procurement destinations + take-off dimensions  (AFTER 64)
--  Every procurement line now carries WHERE the material is needed:
--    warehouse -> into stock (an asset, issued to jobs later)
--    factory   -> into a WIP location, consumed by production
--    site      -> delivered straight to the job, a cost, never stocked
--  destination drives how a goods receipt is routed. Null = warehouse, so all
--  existing orders behave exactly as before. The material take-off (material
--  requisitions) also gains the size/basis columns so it uses the same product
--  calculator as the PO/RFQ, plus a category for organising thousands of items.
--  All additive; no policy changes (RLS is inherited on these tables).
-- ============================================================================

-- where each line is destined (warehouse | factory | site); null = warehouse
alter table public.purchase_order_lines      add column if not exists destination text;
alter table public.rfq_lines                 add column if not exists destination text;
alter table public.material_requisition_lines add column if not exists destination text;

-- the RFQ captures the unit each supplier quotes in (per kg / m2 / lm / sheet...)
-- so bids compare in the material's own unit; unit_price on the awarded PO stays
-- the canonical per-item price.
alter table public.rfq_lines                 add column if not exists price_basis text;

-- the take-off reuses the same material calculator as PO/RFQ lines
alter table public.material_requisition_lines add column if not exists size        text;
alter table public.material_requisition_lines add column if not exists width       numeric;
alter table public.material_requisition_lines add column if not exists height      numeric;
alter table public.material_requisition_lines add column if not exists price_basis text;
-- organising thousands of items: bars / sheets / paint / sealant / screws / misc
alter table public.material_requisition_lines add column if not exists category    text;
-- per-line progress on the take-off (to_buy -> quoting -> ordered -> received)
alter table public.material_requisition_lines add column if not exists line_status text;

select 'procurement destinations ready' as done;
