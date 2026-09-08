-- ============================================================================
-- 150-reservations.sql  -  a few fields a booking actually needs.
--
-- Reservations existed as a table and a generic list screen, filed under
-- Delivery. A restaurant does not keep bookings in a spreadsheet: it keeps a
-- BOOK, read by time, with covers per sitting and one move to seat a party.
-- The screen is the real work; these are the four fields it needs.
--
-- Safe to re-run.
-- ============================================================================

alter table public.reservations
  add column if not exists duration_minutes int not null default 90,
  add column if not exists seated_at timestamptz,
  add column if not exists source text not null default 'phone',
  add column if not exists order_id uuid references public.pos_orders (id) on delete set null,
  add column if not exists occasion text;

-- The book is read one day at a time, per store.
create index if not exists reservations_book_idx
  on public.reservations (company_id, store_id, reserved_for);

comment on column public.reservations.duration_minutes is
  'How long the table is held. Used to work out which tables are free at a given time.';
comment on column public.reservations.source is
  'phone, walk_in, online, aggregator - where the booking came from.';
