-- ============================================================================
-- 153-counter-service.sql  -  counter service and order numbers.
--
-- A coffee shop has no tables to tap. The customer orders at the counter, pays
-- there, is given a NUMBER, and waits for it to be called. The whole floor plan
-- model is wrong for them: there is no table to seat, no bill to leave open,
-- and no waiter to carry it.
--
-- So: a per-store call number that resets every day, and the two timestamps a
-- collection flow needs.
--
-- The counter is a number, not a sequence object, because a shop wants "order
-- 42" and to start again at 1 tomorrow. A counter row per store per day makes
-- that atomic, which matters when three tills are ringing at once.
--
-- Safe to re-run.
-- ============================================================================

alter table public.pos_orders
  add column if not exists call_number int,
  add column if not exists ready_called_at timestamptz,
  add column if not exists collected_at timestamptz;

create index if not exists pos_orders_call_idx
  on public.pos_orders (company_id, store_id, call_number)
  where call_number is not null;

create table if not exists public.pos_call_counters (
  company_id uuid not null references public.companies (id) on delete cascade,
  store_id uuid references public.stores (id) on delete cascade,
  day date not null default current_date,
  last_no int not null default 0,
  primary key (company_id, store_id, day)
);

alter table public.pos_call_counters enable row level security;
drop policy if exists pos_call_counters_r on public.pos_call_counters;
drop policy if exists pos_call_counters_w on public.pos_call_counters;
create policy pos_call_counters_r on public.pos_call_counters
  for select to authenticated using (company_id in (select public.my_company_ids()));
create policy pos_call_counters_w on public.pos_call_counters
  for all to authenticated
  using (public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- One statement, so two tills cannot be handed the same number.
create or replace function public.pos_next_call_number(p_company uuid, p_store uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.can_write_company(p_company) then
    raise exception 'not allowed';
  end if;
  insert into public.pos_call_counters (company_id, store_id, day, last_no)
  values (p_company, p_store, current_date, 1)
  on conflict (company_id, store_id, day)
  do update set last_no = public.pos_call_counters.last_no + 1
  returning last_no into n;
  -- roll back to 1 after 999 so the board never shows a four digit number
  if n > 999 then
    update public.pos_call_counters set last_no = 1
     where company_id = p_company and store_id is not distinct from p_store and day = current_date;
    n := 1;
  end if;
  return n;
end $$;

grant execute on function public.pos_next_call_number(uuid, uuid) to authenticated;

-- Menu categories carry an image and an order, so a till can be laid out the
-- way the shop thinks rather than alphabetically.
alter table public.product_categories
  add column if not exists sort int not null default 0,
  add column if not exists color text,
  add column if not exists is_menu boolean not null default true;

comment on column public.product_categories.is_menu is
  'Show this category on the counter and order pad. Turn off for raw ingredients.';

-- Ingredient categories are not something a cashier ever taps.
update public.product_categories set is_menu = false
 where lower(name) in ('ingredients', 'raw materials', 'consumables') and is_menu;
