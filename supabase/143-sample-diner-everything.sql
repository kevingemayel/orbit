-- ============================================================================
-- 143-sample-diner-everything.sql  -  every remaining Kitchen screen, populated.
--
-- SAMPLE DATA, invented for demonstration.
--
-- One honest note kept in the data itself: the Roastery section is not typical
-- for a diner. It is filled here with a small house-blend programme so the
-- screens can be seen, and the records say so.
--
-- Safe to re-run: each block clears its own rows for this company first.
-- ============================================================================

do $$
declare
  co   uuid := 'aa510000-0000-4000-8000-0000000000c0';
  jbl  uuid; jnh uuid;
  t record; e record; n int;
begin
  select id into jbl from public.stores where company_id=co and code='JBL';
  select id into jnh from public.stores where company_id=co and code='JNH';

  -- ---------------------------------------------------------------- tables
  delete from public.store_tables where company_id=co;
  insert into public.store_tables (company_id, store_id, name, zone, seats, status, sort)
  select co, s.id, z.pfx || g.n,
         z.zone, z.seats,
         (array['free','free','free','seated','ordered','bill','dirty'])[1 + (g.n % 7)],
         g.n * 10
    from public.stores s
    cross join (values ('Main floor','T',4,1,14),('Terrace','P',4,1,10),('Bar','B',2,1,6)) as z(zone,pfx,seats,lo,hi)
    cross join lateral generate_series(z.lo, case when s.code='JBL' then greatest(4, z.hi - 4) else z.hi end) g(n)
   where s.company_id=co;

  -- ------------------------------------------------------------ 86 / availability
  delete from public.store_item_availability where company_id=co;
  insert into public.store_item_availability (company_id, store_id, product_id, is_available, reason, until_date, updated_by)
  select co, jbl, p.id, false, v.why, date '2026-09-09', 'Kitchen'
    from (values ('Kale Shrimp Wasabi','Shrimp delivery missed the Monday run'),
                 ('Grilled Salmon Bowl','Salmon quality rejected on arrival')) as v(nm, why)
    join public.products p on p.company_id=co and p.name = v.nm;
  insert into public.store_item_availability (company_id, store_id, product_id, is_available, reason, updated_by)
  select co, jnh, p.id, false, 'Ice cream machine down, engineer booked', 'Shift lead'
    from public.products p where p.company_id=co and p.name='Old Time Milkshake';

  -- ------------------------------------------------------------------ counts
  delete from public.stock_count_lines where company_id=co;
  delete from public.stock_counts where company_id=co;
  insert into public.stock_counts (id, company_id, store_id, reference, count_type, count_date, is_blind, status, counted_by, approved_by, approved_at, note)
  values
    ('aa510000-0000-4000-8000-00000000c101', co, jnh, 'CNT-AUG-JNH', 'full',  date '2026-08-31', true, 'posted',  'Karim Nassar','Area manager', timestamp '2026-09-01 10:00', 'Month end, full count.'),
    ('aa510000-0000-4000-8000-00000000c102', co, jbl, 'CNT-AUG-JBL', 'full',  date '2026-08-31', true, 'review',  'Hadi Chami',  null, null, 'Month end. Two lines to explain before posting.'),
    ('aa510000-0000-4000-8000-00000000c103', co, jnh, 'CYC-W35',     'cycle', date '2026-08-28', true, 'posted',  'Joelle Feghali','Store manager', timestamp '2026-08-28 23:30', 'Weekly cycle on proteins.');

  insert into public.stock_count_lines (company_id, count_id, product_id, expected_qty, counted_qty, uom, unit_cost)
  select co, cnt.id, p.id,
         round(v.exp, 2),
         round(v.exp * (0.94 + public.seed_rand(cnt.id::text || p.name) * 0.10), 2),
         p.uom, p.cost_price
    from (values
      ('aa510000-0000-4000-8000-00000000c101','Beef patty 150g',180.0),
      ('aa510000-0000-4000-8000-00000000c101','Angus patty 180g',60.0),
      ('aa510000-0000-4000-8000-00000000c101','Chicken breast',42.0),
      ('aa510000-0000-4000-8000-00000000c101','Potato',150.0),
      ('aa510000-0000-4000-8000-00000000c101','Burger bun',260.0),
      ('aa510000-0000-4000-8000-00000000c101','Cheddar slice',400.0),
      ('aa510000-0000-4000-8000-00000000c101','Shrimp',12.0),
      ('aa510000-0000-4000-8000-00000000c102','Beef patty 150g',140.0),
      ('aa510000-0000-4000-8000-00000000c102','Chicken breast',33.0),
      ('aa510000-0000-4000-8000-00000000c102','Potato',110.0),
      ('aa510000-0000-4000-8000-00000000c102','Burger bun',200.0),
      ('aa510000-0000-4000-8000-00000000c103','Beef patty 150g',96.0),
      ('aa510000-0000-4000-8000-00000000c103','Chicken breast',24.0),
      ('aa510000-0000-4000-8000-00000000c103','Salmon fillet',7.0)
    ) as v(cid, nm, exp)
    join public.stock_counts cnt on cnt.id = v.cid::uuid
    join public.products p on p.company_id=co and p.name = v.nm;

  -- --------------------------------------------------------------- transfers
  delete from public.stock_transfer_lines where company_id=co;
  delete from public.stock_transfers where company_id=co;
  insert into public.stock_transfers (id, company_id, number, from_store_id, to_store_id, status, requested_by, dispatched_by, received_by, requested_at, dispatched_at, received_at, note)
  values
    ('aa510000-0000-4000-8000-00000000df01', co, 'TRF-0041', jnh, jbl, 'received',  'Hadi Chami','Karim Nassar','Nour Mansour', timestamp '2026-08-12 09:10', timestamp '2026-08-12 11:00', timestamp '2026-08-12 13:20', 'Jbeil short on patties before the weekend.'),
    ('aa510000-0000-4000-8000-00000000df02', co, 'TRF-0042', jnh, jbl, 'received',  'Nour Mansour','Karim Nassar','Hadi Chami', timestamp '2026-08-22 08:40', timestamp '2026-08-22 10:15', timestamp '2026-08-22 12:05', 'Two cases short on arrival, credited.'),
    ('aa510000-0000-4000-8000-00000000df03', co, 'TRF-0043', jbl, jnh, 'dispatched','Karim Nassar','Fadi Rizk', null, timestamp '2026-09-07 09:00', timestamp '2026-09-07 10:30', null, 'Returning surplus buns.');

  insert into public.stock_transfer_lines (company_id, transfer_id, product_id, qty_requested, qty_dispatched, qty_received, uom, unit_cost)
  select co, v.tid::uuid, p.id, v.req, v.dis, v.rec, p.uom, p.cost_price
    from (values
      ('aa510000-0000-4000-8000-00000000df01','Beef patty 150g',80,80,80),
      ('aa510000-0000-4000-8000-00000000df01','Burger bun',120,120,120),
      ('aa510000-0000-4000-8000-00000000df02','Chicken breast',20,20,18),
      ('aa510000-0000-4000-8000-00000000df02','Cheddar slice',200,200,200),
      ('aa510000-0000-4000-8000-00000000df02','Mozzarella stick',150,150,138),
      ('aa510000-0000-4000-8000-00000000df03','Burger bun',90,90,null)
    ) as v(tid, nm, req, dis, rec)
    join public.products p on p.company_id=co and p.name = v.nm;

  -- ------------------------------------------------------------- house coffee
  -- Not typical for a diner. Kept small, and the notes say what it is.
  delete from public.grinder_logs where company_id=co;
  delete from public.roast_batches where company_id=co;
  delete from public.green_lots where company_id=co;
  insert into public.green_lots (company_id, lot_code, supplier_id, origin, farm, region, varietal, process, harvest_year, altitude_m, moisture_pct, cupping_score, certifications, qty_kg, qty_remaining_kg, cost_per_kg, arrival_date, notes)
  values
    (co,'GL-26-011', null,'Brazil','Fazenda Rainha','Sul de Minas','Yellow Bourbon','natural',2026,1150,10.8,84.5,array['Rainforest Alliance'],240,96,5.90, date '2026-06-18','House blend base. Diner coffee programme, not a roastery business.'),
    (co,'GL-26-014', null,'Colombia','La Esperanza','Huila','Caturra','washed',2026,1700,10.2,86.0,array['Fairtrade'],120,54,8.40, date '2026-07-02','Blend top note.'),
    (co,'GL-26-019', null,'Ethiopia','Kochere co-op','Yirgacheffe','Heirloom','washed',2026,1950,10.5,88.0,array['Organic'],60,21,12.20, date '2026-07-29','Single origin, weekend special only.');

  insert into public.roast_batches (company_id, store_id, batch_code, green_lot_id, output_product_id, roast_date, roaster, profile_name, green_kg, roasted_kg, charge_temp, drop_temp, development_min, cupping_score, qc_notes)
  select co, jnh, 'RB-' || to_char(d, 'MMDD'), gl.id,
         (select id from public.products where company_id=co and name='Coffee beans'),
         d, 'Tony Aoun', 'House medium', g.kg, round((g.kg * (0.845 + public.seed_rand(d::text || 'loss') * 0.02))::numeric, 2),
         195, 210, 2.4, 84 + public.seed_rand(d::text || 'cup') * 3,
         'Even development, no scorching.'
    from (values (date '2026-08-04', 24.0), (date '2026-08-11', 30.0), (date '2026-08-18', 24.0), (date '2026-08-25', 36.0)) as g(d, kg)
    cross join lateral (select id from public.green_lots where company_id=co order by public.seed_rand(g.d::text || lot_code) limit 1) gl;

  insert into public.grinder_logs (company_id, store_id, log_date, shift, product_id, grind_setting, dose_g, yield_g, time_sec, temp_c, tasted_by, verdict)
  select co, s.id, d.d, sh.s,
         (select id from public.products where company_id=co and name='Coffee beans'),
         (2.4 + public.seed_rand(d.d::text || s.code || sh.s || 'set') * 0.8)::numeric(4,1)::text,
         18, round((36 + public.seed_rand(d.d::text || s.code || sh.s || 'y') * 4)::numeric, 1),
         round((26 + public.seed_rand(d.d::text || s.code || sh.s || 't') * 5)::numeric, 1),
         93, 'Barista',
         case when public.seed_rand(d.d::text || s.code || sh.s || 'v') < 0.72 then 'balanced'
              when public.seed_rand(d.d::text || s.code || sh.s || 'v') < 0.88 then 'slightly sour, ground finer'
              else 'bitter, ground coarser' end
    from (select generate_series(date '2026-08-24', date '2026-08-31', interval '1 day')::date d) d
    cross join (select id, code from public.stores where company_id=co) s
    cross join (values ('open'),('close')) sh(s);

  -- ------------------------------------------------------------- equipment
  delete from public.maintenance_logs where company_id=co;
  delete from public.maintenance_schedules where company_id=co;
  delete from public.equipment where company_id=co;
  insert into public.equipment (id, company_id, store_id, code, name, category, make, model, serial_no, purchase_date, warranty_until, status, location_note)
  select ('aa510000-0000-4000-8000-00000000e0' || lpad(row_number() over ()::text, 2, '0'))::uuid,
         co, case when v.br='JNH' then jnh else jbl end, v.code, v.nm, v.cat, v.mk, v.mdl, v.sn,
         v.pd::date, v.wu::date, v.st, v.loc
    from (values
      ('JNH','EQ-101','Main griddle 1200mm','oven','MKN','FlexiChef','MKN-88213','2019-02-10','2026-02-10','active','Hot line'),
      ('JNH','EQ-102','Double fryer','oven','Frymaster','FPP345','FRY-55120','2019-02-10','2026-02-10','active','Hot line'),
      ('JNH','EQ-103','Walk-in fridge','fridge','Foster','WK-42','FOS-77410','2016-03-01','2024-03-01','active','Back of house'),
      ('JNH','EQ-104','Prep fridge','fridge','Polaris','PR-9','POL-31228','2021-06-14','2027-06-14','active','Prep bench'),
      ('JNH','EQ-105','Chest freezer','freezer','Liebherr','GT-6','LIE-90233','2018-09-05','2024-09-05','active','Back of house'),
      ('JNH','EQ-106','Ice cream machine','ice','Taylor','C707','TAY-11042','2022-04-19','2027-04-19','repair','Dessert station'),
      ('JNH','EQ-107','Espresso machine','espresso_machine','La Marzocco','Linea PB','LMZ-40219','2023-01-30','2028-01-30','active','Bar'),
      ('JNH','EQ-108','Coffee grinder','grinder','Mahlkonig','E65S','MAH-77301','2023-01-30','2028-01-30','active','Bar'),
      ('JBL','EQ-201','Main griddle 900mm','oven','MKN','FlexiChef','MKN-88999','2019-06-15','2026-06-15','active','Hot line'),
      ('JBL','EQ-202','Single fryer','oven','Frymaster','FPP230','FRY-55980','2019-06-15','2026-06-15','active','Hot line'),
      ('JBL','EQ-203','Walk-in fridge','fridge','Foster','WK-30','FOS-77900','2019-06-15','2025-06-15','active','Back of house'),
      ('JBL','EQ-204','Prep fridge','fridge','Polaris','PR-6','POL-31900','2019-06-15','2025-06-15','active','Prep bench'),
      ('JBL','EQ-205','Chest freezer','freezer','Liebherr','GT-4','LIE-90900','2019-06-15','2025-06-15','active','Back of house'),
      ('JBL','EQ-206','Espresso machine','espresso_machine','La Marzocco','Linea Mini','LMZ-40900','2022-05-11','2027-05-11','active','Bar')
    ) as v(br, code, nm, cat, mk, mdl, sn, pd, wu, st, loc);

  insert into public.maintenance_schedules (company_id, equipment_id, task, frequency_days, last_done, next_due)
  select co, eq.id, v.task, v.days, v.last::date, (v.last::date + v.days)
    from (values
      ('EQ-107','Backflush and clean group heads',1,'2026-09-07'),
      ('EQ-107','Descale',90,'2026-07-02'),
      ('EQ-108','Burr check and calibration',30,'2026-08-20'),
      ('EQ-102','Oil change and boil-out',7,'2026-09-04'),
      ('EQ-103','Gasket and coil service',180,'2026-04-10'),
      ('EQ-106','Full strip and sanitise',14,'2026-08-26'),
      ('EQ-206','Backflush and clean group heads',1,'2026-09-07'),
      ('EQ-202','Oil change and boil-out',7,'2026-09-02'),
      ('EQ-203','Gasket and coil service',180,'2026-03-01')
    ) as v(code, task, days, last)
    join public.equipment eq on eq.company_id=co and eq.code = v.code;

  insert into public.maintenance_logs (company_id, equipment_id, log_date, kind, done_by, cost, downtime_hours, note)
  select co, eq.id, v.d::date, v.kind, v.who, v.cost, v.dt, v.note
    from (values
      ('EQ-106','2026-08-26','breakdown','Taylor service agent',420.00,9.0,'Compressor fault. Parts on order, machine out of service.'),
      ('EQ-104','2026-08-14','repair','In-house',0.00,1.5,'Door seal replaced after the temperature excursion.'),
      ('EQ-102','2026-09-04','preventive','Karim Nassar',65.00,1.0,'Oil changed, boil-out done.'),
      ('EQ-203','2026-03-01','preventive','Foster engineer',180.00,2.0,'Annual service, gas topped up.')
    ) as v(code, d, kind, who, cost, dt, note)
    join public.equipment eq on eq.company_id=co and eq.code = v.code;

  -- ----------------------------------------------------------------- audits
  delete from public.audit_actions where company_id=co;
  delete from public.store_audits where company_id=co;
  insert into public.store_audits (id, company_id, store_id, audit_date, auditor, kind, score, max_score, status, summary)
  values
    ('aa510000-0000-4000-8000-00000000a101', co, jnh, date '2026-08-19','Area manager','brand_standards',88,100,'actioned','Strong service and speed. Marked down on back-of-house tidiness and one out-of-date label.'),
    ('aa510000-0000-4000-8000-00000000a102', co, jbl, date '2026-08-20','Area manager','brand_standards',74,100,'actioned','Front of house good. Temperature log gaps and the prep fridge excursion pulled the score down.'),
    ('aa510000-0000-4000-8000-00000000a103', co, jnh, date '2026-08-27','External','food_safety',92,100,'closed','No critical findings. Two minor observations closed on the day.'),
    ('aa510000-0000-4000-8000-00000000a104', co, jbl, date '2026-09-02','Mystery shopper','mystery_shopper',81,100,'issued','Order correct, 14 minutes to serve. Greeting missed at the door.');

  insert into public.audit_actions (company_id, audit_id, finding, severity, owner, due_date, status)
  select co, v.aid::uuid, v.f, v.sev, v.own, v.due::date, v.st
    from (values
      ('aa510000-0000-4000-8000-00000000a101','Dry store shelving not labelled to standard','minor','Karim Nassar','2026-08-26','done'),
      ('aa510000-0000-4000-8000-00000000a101','One sauce container past its use-by label','major','Karim Nassar','2026-08-21','verified'),
      ('aa510000-0000-4000-8000-00000000a102','Temperature log has gaps on 14 and 15 August','critical','Hadi Chami','2026-08-24','verified'),
      ('aa510000-0000-4000-8000-00000000a102','Prep fridge door seal perished','major','Hadi Chami','2026-08-22','done'),
      ('aa510000-0000-4000-8000-00000000a102','Staff handwash sign missing at the rear sink','minor','Nour Mansour','2026-09-01','open'),
      ('aa510000-0000-4000-8000-00000000a104','Door greeting not delivered within 30 seconds','minor','Fadi Rizk','2026-09-16','open')
    ) as v(aid, f, sev, own, due, st);

  -- --------------------------------------------------------- licences
  delete from public.compliance_documents where company_id=co;
  insert into public.compliance_documents (company_id, store_id, name, kind, reference, issued_on, expires_on, issuer, reminder_days)
  select co, case when v.br='JNH' then jnh when v.br='JBL' then jbl else null end,
         v.nm, v.kind, v.ref, v.iss::date, v.exp::date, v.by, 45
    from (values
      ('JNH','Restaurant operating licence','licence','JNH-2019-4471','2025-01-15','2027-01-14','Ministry of Tourism'),
      ('JNH','Food safety certificate','certificate','FS-JNH-8812','2026-02-01','2027-01-31','Ministry of Public Health'),
      ('JNH','Public liability insurance','insurance','PLI-99231','2026-01-01','2026-12-31','Bankers Assurance'),
      ('JNH','Lease agreement','lease','LSE-JNH','2016-03-01','2027-02-28','Landlord'),
      ('JBL','Restaurant operating licence','licence','JBL-2019-2210','2024-07-01','2026-10-31','Ministry of Tourism'),
      ('JBL','Food safety certificate','certificate','FS-JBL-4410','2025-11-10','2026-11-09','Ministry of Public Health'),
      ('JBL','Alcohol licence','permit','ALC-JBL-771','2026-01-01','2026-12-31','Municipality of Jbeil'),
      ('JBL','Lease agreement','lease','LSE-JBL','2019-06-15','2029-06-14','Landlord')
    ) as v(br, nm, kind, ref, iss, exp, by);
end $$;
