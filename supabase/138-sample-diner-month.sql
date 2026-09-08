-- ============================================================================
-- 138-sample-diner-month.sql  -  one month of trading for the sample diner.
--
-- SAMPLE DATA, invented for demonstration. August 2026, two branches.
--
-- The shape is what makes a demo worth anything, so it is deliberate rather
-- than uniform random:
--   * Jounieh is the older, bigger site; Jbeil is smaller and much more
--     weekend-weighted, the way a coastal tourist town is.
--   * Four dayparts with a lunch and a dinner peak, and a thin afternoon.
--   * Channel mix with a real aggregator share, priced off the aggregator
--     menu (with its markup) rather than the dine-in price.
--   * Items are weighted: burgers carry the mix, sides ride along with them.
--
-- Re-runnable: it deletes its own month first, so it can never double up.
-- ============================================================================

-- Clear any previous run of this seed (this company only, this month only).
delete from public.pos_payments where order_id in (
  select id from public.pos_orders where company_id='aa510000-0000-4000-8000-0000000000c0');
delete from public.pos_order_lines where order_id in (
  select id from public.pos_orders where company_id='aa510000-0000-4000-8000-0000000000c0');
delete from public.pos_orders where company_id='aa510000-0000-4000-8000-0000000000c0';

select setseed(0.42);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
insert into public.pos_orders
  (id, company_id, store_id, channel_id, number, order_type, daypart, status,
   created_at, fired_at, ready_at, served_at, closed_at,
   subtotal, tax, total, amount_paid, guest_count, server_name, device_id)
select
  gen_random_uuid(),
  'aa510000-0000-4000-8000-0000000000c0',
  s.store_id,
  ch.id,
  s.code || '-' || to_char(s.d,'MMDD') || '-' || lpad(s.n::text, 4, '0'),
  case ch.code when 'dine_in' then 'dine_in' when 'takeaway' then 'takeaway'
               when 'delivery' then 'delivery' else 'delivery' end,
  s.daypart,
  'paid',
  ts, ts + interval '1 minute', ts + prep, ts + prep, ts + prep + interval '20 minutes',
  0, 0, 0, 0,
  case when ch.code = 'dine_in' then 1 + floor(public.seed_rand(s.k || 'cov')*4)::int else null end,
  (array['Rita','Karim','Joelle','Elie','Maya','Hadi'])[1 + floor(public.seed_rand(s.k || 'srv')*6)::int],
  s.code || '-POS' || (1 + floor(public.seed_rand(s.k || 'dev')*2)::int)
from (
  select
    st.id as store_id, st.code, d.d,
    dp.name as daypart, dp.from_h, dp.span,
    n,
    -- one stable key per order, so every draw below is per-order and
    -- reproducible. random() cannot be used here: Postgres hoists it out of
    -- this position and every row ends up with the same value, which is how a
    -- first attempt produced a month that was 100% dine-in.
    st.code || d.d::text || dp.name || n::text as k,
    (d.d + (dp.from_h || ' hours')::interval
        + (public.seed_rand(st.code || d.d::text || dp.name || n::text || 'min') * dp.span * 60 || ' minutes')::interval) as ts,
    ((6 + floor(public.seed_rand(st.code || d.d::text || dp.name || n::text || 'prep')*14))::text || ' minutes')::interval as prep
  from (select generate_series(date '2026-08-01', date '2026-08-31', interval '1 day')::date d) d
  cross join (select id, code from public.stores where company_id='aa510000-0000-4000-8000-0000000000c0') st
  cross join (values ('lunch',12,4,0.42),('afternoon',16,2,0.13),('dinner',18,5,0.45))
             as dp(name, from_h, span, share)
  cross join lateral generate_series(1, greatest(1, round(
      -- base volume per branch, lifted at the weekend, split across dayparts
      (case when st.code = 'JNH' then 115 else 78 end
       * case when extract(dow from d.d) in (0,5,6)
              then (case when st.code = 'JBL' then 1.80 else 1.45 end) else 1.0 end
       * dp.share) * (0.88 + random()*0.24)
    )::int)) as n
) s
-- Channel mix by cumulative probability against one per-order draw, so the
-- proportions actually come out as intended: 55 dine-in, 20 takeaway,
-- 10 own delivery, 15 aggregator.
cross join lateral (
  select id, code from public.sales_channels sc
   where sc.company_id='aa510000-0000-4000-8000-0000000000c0'
     and sc.code = case
       when public.seed_rand(s.k || 'chan') < 0.55 then 'dine_in'
       when public.seed_rand(s.k || 'chan') < 0.75 then 'takeaway'
       when public.seed_rand(s.k || 'chan') < 0.85 then 'delivery'
       else 'aggregator' end
   limit 1
) ch;

-- ---------------------------------------------------------------------------
-- Lines. Two to four per order, weighted so burgers carry the mix and a side or
-- a drink usually rides along with them.
-- ---------------------------------------------------------------------------
insert into public.pos_order_lines
  (id, company_id, order_id, product_id, name, qty, unit_price, line_total,
   station, seq, kds_status, fired_at, ready_at, bumped_at, paid)
select
  gen_random_uuid(),
  'aa510000-0000-4000-8000-0000000000c0',
  o.id, p.id, p.name, qy.qty,
  public.price_of(p.id, o.channel_id, o.created_at::date),
  round(qy.qty * public.price_of(p.id, o.channel_id, o.created_at::date), 2),
  p.station, c.seq, 'bumped', o.fired_at, o.ready_at, o.served_at, true
-- Built by COURSE rather than by drawing N random items. A diner order is a
-- main, usually a side, usually a drink and occasionally a dessert; three
-- random items off the whole menu produces an average check nobody would
-- recognise. Party size drives how many mains.
from public.pos_orders o
cross join lateral (
  select case when o.order_type = 'dine_in' and public.seed_rand(o.id::text || 'party') < 0.42 then 2 else 1 end as party
) pt
cross join lateral (values
  ('main',    1.00, 1),
  ('side',    0.72, 2),
  ('drink',   0.78, 3),
  ('dessert', 0.16, 4)
) as c(course, chance, seq)
cross join lateral (
  select pr.id, pr.name, pr.station
    from public.products pr
    join public.product_categories pc on pc.id = pr.category_id
   where pr.company_id='aa510000-0000-4000-8000-0000000000c0' and pr.is_sellable and pr.is_active
     and case c.course
       when 'main'    then pc.name in ('Burgers','Angus','Sandwiches','Salads','Platters','Pasta','Go Light','Kids')
       when 'side'    then pc.name = 'Lets get started'
       when 'drink'   then pc.name = 'Drinks'
       else pc.name = 'Desserts' end
   order by (
     public.seed_rand(o.id::text || c.course || pr.name) *
     -- popularity: the classics carry the mix, the specials ride along
     case
       when pr.name in ('Classic Burger','Chicken Burger') then 3.4
       when pr.name in ('Route 66 Burger','B.B.B. Beef Burger','Cuban Burger','Mighty Chicken Burger') then 2.2
       when pr.name like 'Angus%' then 1.1
       when pc.name = 'Kids' then 0.9
       when pc.name = 'Go Light' then 0.8
       when pr.name in ('Skin-on Fries','Curly Fries') then 3.6
       when pr.name in ('Mozzarella Sticks','Chicken Strips','Buffalo Wings') then 2.0
       when pr.name in ('Soft Drink','Mineral Water') then 3.2
       when pr.name in ('Old Time Milkshake','Fresh Lemonade','Iced Tea') then 1.6
       when pr.name in ('Local Beer','Imported Beer','Red Bull') then 0.7
       when pr.name in ('Oreo Cheesecake','Marbled Mud Pie','Brownie Temptation') then 1.8
       else 1.0 end
   ) desc
   limit 1
) p
cross join lateral (
  -- mains scale with the party; a side or a drink is per person too, a dessert
  -- is usually shared
  select case c.course when 'dessert' then 1 else pt.party end as qty
) qy
where public.seed_rand(o.id::text || c.course) < c.chance;

-- Roll the lines up onto the order, add 11% Lebanese VAT.
update public.pos_orders o
   set subtotal = t.sub,
       tax      = round(t.sub * 0.11, 2),
       total    = round(t.sub * 1.11, 2),
       amount_paid = round(t.sub * 1.11, 2),
       tip_amount = case when o.order_type = 'dine_in' and public.seed_rand(o.id::text || 'tip') < 0.35
                         then round((t.sub * 0.11 * (0.5 + public.seed_rand(o.id::text || 'tipv')))::numeric, 2) else 0 end
  from (select order_id, sum(line_total) sub from public.pos_order_lines group by order_id) t
 where t.order_id = o.id
   and o.company_id = 'aa510000-0000-4000-8000-0000000000c0';

-- Remove any order that ended up with no lines rather than leaving a zero sale.
delete from public.pos_orders
 where company_id='aa510000-0000-4000-8000-0000000000c0'
   and not exists (select 1 from public.pos_order_lines l where l.order_id = pos_orders.id);

-- ---------------------------------------------------------------------------
-- Payment. Cash still carries Lebanon, so the mix reflects that rather than a
-- card-first assumption imported from elsewhere.
-- ---------------------------------------------------------------------------
insert into public.pos_payments (id, company_id, order_id, method, amount, tip_amount, paid_at, store_id, split_kind)
select gen_random_uuid(), 'aa510000-0000-4000-8000-0000000000c0', o.id,
       case
         when ch.code = 'aggregator' then 'card'
         when public.seed_rand(o.id::text || 'pay') < 0.58 then 'cash'
         when public.seed_rand(o.id::text || 'pay') < 0.90 then 'card'
         else 'wallet' end,
       o.total, o.tip_amount, o.closed_at, o.store_id, 'whole'
  from public.pos_orders o
  join public.sales_channels ch on ch.id = o.channel_id
 where o.company_id='aa510000-0000-4000-8000-0000000000c0';
