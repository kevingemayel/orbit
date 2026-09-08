-- ============================================================================
-- 144-sample-diner-guests-people.sql
--   Guests, delivery, workforce, franchise and the ancillary lines.
--   SAMPLE DATA, invented for demonstration. Safe to re-run.
-- ============================================================================

do $$
declare
  co  uuid := 'aa510000-0000-4000-8000-0000000000c0';
  og  uuid;
  jbl uuid; jnh uuid; prog uuid; i int;
begin
  select org_id into og from public.companies where id = co;
  select id into jbl from public.stores where company_id=co and code='JBL';
  select id into jnh from public.stores where company_id=co and code='JNH';

  -- ------------------------------------------------------------ guests
  delete from public.loyalty_transactions where company_id=co;
  delete from public.loyalty_accounts where company_id=co;
  delete from public.stored_value_transactions where company_id=co;
  delete from public.stored_value_accounts where company_id=co;
  delete from public.subscription_redemptions where company_id=co;
  delete from public.subscriptions where company_id=co;
  delete from public.subscription_plans where company_id=co;
  delete from public.partners where company_id=co and name like 'Guest %';

  -- a small book of named regulars, so the loyalty screens have people in them
  insert into public.partners (org_id, company_id, name, is_customer, email, phone, marketing_opt_in, birthday)
  select og, co, 'Guest ' || v.n, true,
         lower(replace(v.n,' ','.')) || '@example.com', '+9613' || (100000 + g)::text,
         (g % 3 <> 0), (date '1985-01-01' + (g * 137)::int)
    from (values ('Rami Aoun'),('Cynthia Khalil'),('Georges Bou Nassif'),('Yara Chidiac'),
                 ('Marc Estephan'),('Nadine Sfeir'),('Wissam Daher'),('Rita Aziz'),
                 ('Elias Matta'),('Perla Ghosn'),('Charbel Rahme'),('Tala Zeidan')) as v(n)
    cross join lateral (select row_number() over () as g) x;

  select id into prog from public.loyalty_programs where company_id=co limit 1;
  if prog is null then
    insert into public.loyalty_programs (company_id, name, kind, stamps_required, is_active, starts_on)
    values (co,'Burger card','stamp',9,true,date '2026-01-01') returning id into prog;
  end if;

  insert into public.loyalty_accounts (company_id, program_id, partner_id, stamps_balance, points_balance, lifetime_spend, visits, tier, joined_on)
  select co, prog, p.id,
         (public.seed_rand(p.id::text || 'st') * 9)::int,
         round(public.seed_rand(p.id::text || 'pt') * 400),
         round((80 + public.seed_rand(p.id::text || 'sp') * 900)::numeric, 2),
         (3 + public.seed_rand(p.id::text || 'v') * 40)::int,
         case when public.seed_rand(p.id::text || 'ti') > 0.75 then 'gold'
              when public.seed_rand(p.id::text || 'ti') > 0.40 then 'silver' else 'bronze' end,
         date '2026-01-15'
    from public.partners p where p.company_id=co and p.name like 'Guest %';

  insert into public.loyalty_transactions (company_id, account_id, store_id, kind, stamps, points, created_at, note)
  select co, a.id, case when public.seed_rand(a.id::text || g::text) < 0.6 then jnh else jbl end,
         case when g % 5 = 0 then 'redeem' else 'earn' end,
         case when g % 5 = 0 then -9 else 1 end,
         case when g % 5 = 0 then -90 else round(public.seed_rand(a.id::text || g::text || 'p') * 30) end,
         timestamp '2026-08-01 12:00' + (g * 37 || ' hours')::interval,
         case when g % 5 = 0 then 'Free Classic Burger redeemed' else null end
    from public.loyalty_accounts a cross join generate_series(1,6) g
   where a.company_id=co;

  insert into public.stored_value_accounts (company_id, partner_id, kind, card_number, balance, currency_code, status, issued_on, expires_on)
  select co, p.id,
         case when row_number() over () <= 4 then 'gift_card' else 'wallet' end,
         'RD-' || lpad((4000 + row_number() over ())::text, 6, '0'),
         round((10 + public.seed_rand(p.id::text || 'bal') * 90)::numeric, 2), 'USD', 'active',
         date '2026-06-01', date '2027-06-01'
    from public.partners p where p.company_id=co and p.name like 'Guest %' limit 8;

  insert into public.stored_value_transactions (company_id, account_id, store_id, kind, amount, balance_after, created_at)
  select co, a.id, jnh, 'topup', 50.00, a.balance, timestamp '2026-06-01 18:00'
    from public.stored_value_accounts a where a.company_id=co;

  insert into public.subscription_plans (company_id, name, kind, price, period, daily_limit, period_limit, is_active)
  values (co,'Coffee pass','pass',29.00,'monthly',2,60,true),
         (co,'Family Sunday box','box',65.00,'monthly',null,4,true),
         (co,'Corporate lunch account','corporate',450.00,'monthly',null,null,true);

  insert into public.subscriptions (company_id, plan_id, partner_id, status, started_on, next_billing_on, redemptions_this_period)
  select co, pl.id, p.id, 'active', date '2026-07-01', date '2026-10-01',
         (public.seed_rand(p.id::text || pl.name) * 12)::int
    from public.subscription_plans pl
    join lateral (select id from public.partners where company_id=co and name like 'Guest %'
                   order by public.seed_rand(id::text || pl.name) limit 2) p on true
   where pl.company_id=co;

  -- ------------------------------------------------------------ delivery
  delete from public.deliveries where company_id=co;
  delete from public.delivery_zones where company_id=co;
  insert into public.delivery_zones (company_id, store_id, name, fee, min_order, max_minutes, is_active)
  values (co, jnh,'Jounieh centre',2.00,10.00,30,true),
         (co, jnh,'Kaslik and Zouk',3.00,15.00,40,true),
         (co, jnh,'Adma and Sahel Alma',4.00,20.00,45,true),
         (co, jbl,'Jbeil old town',2.00,10.00,25,true),
         (co, jbl,'Amchit and Blat',3.50,18.00,40,true);

  insert into public.deliveries (company_id, store_id, order_id, zone_id, rider_employee_id, status, address, phone, fee, cash_collected, settled, assigned_at, picked_up_at, delivered_at)
  select co, o.store_id, o.id, z.id, e.id,
         case when public.seed_rand(o.id::text || 'dl') < 0.90 then 'delivered'
              when public.seed_rand(o.id::text || 'dl') < 0.97 then 'picked_up' else 'failed' end,
         z.name || ', building ' || (1 + (public.seed_rand(o.id::text || 'ad') * 40)::int),
         '+9617' || (100000 + (public.seed_rand(o.id::text || 'ph') * 800000)::int)::text,
         z.fee,
         case when public.seed_rand(o.id::text || 'cash') < 0.6 then o.total else null end,
         public.seed_rand(o.id::text || 'set') < 0.85,
         o.created_at, o.created_at + interval '12 minutes', o.created_at + interval '34 minutes'
    from public.pos_orders o
    join public.sales_channels c on c.id = o.channel_id and c.code = 'delivery'
    join lateral (select id, name, fee from public.delivery_zones
                   where company_id=co and store_id = o.store_id
                   order by public.seed_rand(o.id::text || name) limit 1) z on true
    join lateral (select id from public.hr_employees
                   where company_id=co order by public.seed_rand(o.id::text || id::text) limit 1) e on true
   where o.company_id=co and o.created_at >= timestamp '2026-08-25'
   limit 120;

  -- ------------------------------------------------------------ reservations
  delete from public.reservations where company_id=co;
  insert into public.reservations (company_id, store_id, guest_name, phone, party_size, reserved_for, table_id, status, note)
  select co, t.store_id, 'Guest ' || (1000 + g)::text, '+9613' || (200000 + g)::text,
         2 + (public.seed_rand(g::text || 'ps') * 6)::int,
         timestamp '2026-09-08 19:00' + ((g % 6) || ' days')::interval + ((g % 4) || ' hours')::interval,
         t.id,
         case when g % 9 = 0 then 'no_show' when g % 5 = 0 then 'seated'
              when g % 7 = 0 then 'waitlist' else 'booked' end,
         case when g % 11 = 0 then 'Birthday, needs a high chair' else null end
    from generate_series(1, 24) g
    join lateral (select id, store_id from public.store_tables where company_id=co
                   order by public.seed_rand(g::text || id::text) limit 1) t on true;

  -- ------------------------------------------------------------ workforce
  delete from public.shift_swaps where company_id=co;
  delete from public.employee_availability where company_id=co;
  delete from public.sales_forecasts where company_id=co;
  delete from public.labour_standards where company_id=co;
  insert into public.labour_standards (company_id, store_id, daypart, from_time, to_time, sales_per_labour_hour, min_staff, role)
  select co, s.id, v.dp, v.f::time, v.t::time, v.splh, v.mn, v.role
    from public.stores s
    cross join (values ('lunch','11:30','15:30',62,6,'front'),
                       ('afternoon','15:30','18:00',38,4,'front'),
                       ('dinner','18:00','23:30',70,8,'front')) as v(dp,f,t,splh,mn,role)
   where s.company_id=co;

  insert into public.sales_forecasts (company_id, store_id, forecast_date, daypart, forecast_sales, forecast_transactions, actual_sales, method)
  select co, o.store_id, o.created_at::date, o.daypart,
         round(sum(o.total) * (0.92 + public.seed_rand(o.store_id::text || o.created_at::date::text || o.daypart) * 0.16), 2),
         count(*),
         round(sum(o.total), 2), 'trend'
    from public.pos_orders o
   where o.company_id=co and o.created_at >= timestamp '2026-08-18'
   group by o.store_id, o.created_at::date, o.daypart;

  insert into public.employee_availability (company_id, employee_id, day_of_week, from_time, to_time, is_available, note)
  select co, e.id, d, '11:00'::time, '23:30'::time,
         not (d = 1 and public.seed_rand(e.id::text) < 0.4),
         case when d = 1 and public.seed_rand(e.id::text) < 0.4 then 'University on Mondays' else null end
    from public.hr_employees e cross join generate_series(0,6) d
   where e.company_id=co;

  -- ------------------------------------------------------------ franchise
  delete from public.marketing_fund_entries where company_id=co;
  delete from public.royalty_invoices where company_id=co;
  delete from public.franchise_sales_reports where company_id=co;
  delete from public.royalty_schemes where company_id=co;
  delete from public.franchise_pipeline where company_id=co;
  delete from public.approved_suppliers where company_id=co;
  delete from public.franchisees where company_id=co;

  insert into public.franchisees (id, company_id, code, name, principals, agreement_ref, agreement_start, agreement_end, renewal_due, territory, exclusivity_radius_km, status, portal_email)
  values
    ('aa510000-0000-4000-8000-00000000fb01', co,'FR-KSA','Gulf Hospitality Co.','A. Al Rashid','AGR-2022-KSA', date '2022-04-01', date '2032-03-31', date '2031-10-01','Saudi Arabia, Eastern Province', 5, 'active','ops@example.com'),
    ('aa510000-0000-4000-8000-00000000fb02', co,'FR-UAE','Marina F&B LLC','R. Haddad; S. Nassif','AGR-2023-UAE', date '2023-09-15', date '2033-09-14', date '2033-03-15','UAE, Dubai Marina', 3, 'active','dubai@example.com'),
    ('aa510000-0000-4000-8000-00000000fb03', co,'FR-CYP','Aphrodite Dining Ltd','M. Georgiou','AGR-2026-CYP', date '2026-02-01', date '2036-01-31', date '2035-08-01','Cyprus, Limassol', 8, 'prospect','limassol@example.com');

  insert into public.royalty_schemes (company_id, franchisee_id, name, kind, percent, minimum_amount, marketing_percent, period, is_active)
  values
    (co,'aa510000-0000-4000-8000-00000000fb01','KSA standard','percent_with_minimum',6,3000,2,'monthly',true),
    (co,'aa510000-0000-4000-8000-00000000fb02','UAE tiered','tiered',4,null,2,'monthly',true),
    (co,'aa510000-0000-4000-8000-00000000fb03','Cyprus launch','percent',5,null,1.5,'monthly',true);

  update public.royalty_schemes
     set tiers = '[{"upto":80000,"percent":6},{"upto":150000,"percent":5}]'::jsonb
   where company_id=co and name='UAE tiered';

  insert into public.franchise_sales_reports (company_id, franchisee_id, period_start, period_end, net_sales, gross_sales, transactions, source, status, note)
  values
    (co,'aa510000-0000-4000-8000-00000000fb01', date '2026-07-01', date '2026-07-31', 118400, 131424, 5210,'declared','verified',null),
    (co,'aa510000-0000-4000-8000-00000000fb01', date '2026-08-01', date '2026-08-31', 126900, 140859, 5602,'declared','submitted',null),
    (co,'aa510000-0000-4000-8000-00000000fb02', date '2026-07-01', date '2026-07-31', 164200, 182262, 6140,'pos_captured','verified',null),
    (co,'aa510000-0000-4000-8000-00000000fb02', date '2026-08-01', date '2026-08-31', 171500, 190365, 6402,'pos_captured','submitted',null);
  -- Note the gap: nothing declared for Cyprus, which is the signal worth chasing.

  insert into public.marketing_fund_entries (company_id, franchisee_id, entry_date, kind, amount, campaign, description)
  values
    (co,'aa510000-0000-4000-8000-00000000fb01', date '2026-08-05','contribution',2368,'Q3 fund','July contribution at 2%'),
    (co,'aa510000-0000-4000-8000-00000000fb02', date '2026-08-05','contribution',3284,'Q3 fund','July contribution at 2%'),
    (co, null, date '2026-08-12','spend',4100,'Q3 fund','Regional social campaign, three markets'),
    (co, null, date '2026-08-26','spend',1250,'Q3 fund','Menu photography refresh');

  insert into public.franchise_pipeline (company_id, applicant_name, contact_email, territory, city, country, stage, net_worth, liquid_capital, target_open_date, owner, vetting_note)
  values
    (co,'Levant Food Group','levant@example.com','Jordan, Amman West','Amman','Jordan','vetting',4200000,900000, date '2027-03-01','Development','Financials received, awaiting bank reference.'),
    (co,'Nile Hospitality','nile@example.com','Egypt, New Cairo','Cairo','Egypt','application',2600000,550000, date '2027-06-01','Development','Application complete, site not identified.'),
    (co,'Bosphorus Diners','bos@example.com','Turkey, Istanbul Asian side','Istanbul','Turkey','lead',null,null, null,'Development','Inbound enquiry from the website.'),
    (co,'Aphrodite Dining Ltd','limassol@example.com','Cyprus, Limassol','Limassol','Cyprus','construction',3100000,780000, date '2026-11-15','Development','Approved. Fit-out under way, opening slipped three weeks.'),
    (co,'Doha Leisure WLL','doha@example.com','Qatar, West Bay','Doha','Qatar','rejected',900000,150000, null,'Development','Capital below the minimum for a first store.');

  insert into public.approved_suppliers (company_id, partner_id, product_id, is_mandatory, rebate_percent, valid_from, note)
  select co, sup.id, p.id, v.mand, v.reb, date '2026-01-01', v.note
    from (values ('Beef patty 150g', true, 3.0,'Brand-critical. Must be bought through the approved processor.'),
                 ('Angus patty 180g', true, 3.0,'Brand-critical.'),
                 ('Burger bun',       true, 2.0,'Recipe-specific bun.'),
                 ('Coffee beans',     false,1.5,'Preferred, not mandatory.')) as v(nm, mand, reb, note)
    join public.products p on p.company_id=co and p.name = v.nm
    join lateral (select id from public.partners where company_id=co and is_customer is not true limit 1) sup on true;

  -- ------------------------------------------------------------ ancillary
  delete from public.standing_orders where company_id=co;
  delete from public.wholesale_accounts where company_id=co;
  delete from public.training_bookings where company_id=co;
  delete from public.training_courses where company_id=co;
  insert into public.training_courses (company_id, name, level, duration_hours, price, is_public, is_active)
  values (co,'Grill station certification','Level 1',8,0,false,true),
         (co,'Food safety and HACCP basics','Level 1',6,0,false,true),
         (co,'Barista fundamentals','Level 1',6,120,true,true),
         (co,'Shift lead programme','Level 2',16,0,false,true);

  insert into public.training_bookings (company_id, course_id, employee_id, session_date, status, amount, paid, certificate_ref, certificate_issued_on)
  select co, c.id, e.id, date '2026-08-06' + ((row_number() over () % 4) * 7)::int,
         case when row_number() over () % 6 = 0 then 'no_show' else 'attended' end,
         c.price, c.price = 0,
         'CERT-' || lpad((row_number() over ())::text, 4, '0'), date '2026-08-20'
    from public.training_courses c
    cross join lateral (select id from public.hr_employees where company_id=co
                         order by public.seed_rand(c.name || id::text) limit 3) e
   where c.company_id=co;
end $$;
