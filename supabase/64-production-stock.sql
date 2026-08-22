-- ============================================================================
--  Spacework ERP  -  production runs move stock  (run AFTER 63)
--  Until now a production run's "materials consumed" was recorded but never used
--  - it did not reduce on-hand or feed costing. Now completing a run (status
--  'done') consumes the input materials out of stock and puts the output into
--  stock (quantity only - materials are already expensed on the vendor bill, so
--  no GL double-count). stock_posted guards against re-posting on re-save.
-- ============================================================================

alter table public.production_runs add column if not exists stock_posted boolean default false;

select 'production stock ready' as done;
