-- ============================================================================
-- 186-delete-guards-and-delivery-note-numbers.sql
--
-- Why this exists
--
-- 1. Deleting a warehouse took its locations with it (stock_locations.warehouse_id
--    is ON DELETE CASCADE), and every stock move in or out of those locations
--    lost its location (ON DELETE SET NULL), so the stock silently stopped
--    counting. Deleting a location did the same to its own moves.
-- 2. Deleting a Plot building took its units (and through them owners and
--    tenancies), charges, charge runs, meetings, notices, budgets, projects,
--    checklists and documents with it, and untagged its invoices and entries.
--
--    The app now checks before a delete and offers Archive instead. The
--    triggers below make the database refuse the same deletes whatever path
--    they come from, with errcode 23503 so the app's "archive it instead"
--    handling applies. When the whole company is being deleted, its row is
--    already gone by the time the cascade reaches these tables, and the delete
--    is let through: removing an empty company and discarding a restored copy
--    keep working.
--
-- 3. Delivery notes were numbered by counting them, so a deleted note's number
--    was handed out again. The app now takes the highest number used. A unique
--    index stops two notes in one company sharing a number. It is created only
--    when the table has no repeats yet; otherwise a notice says so and nothing
--    is changed.
--
-- Safe to re-run. No constraint or index name is assumed to exist.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Stock locations
-- ---------------------------------------------------------------------------
create or replace function public.guard_stock_location_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not exists (select 1 from public.companies c where c.id = old.company_id) then
    return old;   -- the company itself is being deleted
  end if;
  if exists (select 1 from public.stock_moves m
              where m.location_id = old.id or m.location_dest_id = old.id) then
    raise exception 'The location "%" holds stock or has stock moves, so it cannot be deleted. Archive it instead.', old.name
      using errcode = '23503';
  end if;
  return old;
end $fn$;

drop trigger if exists guard_stock_location_delete on public.stock_locations;
create trigger guard_stock_location_delete
  before delete on public.stock_locations
  for each row execute function public.guard_stock_location_delete();

-- ---------------------------------------------------------------------------
-- Warehouses
-- ---------------------------------------------------------------------------
create or replace function public.guard_warehouse_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not exists (select 1 from public.companies c where c.id = old.company_id) then
    return old;   -- the company itself is being deleted
  end if;
  if exists (select 1 from public.stock_locations l
              where l.warehouse_id = old.id
                and exists (select 1 from public.stock_moves m
                             where m.location_id = l.id or m.location_dest_id = l.id)) then
    raise exception 'The warehouse "%" has locations that hold stock or have stock moves, so it cannot be deleted. Archive it instead.', old.name
      using errcode = '23503';
  end if;
  return old;
end $fn$;

drop trigger if exists guard_warehouse_delete on public.warehouses;
create trigger guard_warehouse_delete
  before delete on public.warehouses
  for each row execute function public.guard_warehouse_delete();

-- ---------------------------------------------------------------------------
-- Plot buildings
-- ---------------------------------------------------------------------------
create or replace function public.guard_property_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare what text;
begin
  if not exists (select 1 from public.companies c where c.id = old.company_id) then
    return old;   -- the company itself is being deleted
  end if;
  if exists (select 1 from public.property_units x where x.property_id = old.id) then
    what := 'units';
  elsif exists (select 1 from public.property_charges x where x.property_id = old.id) then
    what := 'charges';
  elsif exists (select 1 from public.property_charge_runs x where x.property_id = old.id) then
    what := 'charge runs';
  elsif exists (select 1 from public.invoices x where x.property_id = old.id) then
    what := 'invoices';
  elsif exists (select 1 from public.journal_entries x where x.property_id = old.id) then
    what := 'payments or journal entries';
  end if;
  if what is not null then
    raise exception 'The building "%" has %, so it cannot be deleted. Archive it instead.', old.name, what
      using errcode = '23503';
  end if;
  return old;
end $fn$;

drop trigger if exists guard_property_delete on public.properties;
create trigger guard_property_delete
  before delete on public.properties
  for each row execute function public.guard_property_delete();

-- ---------------------------------------------------------------------------
-- Delivery note numbers: one number per note inside a company
-- ---------------------------------------------------------------------------
do $$
declare repeats integer;
begin
  select count(*) into repeats from (
    select 1 from public.delivery_notes
     where number is not null and number <> ''
     group by company_id, number
    having count(*) > 1
  ) d;
  if repeats > 0 then
    raise notice 'delivery_notes has % number(s) used more than once inside a company, so the unique index was not created. Give the repeated notes their own numbers, then run this file again.', repeats;
  else
    create unique index if not exists uq_delivery_notes_company_number
      on public.delivery_notes (company_id, number)
      where number is not null and number <> '';
  end if;
end $$;
