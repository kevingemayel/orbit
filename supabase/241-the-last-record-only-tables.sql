-- 241: the last of the tables with rows and no way in.
--
-- Four small ones, each the same shape: a record that was written once by
-- something that no longer exists, and then nothing read it.
--
--   maintenance_logs (4)        work actually done on a machine. The schedules
--                               screen showed when a backflush was next due and
--                               the only way to close one was to edit the dates
--                               by hand, which makes it a reminder rather than
--                               a maintenance record. Logging the work now
--                               advances the schedule, which is the loop.
--   delivery_zones (5)          a zone, its fee, its minimum order and how long
--                               it should take. The deliveries screen had a fee
--                               typed by hand and never looked at the zone.
--   marketing_fund_entries (4)  a franchise marketing levy in and spend out.
--                               Nobody could see the balance, which is the only
--                               figure a franchisee ever asks about.
--   aggregator_disputes (1)     a short payment nobody could open.
--
-- Nothing clever here. The point of writing it down is that each one now has an
-- entry and an exit, and the sweep in tests/dead-schema.ps1 can see it.

alter table public.maintenance_logs
  add column if not exists created_by uuid default auth.uid();
create index if not exists maintenance_logs_equip_idx on public.maintenance_logs (equipment_id, log_date desc);
create index if not exists maintenance_logs_sched_idx on public.maintenance_logs (schedule_id);

alter table public.delivery_zones
  add column if not exists created_at timestamptz default now();
create index if not exists delivery_zones_company_idx on public.delivery_zones (company_id, store_id);

alter table public.marketing_fund_entries
  add column if not exists created_at timestamptz default now(),
  add column if not exists created_by uuid default auth.uid();
create index if not exists marketing_fund_fr_idx on public.marketing_fund_entries (company_id, franchisee_id, entry_date);

alter table public.aggregator_disputes
  add column if not exists created_at timestamptz default now(),
  add column if not exists created_by uuid default auth.uid();
create index if not exists aggregator_disputes_payout_idx on public.aggregator_disputes (payout_id);
create index if not exists aggregator_orders_payout_idx on public.aggregator_orders (company_id, account_id, ordered_at desc);

-- @chunk
-- ------------------------------------------- work done closes the schedule
create or replace function public.maintenance_log_add(
  p_equipment uuid, p_schedule uuid default null, p_date date default current_date,
  p_kind text default 'service', p_done_by text default null, p_cost numeric default 0,
  p_downtime numeric default 0, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_cid uuid; v_eq uuid; v_sch public.maintenance_schedules; v_id uuid; v_next date;
begin
  -- An unscheduled repair has no schedule, and a record variable that was never
  -- assigned raises on the first field read ("record v_sch is not assigned
  -- yet"), so the select runs either way: with a null id it simply finds
  -- nothing and leaves every field null, which is what the tests below read.
  select * into v_sch from public.maintenance_schedules where id = p_schedule;
  if p_schedule is not null and v_sch.id is null then raise exception 'That schedule no longer exists.'; end if;
  if v_sch.id is not null then
    v_cid := v_sch.company_id; v_eq := coalesce(p_equipment, v_sch.equipment_id);
  else
    select company_id into v_cid from public.equipment where id = p_equipment;
    if v_cid is null then raise exception 'That machine no longer exists.'; end if;
    v_eq := p_equipment;
  end if;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{kitchen,service,site,inventory}'::text[]) then
    raise exception 'Your role cannot record maintenance. It needs Work in Kitchen, Service, Projects or Inventory.';
  end if;

  insert into public.maintenance_logs (company_id, equipment_id, schedule_id, log_date, kind, done_by, cost, downtime_hours, note)
  values (v_cid, v_eq, p_schedule, coalesce(p_date, current_date), coalesce(p_kind, 'service'),
          nullif(btrim(coalesce(p_done_by, '')), ''), coalesce(p_cost, 0), coalesce(p_downtime, 0),
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_id;

  -- the whole point: a schedule that is closed by the work, not by editing dates
  if v_sch.id is not null then
    v_next := case when coalesce(v_sch.frequency_days, 0) > 0
                   then coalesce(p_date, current_date) + v_sch.frequency_days
                   else v_sch.next_due end;
    update public.maintenance_schedules
       set last_done = coalesce(p_date, current_date), next_due = v_next
     where id = p_schedule;
  end if;
  return jsonb_build_object('ok', true, 'log', v_id, 'next_due', v_next);
end $fn$;
grant execute on function public.maintenance_log_add(uuid, uuid, date, text, text, numeric, numeric, text) to authenticated;

-- @chunk
-- -------------------------------------------- what a zone costs to deliver to
create or replace function public.delivery_zone_for(p_zone uuid, p_order_total numeric default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare z public.delivery_zones;
begin
  select * into z from public.delivery_zones where id = p_zone;
  if z.id is null then return jsonb_build_object('ok', false); end if;
  return jsonb_build_object('ok', true, 'zone', z.name, 'fee', coalesce(z.fee, 0),
    'min_order', z.min_order, 'max_minutes', z.max_minutes,
    'active', coalesce(z.is_active, true),
    'meets_minimum', (z.min_order is null or p_order_total is null or p_order_total >= z.min_order),
    'short_by', case when z.min_order is not null and p_order_total is not null and p_order_total < z.min_order
                     then round(z.min_order - p_order_total, 2) else null end);
end $fn$;
grant execute on function public.delivery_zone_for(uuid, numeric) to authenticated;

-- ------------------------------------------- what is left in the marketing fund
-- The only figure a franchisee ever asks about, and nothing could answer it.
-- A levy is money in, spend is money out, and the balance is what the brand is
-- holding on their behalf.
create or replace function public.marketing_fund_balance(p_company uuid, p_franchisee uuid default null)
returns table (franchisee_id uuid, franchisee text, levied numeric, spent numeric, balance numeric, entries int, last_entry date)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select e.franchisee_id, f.name,
         round(coalesce(sum(case when lower(coalesce(e.kind, 'levy')) in ('levy', 'contribution', 'in') then e.amount else 0 end), 0), 2),
         round(coalesce(sum(case when lower(coalesce(e.kind, 'levy')) in ('levy', 'contribution', 'in') then 0 else e.amount end), 0), 2),
         round(coalesce(sum(case when lower(coalesce(e.kind, 'levy')) in ('levy', 'contribution', 'in') then e.amount else -e.amount end), 0), 2),
         count(*)::int, max(e.entry_date)
    from public.marketing_fund_entries e
    left join public.franchisees f on f.id = e.franchisee_id
   where e.company_id = p_company
     and (p_franchisee is null or e.franchisee_id = p_franchisee)
   group by e.franchisee_id, f.name
   order by f.name;
$fn$;
grant execute on function public.marketing_fund_balance(uuid, uuid) to authenticated;

-- @chunk
-- ---------------------------------------------------- a short payment, opened
create or replace function public.aggregator_dispute_raise(p_payout uuid, p_amount numeric, p_reason text, p_order uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare p public.aggregator_payouts; v_id uuid;
begin
  select * into p from public.aggregator_payouts where id = p_payout;
  if p.id is null then raise exception 'That payout no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(p.company_id, '{kitchen,pos,accounting}'::text[]) then
    raise exception 'Your role cannot raise a dispute. It needs Work in Kitchen, the till or Accounting.';
  end if;
  if coalesce(p_amount, 0) = 0 then raise exception 'A dispute needs an amount.'; end if;
  if coalesce(btrim(coalesce(p_reason, '')), '') = '' then raise exception 'Say what is being disputed. It is what you will quote to them.'; end if;
  insert into public.aggregator_disputes (company_id, payout_id, aggregator_order_id, amount, reason, status, raised_on)
  values (p.company_id, p_payout, p_order, p_amount, btrim(p_reason), 'open', current_date)
  returning id into v_id;
  update public.aggregator_payouts set status = 'disputed' where id = p_payout and coalesce(status, '') <> 'settled';
  return v_id;
end $fn$;
grant execute on function public.aggregator_dispute_raise(uuid, numeric, text, uuid) to authenticated;

create or replace function public.aggregator_dispute_close(p_dispute uuid, p_outcome text default 'resolved', p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare d public.aggregator_disputes; v_open int;
begin
  select * into d from public.aggregator_disputes where id = p_dispute;
  if d.id is null then raise exception 'That dispute no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(d.company_id, '{kitchen,pos,accounting}'::text[]) then
    raise exception 'Your role cannot close a dispute.';
  end if;
  if coalesce(d.status, 'open') <> 'open' then raise exception 'That dispute is already %.', d.status; end if;
  update public.aggregator_disputes
     set status = case when lower(coalesce(p_outcome, 'resolved')) in ('lost', 'rejected', 'written_off') then 'lost' else 'resolved' end,
         resolved_on = current_date,
         note = coalesce(nullif(btrim(coalesce(p_note, '')), ''), note)
   where id = p_dispute;
  -- a payout with nothing left open is no longer disputed
  select count(*) into v_open from public.aggregator_disputes
   where payout_id = d.payout_id and coalesce(status, 'open') = 'open';
  if v_open = 0 and d.payout_id is not null then
    update public.aggregator_payouts set status = 'matched'
     where id = d.payout_id and coalesce(status, '') = 'disputed';
  end if;
  return jsonb_build_object('ok', true, 'still_open', v_open);
end $fn$;
grant execute on function public.aggregator_dispute_close(uuid, text, text) to authenticated;

select 'the last record-only tables act' as done,
       (select count(*) from public.maintenance_logs) as logs,
       (select count(*) from public.delivery_zones) as zones,
       (select count(*) from public.marketing_fund_entries) as fund_entries,
       (select count(*) from public.aggregator_disputes) as disputes;
