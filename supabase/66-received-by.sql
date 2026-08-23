-- ============================================================================
--  Spacework ERP  -  who received a delivery  (AFTER 65)
--  A goods receipt now records the person who received it (chosen from the
--  company team), stored on each stock move it creates. Free text (the name),
--  matching the other "someone" fields. Additive; RLS inherited on stock_moves.
-- ============================================================================

alter table public.stock_moves add column if not exists received_by text;

select 'received_by ready' as done;
