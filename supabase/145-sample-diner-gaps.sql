-- ============================================================================
-- 145-sample-diner-gaps.sql  -  the screens the audit found still empty.
--   Suppliers, wholesale, opening/closing checklists, loss prevention, cash
--   and tips. SAMPLE DATA. Safe to re-run.
-- ============================================================================

do $$
declare
  co uuid := 'aa510000-0000-4000-8000-0000000000c0';
  og uuid; jbl uuid; jnh uuid;
begin
  select org_id into og from public.companies where id = co;
  select id into jbl from public.stores where company_id=co and code='JBL';
  select id into jnh from public.stores where company_id=co and code='JNH';

  -- ----------------------------------------------------------- suppliers
  delete from public.approved_suppliers where company_id=co;
  delete from public.partners where company_id=co and name like 'SUP %';
  insert into public.partners (org_id, company_id, name, is_vendor, is_customer, email, phone)
  select og, co, 'SUP ' || v.n, true, false, lower(replace(v.n,' ','')) || '@example.com', '+9611' || (300000 + row_number() over ())::text
    from (values ('Levant Meat Co'),('Bekaa Fresh Produce'),('Cedar Dairy'),('Blue Sea Fish'),
                 ('Beirut Bakery Supply'),('Gulf Dry Goods'),('Aqua Beverages'),('PackRight Lebanon')) as v(n);

  insert into public.approved_suppliers (company_id, partner_id, product_id, is_mandatory, rebate_percent, valid_from, note)
  select co, s.id, p.id, v.mand, v.reb, date '2026-01-01', v.note
    from (values
      ('SUP Levant Meat Co','Beef patty 150g', true, 3.0,'Brand-critical. Franchisees must buy through this processor.'),
      ('SUP Levant Meat Co','Angus patty 180g',true, 3.0,'Brand-critical.'),
      ('SUP Levant Meat Co','Chicken breast',  true, 2.5,'Brand-critical.'),
      ('SUP Beirut Bakery Supply','Burger bun',true, 2.0,'Recipe-specific bun, no substitutes.'),
      ('SUP Beirut Bakery Supply','Brioche bun',true,2.0,'Angus bun.'),
      ('SUP Cedar Dairy','Cheddar slice',      false,1.5,'Preferred.'),
      ('SUP Blue Sea Fish','Salmon fillet',    false,1.0,'Preferred, quality checked on arrival.'),
      ('SUP PackRight Lebanon','Takeaway box', false,2.0,'Branded packaging.')
    ) as v(sup, item, mand, reb, note)
    join public.partners s on s.company_id=co and s.name = v.sup
    join public.products p on p.company_id=co and p.name = v.item;

  -- ----------------------------------------------------------- wholesale
  delete from public.standing_orders where company_id=co;
  delete from public.wholesale_accounts where company_id=co;
  insert into public.wholesale_accounts (company_id, partner_id, price_tier, delivery_day, route, credit_limit, billing, volume_commitment_kg, is_active, note)
  select co, p.id, v.tier, v.day, v.route, v.lim, v.bill, v.kg, true, v.note
    from (values
      ('Guest Rami Aoun',      'Corporate A','tue','Jounieh north', 3000,'monthly', 40,'Office coffee and lunch platters, 40 staff.'),
      ('Guest Cynthia Khalil', 'Corporate B','thu','Jbeil',         1500,'monthly', 18,'Clinic, weekly platters.'),
      ('Guest Georges Bou Nassif','HORECA',  'wed','Kaslik',        5000,'monthly', 90,'Hotel breakfast supply, house blend.')
    ) as v(nm, tier, day, route, lim, bill, kg, note)
    join public.partners p on p.company_id=co and p.name = v.nm;

  insert into public.standing_orders (company_id, wholesale_account_id, product_id, qty, uom, frequency, next_date, is_active)
  select co, w.id, p.id, v.q, p.uom, v.freq, date '2026-09-10', true
    from (values
      ('Guest Rami Aoun','Coffee beans',10,'weekly'),
      ('Guest Rami Aoun','Mineral water 500ml',240,'weekly'),
      ('Guest Cynthia Khalil','Coffee beans',4,'weekly'),
      ('Guest Georges Bou Nassif','Coffee beans',22,'weekly')
    ) as v(nm, item, q, freq)
    join public.partners pa on pa.company_id=co and pa.name = v.nm
    join public.wholesale_accounts w on w.partner_id = pa.id
    join public.products p on p.company_id=co and p.name = v.item;

  -- --------------------------------------------- opening / closing rounds
  insert into public.checklist_templates (id, company_id, name, kind, frequency)
  values ('aa510000-0000-4000-8000-00000000dd02', co,'Opening the store','opening','daily'),
         ('aa510000-0000-4000-8000-00000000dd03', co,'Closing the store','closing','daily'),
         ('aa510000-0000-4000-8000-00000000dd04', co,'Hourly front of house','hourly','per_shift')
  on conflict (id) do nothing;

  insert into public.checklist_template_items (company_id, template_id, text, section, input_type, requires_photo, is_critical, sort)
  select co, v.tid::uuid, v.txt, v.sec, v.typ, v.photo, v.crit, v.sort
    from (values
      ('aa510000-0000-4000-8000-00000000dd02','Fridges and freezers within range','Kitchen','check',false,true,10),
      ('aa510000-0000-4000-8000-00000000dd02','Griddle and fryers up to temperature','Kitchen','check',false,true,20),
      ('aa510000-0000-4000-8000-00000000dd02','Fryer oil clear, filtered if needed','Kitchen','check',true,false,30),
      ('aa510000-0000-4000-8000-00000000dd02','Prep list complete and labelled','Kitchen','check',false,false,40),
      ('aa510000-0000-4000-8000-00000000dd02','Float counted and signed','Front','number',false,true,50),
      ('aa510000-0000-4000-8000-00000000dd02','Dining room and terrace set','Front','check',true,false,60),
      ('aa510000-0000-4000-8000-00000000dd02','Toilets stocked and clean','Front','check',false,false,70),
      ('aa510000-0000-4000-8000-00000000dd03','All hot equipment off and cooling','Kitchen','check',false,true,10),
      ('aa510000-0000-4000-8000-00000000dd03','Waste logged and bins out','Kitchen','check',false,false,20),
      ('aa510000-0000-4000-8000-00000000dd03','Fridges closed and within range','Kitchen','temperature',false,true,30),
      ('aa510000-0000-4000-8000-00000000dd03','Till counted, variance recorded','Front','number',false,true,40),
      ('aa510000-0000-4000-8000-00000000dd03','Cash dropped to the safe','Front','check',false,true,50),
      ('aa510000-0000-4000-8000-00000000dd03','Doors and shutters secured','Front','check',true,true,60),
      ('aa510000-0000-4000-8000-00000000dd04','Tables cleared within 3 minutes','Front','check',false,false,10),
      ('aa510000-0000-4000-8000-00000000dd04','Condiments and napkins topped up','Front','check',false,false,20),
      ('aa510000-0000-4000-8000-00000000dd04','Toilets checked','Front','check',false,false,30)
    ) as v(tid, txt, sec, typ, photo, crit, sort)
   where not exists (select 1 from public.checklist_template_items x
                      where x.template_id = v.tid::uuid and x.text = v.txt);

  insert into public.checklist_runs (company_id, store_id, template_id, run_date, shift, status, completed_by, completed_at, score)
  select co, s.id, tpl.id, d.d, tpl.kind, 'complete', 'Shift lead',
         d.d + case tpl.kind when 'opening' then interval '10 hours' else interval '23 hours' end,
         round((88 + public.seed_rand(s.code || d.d::text || tpl.kind) * 12)::numeric, 0)
    from (select generate_series(date '2026-08-25', date '2026-09-07', interval '1 day')::date d) d
    cross join (select id, code from public.stores where company_id=co) s
    cross join (select id, kind from public.checklist_templates where company_id=co and kind in ('opening','closing')) tpl
   where not exists (select 1 from public.checklist_runs r
                      where r.company_id=co and r.store_id=s.id and r.template_id=tpl.id and r.run_date=d.d);

  -- ------------------------------------------------------ loss prevention
  delete from public.pos_exceptions where company_id=co;
  insert into public.pos_exceptions (company_id, store_id, order_id, kind, reason_id, amount, qty, cashier, approved_by, occurred_at, device_id)
  select co, o.store_id, o.id,
         case when public.seed_rand(o.id::text || 'ex') < 0.45 then 'void'
              when public.seed_rand(o.id::text || 'ex') < 0.80 then 'discount'
              when public.seed_rand(o.id::text || 'ex') < 0.93 then 'comp' else 'refund' end,
         rc.id,
         round((3 + public.seed_rand(o.id::text || 'exa') * 22)::numeric, 2), 1,
         o.server_name,
         case when public.seed_rand(o.id::text || 'ap') < 0.85 then 'Store manager' else null end,
         o.created_at + interval '4 minutes', o.device_id
    from public.pos_orders o
    join lateral (select id from public.pos_reason_codes where company_id=co
                   order by public.seed_rand(o.id::text || id::text) limit 1) rc on true
   where o.company_id=co
     -- one server rings noticeably more than the rest, which is the point of the report
     and public.seed_rand(o.id::text || 'has_ex') < (case when o.server_name = 'Elie' then 0.09 else 0.022 end);

  -- ------------------------------------------------------------- cash
  delete from public.cash_drops where company_id=co;
  insert into public.cash_drops (company_id, store_id, amount, dropped_by, witnessed_by, dropped_at, note)
  select co, s.id, round((300 + public.seed_rand(s.code || d.d::text || n::text) * 500)::numeric, 2),
         'Shift lead','Store manager',
         d.d + interval '16 hours' + (n || ' hours')::interval,
         case when n = 1 then 'Mid-shift drop' else 'End of night drop' end
    from (select generate_series(date '2026-08-25', date '2026-09-06', interval '1 day')::date d) d
    cross join (select id, code from public.stores where company_id=co) s
    cross join generate_series(1,2) n;

  -- ------------------------------------------------------------- tips
  delete from public.tip_allocations where company_id=co;
  delete from public.tip_pools where company_id=co;
  insert into public.tip_pools (id, company_id, store_id, period_start, period_end, card_tips, cash_tips_declared, service_charge, method, status)
  select ('aa510000-0000-4000-8000-00000000fc0' || row_number() over (order by s.code))::uuid,
         co, s.id, date '2026-08-01', date '2026-08-31',
         round(coalesce(sum(o.tip_amount), 0), 2),
         round(coalesce(sum(o.tip_amount), 0) * 0.55, 2),
         0, 'hours', 'approved'
    from public.stores s
    left join public.pos_orders o on o.store_id = s.id and o.company_id = co
   where s.company_id = co
   group by s.id, s.code;

  insert into public.tip_allocations (company_id, pool_id, employee_id, hours, amount)
  select co, tp.id, e.id, h.hrs,
         round((tp.card_tips + tp.cash_tips_declared) * (h.hrs / sum(h.hrs) over (partition by tp.id)), 2)
    from public.tip_pools tp
    join public.hr_employees e on e.company_id = co and e.store_id = tp.store_id
    cross join lateral (select round((110 + public.seed_rand(e.id::text || 'h') * 60)::numeric, 1) as hrs) h
   where tp.company_id = co;
end $$;
