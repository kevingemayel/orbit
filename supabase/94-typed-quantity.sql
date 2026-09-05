-- ============================================================================
--  Orbit ERP  -  Typed quantity on stock moves  (audit P0-1)  (AFTER 93)
--
--  A counted item is not the measure it stands for: a sheet product is bought and
--  counted in SHEETS but stocked/valued in m2. Until now a stock move held one
--  number (the count) whose unit was implicitly the product's uom - so "3 sheets"
--  of a product measured in m2 read back as "3 m2". These columns record, alongside
--  the transacted count in `quantity`, the physical BASE measure it represents:
--    base_qty   = count x per-pack factor   (e.g. 3 sheets x 3.75 m2 = 11.25 m2)
--    base_uom   = the measure unit          (m2 / m / L)
--    pack_factor= base units per one counted item (snapshot, so later product
--                 dimension edits don't rewrite history)
--  Purely additive; valuation math is unchanged (value stays count x canonical cost).
--  Paste into the Supabase SQL editor and Run once. Idempotent.
-- ============================================================================
alter table public.stock_moves add column if not exists base_qty    numeric(20,4);
alter table public.stock_moves add column if not exists base_uom    text;
alter table public.stock_moves add column if not exists pack_factor numeric(20,6);

select 'typed quantity columns ready' as done;
