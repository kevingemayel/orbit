-- ============================================================================
-- 146-sample-live-service.sql  -  a service in progress, right now.
--
-- The month of trading is all history: every ticket bumped, every bill paid. So
-- the Kitchen display was empty and the floor plan had no live tables, which is
-- exactly the two screens you would want to show first.
--
-- This creates a service IN PROGRESS, anchored to now() rather than to a fixed
-- date, so the clocks are real: some tickets green, some amber, one or two
-- properly late, an order still on the pad that has not been sent, and tables
-- sitting at every state the floor plan can show.
--
-- Wrapped in a function because a demo an hour later needs the clocks reset.
-- Call it again and the service starts over from the current minute.
--
--   select public.sample_refresh_service();
--
-- SAMPLE DATA. Safe to re-run.
-- ============================================================================

create or replace function public.sample_refresh_service(
  p_company uuid default 'aa510000-0000-4000-8000-0000000000c0')
returns text
language plpgsql security definer set search_path = public as $fn$
declare
  jbl uuid; jnh uuid; ord uuid; tbl uuid;
  ch_dine uuid; ch_take uuid; ch_del uuid; ch_agg uuid;
  t record; made int := 0; lines_made int := 0;
begin
  select id into jbl from public.stores where company_id=p_company and code='JBL';
  select id into jnh from public.stores where company_id=p_company and code='JNH';
  select id into ch_dine from public.sales_channels where company_id=p_company and code='dine_in';
  select id into ch_take from public.sales_channels where company_id=p_company and code='takeaway';
  select id into ch_del  from public.sales_channels where company_id=p_company and code='delivery';
  select id into ch_agg  from public.sales_channels where company_id=p_company and code='aggregator';

  -- clear only the live service, never the month's history
  delete from public.pos_payments where order_id in (
    select id from public.pos_orders where company_id=p_company and status in ('open','draft'));
  delete from public.pos_order_lines where order_id in (
    select id from public.pos_orders where company_id=p_company and status in ('open','draft'));
  delete from public.pos_orders where company_id=p_company and status in ('open','draft');
  update public.store_tables set status='free', seated_at=null, current_order_id=null
   where company_id=p_company;

  for t in
    select * from (values
      -- store, table name, channel, minutes since fired (null = still on the pad),
      -- guests, guest name, allergy, how many lines are already marked ready
      ('JNH','T3',  'dine_in',   19, 4,'Rami',        null, 1),
      ('JNH','T7',  'dine_in',   13, 2,'Cynthia',     'Nut allergy, no sauces with traces', 0),
      ('JNH','T11', 'dine_in',    8, 5,'Georges',     null, 2),
      ('JNH','P2',  'dine_in',    6, 2,'Yara',        null, 0),
      ('JNH','T5',  'dine_in',    3, 3,'Marc',        null, 0),
      ('JNH','B1',  'dine_in',    1, 2,'Nadine',      null, 0),
      ('JNH',null,  'aggregator',11, null,'Toters 4471', null, 1),
      ('JNH',null,  'takeaway',   4, null,'Wissam',   null, 0),
      ('JNH','T9',  'dine_in',  null, 4,'Rita',       null, 0),
      ('JBL','T2',  'dine_in',   16, 2,'Elias',       null, 1),
      ('JBL','T6',  'dine_in',    9, 6,'Perla',       'Coeliac, no gluten at all', 0),
      ('JBL','P1',  'dine_in',    5, 2,'Charbel',     null, 0),
      ('JBL',null,  'delivery',   7, null,'Tala',     null, 0),
      ('JBL','T4',  'dine_in',  null, 3,'Ziad',       null, 0)
    ) as v(br, tbl_name, chan, mins, guests, gname, allergy, ready_n)
  loop
    tbl := null;
    if t.tbl_name is not null then
      select id into tbl from public.store_tables
       where company_id=p_company and name = t.tbl_name
         and store_id = case when t.br='JNH' then jnh else jbl end
       limit 1;
    end if;

    insert into public.pos_orders
      (company_id, store_id, channel_id, table_id, number, order_type, daypart, status,
       created_at, fired_at, guest_count, guest_name, allergy_note, server_name, device_id,
       subtotal, tax, total)
    values (
      p_company,
      case when t.br='JNH' then jnh else jbl end,
      case t.chan when 'dine_in' then ch_dine when 'takeaway' then ch_take
                  when 'delivery' then ch_del else ch_agg end,
      tbl,
      t.br || '-LIVE-' || lpad((made + 1)::text, 3, '0'),
      t.chan, 'dinner', 'open',
      now() - ((coalesce(t.mins, 2) + 4) || ' minutes')::interval,
      case when t.mins is null then null else now() - (t.mins || ' minutes')::interval end,
      t.guests, t.gname, t.allergy,
      (array['Rita','Karim','Joelle','Elie','Maya','Hadi'])[1 + (made % 6)],
      t.br || '-POS1', 0, 0, 0)
    returning id into ord;
    made := made + 1;

    -- three or four lines drawn from the live menu, weighted to the classics
    insert into public.pos_order_lines
      (company_id, order_id, product_id, name, qty, unit_price, line_total, station, seq,
       kds_status, fired_at, ready_at, modifier_note)
    select p_company, ord, p.id, p.name, ln.qty,
           p.list_price, round(ln.qty * p.list_price, 2), p.station, ln.seq,
           case when t.mins is null then 'new'
                when ln.seq <= t.ready_n then 'ready' else 'fired' end,
           case when t.mins is null then null else now() - (t.mins || ' minutes')::interval end,
           case when t.mins is not null and ln.seq <= t.ready_n
                then now() - ((t.mins / 2) || ' minutes')::interval else null end,
           case when p.name like '%Burger%' and ln.seq = 1
                then (array['Medium rare, no onion','Well done, extra cheese','Medium, side salad instead of fries'])[1 + (made % 3)]
                when p.name = 'Soft Drink' then 'Large, no ice' else null end
      from (
        -- a main, a starter, a drink, and on some tables a dessert; the main
        -- scales with the party so a table of five reads correctly on the pass
        select s as seq,
               case when s = 1 then greatest(1, least(3, coalesce(t.guests, 1))) else 1 end as qty
          from generate_series(1, 3 + (made % 2)) s
      ) ln
      cross join lateral (
        select pr.id, pr.name, pr.station, pr.list_price
          from public.products pr
          join public.product_categories pc on pc.id = pr.category_id
         where pr.company_id = p_company and pr.is_sellable and pr.is_active
           and pc.name = case ln.seq when 1 then 'Burgers' when 2 then 'Lets get started'
                                     when 3 then 'Drinks' else 'Desserts' end
         order by public.seed_rand(ord::text || ln.seq::text || pr.name)
           * case when pr.name in ('Classic Burger','Chicken Burger','Skin-on Fries',
                                   'Soft Drink','Mozzarella Sticks','Marbled Mud Pie') then 3.0 else 1.0 end desc
         limit 1
      ) p;

    -- the table takes the state the ticket implies
    if tbl is not null then
      update public.store_tables
         set status = case when t.mins is null then 'seated' else 'ordered' end,
             seated_at = now() - ((coalesce(t.mins, 2) + 9) || ' minutes')::interval,
             current_order_id = ord
       where id = tbl;
    end if;
  end loop;

  -- roll the lines up, add VAT
  update public.pos_orders o
     set subtotal = s.sub, tax = round(s.sub * 0.11, 2), total = round(s.sub * 1.11, 2)
    from (select order_id, sum(line_total) sub from public.pos_order_lines group by order_id) s
   where s.order_id = o.id and o.company_id = p_company and o.status = 'open';

  -- a couple of tables that have eaten and are waiting for the bill, and two
  -- that need clearing, so the floor plan shows every state it can
  update public.store_tables set status='bill'
   where company_id=p_company and name in ('T1','T8') ;
  update public.store_tables set status='dirty'
   where company_id=p_company and name in ('T10','P3');

  select count(*) into lines_made from public.pos_order_lines l
    join public.pos_orders o on o.id = l.order_id
   where o.company_id = p_company and o.status = 'open';

  -- tonight's book, so the first screen an owner opens is not empty either
  begin
    perform public.sample_refresh_book(p_company);
  exception when undefined_function then null;
  end;

  return made || ' live tickets, ' || lines_made || ' lines, clocks anchored to ' || to_char(now(), 'HH24:MI');
end $fn$;

select public.sample_refresh_service();
