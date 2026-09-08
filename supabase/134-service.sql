-- ============================================================================
-- 134-service.sql  -  what the floor and the kitchen screens need during service.
--
-- Migration 131 already gave lines their KDS status and timestamps. This adds
-- the order-level clock ("order time until serving time", which is the number a
-- kitchen is judged on), the table's own clock, and a per-item prep target so a
-- ticket can go amber before it goes late rather than after.
--
-- Safe to re-run.
-- ============================================================================

-- The order clock. placed -> fired to the kitchen -> ready -> served.
alter table public.pos_orders add column if not exists fired_at timestamptz;
alter table public.pos_orders add column if not exists ready_at timestamptz;
alter table public.pos_orders add column if not exists served_at timestamptz;
alter table public.pos_orders add column if not exists course_fired int not null default 0;
alter table public.pos_orders add column if not exists server_name text;

-- The table clock, so the floor map can show how long a party has been sitting.
alter table public.store_tables add column if not exists seated_at timestamptz;
alter table public.store_tables add column if not exists guest_count int;

-- How long this item should take. Falls back to the station default in the app.
alter table public.products add column if not exists prep_minutes numeric;

-- KDS reads open lines constantly; index the path it uses.
create index if not exists idx_pol_kds on public.pos_order_lines (order_id, kds_status);
create index if not exists idx_po_open on public.pos_orders (company_id, store_id, status, created_at desc);

-- Seat and course, so a bill can be split by seat and a table fired by course.
alter table public.pos_order_lines add column if not exists seat int;
alter table public.pos_order_lines add column if not exists void_reason_id uuid references public.pos_reason_codes(id) on delete set null;
