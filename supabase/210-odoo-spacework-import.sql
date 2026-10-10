-- 210: bring Space Work's old Odoo data into its Orbit company.
--
-- Source: ODOO_EXPORT/ (spacework.odoo.com, Odoo 19 Enterprise, db 'spacework',
-- read live on 10 Aug 2026). Ten CSVs: contacts, products, projects, tasks,
-- timesheets, sales, purchases, invoices, payments, move_lines.
--
-- What is loaded: every real record. What is not, and why:
--   - Odoo's Knowledge (64 articles) and Documents (40 items) were Odoo's own
--     demo content, empty folders and crash logs. Nothing of the owner's.
--   - move_lines.csv is Odoo's ledger for the same invoices and payments loaded
--     below. Orbit posts its own entries when a document posts, so importing
--     those lines as well would count every amount twice. The only lines with
--     no document behind them, JV000001 and JV000002, are loaded as vouchers.
--   - Rows that were never a document: two unnumbered invoice drafts (one a
--     cancelled -3,000), two empty journal drafts (000003, 000004), the
--     cancelled OPENING BEMO (identical to JV000001), two zero-amount cancelled
--     payments, one draft payment, and eight contacts that are bare email
--     addresses with no name from a 2025-10-04 list import.
--
-- Idempotent: every insert checks for the same thing by name or number first,
-- so running it twice adds nothing. It does not touch anything already in Orbit.
do $odoo$
declare
  v_co uuid; v_org uuid;
  a_recv uuid; a_pay uuid; a_rev_svc uuid; a_rev_goods uuid; a_cash uuid; a_bank uuid;
  a_bank2 uuid; a_vat uuid; a_telecom uuid; a_partner uuid;
  v_proj_internal uuid; v_proj_cn uuid; v_algeco uuid;
  v_inv uuid; v_entry uuid; r record; n_posted int := 0; n_paid int := 0; n_failed int := 0;
  v_msg text;
begin
  select id, org_id into v_co, v_org from public.companies
   where name ilike 'space work%' order by created_at limit 1;
  if v_co is null then
    raise exception 'No company whose name starts with "Space Work" in this database. Create it first (or edit this script to name the right company).';
  end if;

  -- the accounts this import posts to, all from Orbit's seeded chart
  select id into a_recv      from public.accounts where company_id = v_co and code = '4100';
  select id into a_pay       from public.accounts where company_id = v_co and code = '4000';
  select id into a_rev_svc   from public.accounts where company_id = v_co and code = '7000';
  select id into a_rev_goods from public.accounts where company_id = v_co and code = '7010';
  select id into a_cash      from public.accounts where company_id = v_co and code = '5300';
  select id into a_bank      from public.accounts where company_id = v_co and code = '5100';
  select id into a_bank2     from public.accounts where company_id = v_co and code = '5150';
  select id into a_vat       from public.accounts where company_id = v_co and code = '4457';
  select id into a_telecom   from public.accounts where company_id = v_co and code = '6500';
  select id into a_partner   from public.accounts where company_id = v_co and code = '4610';
  if a_recv is null or a_pay is null or a_rev_svc is null or a_cash is null or a_partner is null then
    raise exception 'Space Work is missing one of the seeded accounts 4100 / 4000 / 7000 / 5300 / 4610. Run the company setup for it first.';
  end if;
  select id into v_algeco from public.companies where name ilike 'algeco%' order by created_at limit 1;

  -- ---------------------------------------------------------------- contacts
  -- Odoo's customer_rank / supplier_rank decide which side each one is on.
  -- is_company follows Odoo except where the row is plainly a person.
  insert into public.partners(org_id, name, is_company, is_customer, is_vendor, email, phone, city, country, street, vat, linked_company_id)
  select v_org, x.name, x.is_company, x.is_customer, x.is_vendor, x.email, x.phone, x.city, x.country, x.street, x.vat,
         case when x.name ilike 'algeco%' then v_algeco else null end
  from (values
    ('European Industrial Traders', true,  true,  false, 'info@e-i-t.eu',            '+961 1 986 984', 'Tripoly',         'Lebanon', 'Kalhat, Sea Road, EIT Factory', ''),
    ('Samer Kandil',                false, true,  false, 'samer.kandil@gmail.com',   '+961 70 258 015','Tripoly',         'Lebanon', 'Kalhat, Sea Road, EIT Factory', ''),
    ('Tony Karam',                  true,  true,  false, 'tony.karam@amstudiolb.com','+961 1 877 394', 'Jdeidet el metn', 'Lebanon', 'Cortbawi bldg', ''),
    ('AM STUDIO',                   true,  true,  false, 'info@amstudiolb.com',      '+961 1 877 394', 'Jdeidet el metn', 'Lebanon', 'Cortbawi bldg', ''),
    ('Francois Eid',                false, true,  false, '',                         '+961 3 341 869', 'Beirut',          'Lebanon', '', ''),
    ('ALGECO S.A.R.L',              true,  true,  false, 'jobs@algecoltd.com',       '71823334',       '',                'Lebanon', '', ''),
    ('GoDaddy',                     true,  false, true,  '',                         '+1 480-505-8800','Tempe',           'United States', '2155 E GoDaddy Way', '06AAECG4365R1Z1'),
    ('KHOURY HARDWARE CENTER SARL', true,  false, true,  'info@khc-lb.com',          '+961 1 251 369', 'Bauchrieh',       'Lebanon', 'St. Joseph Center St. Joseph Hospital Street', '2007266'),
    ('GMNC',                        true,  false, true,  '',                         '',               '',                '',        '', ''),
    -- Odoo spelled this one "Horzintal"; corrected on the way in
    ('Horizontal Tempering Glass',  true,  false, true,  '',                         '',               '',                '',        '', ''),
    ('Kevin Gemayel',               false, false, false, 'info@spacework.ai',        '+961 71 823 333','',                '',        '', ''),
    ('Jean Gemayel',                false, false, false, '',                         '',               '',                '',        '', ''),
    ('Sarah Hasna',                 false, false, false, 'jobs@algecoltd.com',       '+961 76 686 806','',                'Lebanon', '', '')
  ) as x(name, is_company, is_customer, is_vendor, email, phone, city, country, street, vat)
  where not exists (select 1 from public.partners p where p.org_id = v_org and lower(p.name) = lower(x.name));

  -- ---------------------------------------------------------------- products
  -- Odoo 'service' stays a service; 'consu' becomes a consumable. Prices are
  -- Odoo's sale price and cost. Two pairs of duplicates in Odoo (Cutter/cutter,
  -- and Architectural Design Phase twice) come in once.
  insert into public.products(company_id, name, type, default_code, list_price, cost_price, is_active)
  select v_co, x.name, x.type, nullif(x.code, ''), x.list_price, x.cost_price, true
  from (values
    ('Tower Curtain Wall',                                                   'service',    'BOD_001',      2500, 1000),
    ('Structural Glazing',                                                   'service',    'BOD_002',      2500, 1000),
    ('Double Skin Element',                                                  'service',    'BOD_003',      2500, 1000),
    ('Entrance Facades',                                                     'service',    'BOD_004',      2500, 1000),
    ('Service on Timesheets',                                                'service',    '',               40,    0),
    ('CN_01',                                                                'service',    '',             2500,  600),
    ('.ai domain registration',                                              'consumable', '',                1,    0),
    ('microsoft 365 email essentials',                                       'consumable', '',                1,    0),
    ('Meals',                                                                'service',    'FOOD',            1,    0),
    ('Travel & Accommodation',                                               'service',    'TRANS & ACC',     1,    0),
    ('Mileage',                                                              'service',    'MIL',             1,    1),
    ('Gifts',                                                                'service',    'GIFT',            1,    0),
    ('Communication',                                                        'service',    'COMM',            1,    0),
    ('Expenses',                                                             'service',    'EXP_GEN',         1,    0),
    ('CN Approval',                                                          'consumable', '',                1,    0),
    ('Glass',                                                                'consumable', '',                1,    0),
    ('Technical and Engineering Services',                                   'consumable', '',                0,    0),
    ('CN Sliding Louvers',                                                   'consumable', '',                1,    0),
    ('Discount',                                                             'service',    '',                0,    0),
    ('Booking Fees',                                                         'service',    '',               50,    0),
    ('Standard delivery',                                                    'service',    'Delivery_007',    0,    0),
    ('Architectural Design Phase (Pre-Execution)',                           'service',    '',                1,    0),
    ('Design_Phase_001',                                                     'service',    '',                1,    0),
    ('Facade Execution Supervision',                                         'consumable', '',                1,    0),
    ('Supply. Manufacturing and Installation of A2 Aluminum Composite Panels','consumable','',              100,    0),
    ('Outer: 6mm Clear Tempered, 12mm AS, 4,4.2mm Laminated Annealed',       'consumable', '',                0,    0),
    ('Screw',                                                                'consumable', '',                1,    0),
    ('Cutter',                                                               'consumable', '',                1,    0)
  ) as x(name, type, code, list_price, cost_price)
  where not exists (select 1 from public.products p where p.company_id = v_co and lower(p.name) = lower(x.name));

  -- ---------------------------------------------------------------- projects
  -- Odoo had "Internal" three times over (one of them OdooBot's); one here.
  insert into public.projects(company_id, name, is_active)
  select v_co, x.name, true from (values ('Internal'), ('Calculation Notes')) as x(name)
  where not exists (select 1 from public.projects p where p.company_id = v_co and lower(p.name) = lower(x.name));
  select id into v_proj_internal from public.projects where company_id = v_co and name = 'Internal' limit 1;
  select id into v_proj_cn       from public.projects where company_id = v_co and name = 'Calculation Notes' limit 1;

  -- ------------------------------------------------------------------- tasks
  insert into public.project_tasks(company_id, project_id, name, date_deadline, priority)
  select v_co, case when x.proj = 'CN' then v_proj_cn else v_proj_internal end, x.name, null, 0
  from (values
    ('Internal','Training'), ('Internal','Meeting'),
    ('CN','S00006 - CN_01'), ('CN','S00008 - For Glass Ballustrade'), ('CN','S00009 - Glass Ballustrade'),
    ('CN','S00010 - AMCA LOUVERS'), ('CN','S00011 - Fixed Louvers'), ('CN','S00011 - Sliding Louvers'),
    ('CN','S00012 - CN_01'), ('CN','S00013 - CN_01'), ('CN','S00014 - CN_01'), ('CN','S00015 - CN_01'),
    ('CN','S00016 - CN_01')
  ) as x(proj, name)
  where not exists (select 1 from public.project_tasks t where t.company_id = v_co and lower(t.name) = lower(x.name));

  -- -------------------------------------------------------------- timesheets
  -- Odoo recorded them with no employee and 1 hour each. The calculation-note
  -- ones are put on that project; the task is matched by name where one matches.
  insert into public.timesheets(company_id, project_id, task_id, work_date, name, hours)
  select v_co,
         case when x.name ilike 'CN%' or x.name ilike '%Glass%' then v_proj_cn else v_proj_internal end,
         (select t.id from public.project_tasks t where t.company_id = v_co and lower(t.name) = lower(x.name) limit 1),
         x.d::date, x.name, 1
  from (values
    ('2025-03-03','Down payment of 80.0%'),
    ('2025-03-03','CN Approval'),
    ('2025-07-15','Down Payment'),
    ('2025-06-20','CN_01 Glass Ballustrade'),
    ('2025-08-12','CN Fixed Louvers'),
    ('2025-08-12','CN Sliding Louvers'),
    ('2025-10-04','CN_01')
  ) as x(d, name)
  where not exists (select 1 from public.timesheets ts where ts.company_id = v_co and ts.work_date = x.d::date and ts.name = x.name);

  -- ------------------------------------------------------------ sale orders
  insert into public.sale_orders(company_id, number, partner_id, date_order, state, currency_code, amount_untaxed, amount_tax, amount_total)
  select v_co, x.number,
         (select p.id from public.partners p where p.org_id = v_org and lower(p.name) = lower(x.partner) limit 1),
         x.d::timestamptz, x.state, 'USD', x.untaxed, x.tax, x.total
  from (values
    ('S00002','Francois Eid',               '2024-12-07','cancel', 10000,    1100, 11100),
    ('S00004','Tony Karam',                 '2025-02-26','sale',   10000,       0, 10000),
    ('S00006','European Industrial Traders','2025-03-03','sale',    1250,       0,  1250),
    ('S00007','European Industrial Traders','2025-06-10','draft',  50000,       0, 50000),
    ('S00009','European Industrial Traders','2025-06-20','sale',    1250,       0,  1250),
    ('S00010','European Industrial Traders','2025-07-15','sale',    1250,       0,  1250),
    ('S00011','European Industrial Traders','2025-08-12','sale',    2500,       0,  2500),
    ('S00012','European Industrial Traders','2025-10-04','sale',    1500,       0,  1500),
    ('S00013','European Industrial Traders','2025-11-03','sale',    1250,       0,  1250),
    ('S00014','European Industrial Traders','2025-11-03','sale',    1250,       0,  1250),
    ('S00015','European Industrial Traders','2025-11-03','sale',    1250,       0,  1250),
    ('S00016','European Industrial Traders','2025-11-03','sale',    3000,       0,  3000),
    ('S00018','ALGECO S.A.R.L',             '2026-02-19','draft',  21525, 2367.75, 23892.75),
    ('S00019','Francois Eid',               '2026-02-23','draft',   7500,       0,  7500),
    ('S00020','Francois Eid',               '2026-02-23','draft',   8500,       0,  8500),
    ('S00021','Francois Eid',               '2026-05-13','sent',   10800,       0, 10800)
  ) as x(number, partner, d, state, untaxed, tax, total)
  where not exists (select 1 from public.sale_orders s where s.company_id = v_co and s.number = x.number);

  -- -------------------------------------------------------- purchase orders
  insert into public.purchase_orders(company_id, number, partner_id, date_order, state, currency_code, amount_untaxed, amount_total)
  select v_co, x.number,
         (select p.id from public.partners p where p.org_id = v_org and lower(p.name) = lower(x.partner) limit 1),
         x.d::timestamptz, x.state, 'USD', x.total, x.total
  from (values
    ('P00001','Horizontal Tempering Glass',  '2025-04-14','sent',        0),
    ('P00005','GMNC',                        '2026-05-29','purchase',99.96),
    ('P00006','KHOURY HARDWARE CENTER SARL', '2026-05-29','purchase', 55.5)
  ) as x(number, partner, d, state, total)
  where not exists (select 1 from public.purchase_orders o where o.company_id = v_co and o.number = x.number);

  -- --------------------------------------------------- invoices, bills, note
  -- One line each, named as Odoo named it, so the document reads the same.
  for r in
    select * from (values
      ('INV/2025/00001','out_invoice','Tony Karam',                 '2025-02-28','posted',  2500,      0,  2500, 'Down payment of 25.0%'),
      ('INV/2025/00002','out_invoice','European Industrial Traders','2025-03-03','posted',  1250,      0,  1250, 'Calculation note'),
      ('RINV/2025/00001','out_refund','Tony Karam',                 '2025-03-05','cancel',  2250,  247.5, 2497.5,'Reversal of INV/2025/00001'),
      ('BILL/2025/03/0001','in_invoice','GoDaddy',                  '2025-03-06','posted',273.94,      0, 273.94, '.ai domain and Microsoft 365'),
      ('INV/2025/00003','out_invoice','European Industrial Traders','2025-06-20','draft',   1000,      0,  1000, 'Glass ballustrade'),
      ('INV/2025/00004','out_invoice','European Industrial Traders','2025-06-20','posted',  1250,      0,  1250, 'AMCA louvers'),
      ('INV/2025/00005','out_invoice','European Industrial Traders','2025-07-15','posted',  1250,      0,  1250, 'AMCA louvers (S00010)'),
      ('INV/2025/00006','out_receipt','European Industrial Traders','2025-07-15','draft',   2500,      0,  2500, 'Receipt'),
      ('INV/2025/00007','out_invoice','European Industrial Traders','2025-08-12','posted',  2500,      0,  2500, 'Fixed and sliding louvers'),
      ('INV/2025/00008','out_invoice','Tony Karam',                 '2025-09-30','posted',  2500,      0,  2500, 'Calculation note'),
      ('INV/2025/00009','out_invoice','European Industrial Traders','2025-10-04','posted',  1500,      0,  1500, 'Calculation note'),
      ('INV/2026/00001','out_invoice','Tony Karam',                 '2026-02-03','posted',  2000,      0,  2000, 'S00004')
    ) as v(number, move_type, partner, d, state, untaxed, tax, total, line_name)
  loop
    if exists (select 1 from public.invoices i where i.company_id = v_co and i.number = r.number) then
      continue;
    end if;
    insert into public.invoices(company_id, move_type, journal_id, partner_id, number, invoice_date, currency_code,
                                state, payment_state, amount_untaxed, amount_tax, amount_total, amount_residual)
    values (v_co, r.move_type,
            (select j.id from public.journals j where j.company_id = v_co and j.code = case when r.move_type = 'in_invoice' then 'BILL' else 'INV' end),
            (select p.id from public.partners p where p.org_id = v_org and lower(p.name) = lower(r.partner) limit 1),
            r.number, r.d::date, 'USD', 'draft', 'not_paid', r.untaxed, r.tax, r.total, r.total)
    returning id into v_inv;
    insert into public.invoice_lines(company_id, invoice_id, name, quantity, unit_price, price_subtotal, price_total, account_id)
    values (v_co, v_inv, r.line_name, 1, r.untaxed, r.untaxed, r.total,
            case when r.move_type = 'in_invoice' then a_telecom else a_rev_svc end);
    -- let Orbit build the ledger entry, the same way the app does. The payments
    -- below then bring each balance down, so the residual and the paid state are
    -- worked out by Orbit rather than copied from Odoo: all twelve end up where
    -- Odoo had them.
    if r.state = 'posted' then
      begin
        perform public.post_invoice(v_inv);
        n_posted := n_posted + 1;
      exception when others then
        v_msg := sqlerrm;
        raise notice 'could not post %: %', r.number, v_msg;
        n_failed := n_failed + 1;
      end;
    elsif r.state = 'cancel' then
      update public.invoices set state = 'cancel' where id = v_inv;
    end if;
  end loop;

  -- ---------------------------------------------------------------- payments
  -- Odoo's PCSH journal was cash, PWSH was the Wish Money wallet. Only the
  -- payments that actually moved money are here (the zero and draft ones are not).
  --
  -- ONE JUDGEMENT CALL, worth checking: Odoo had PWSH1/2025/00003 (1,000 on
  -- 25 Jul 2025, memo "AMCA Louvers") against INV/2025/00004, which is a 1,250
  -- invoice that already had 1,000 on it. Taking Odoo at its word would overpay
  -- it by 750 and leave INV/2025/00005, the 1,250 AMCA louvers invoice from
  -- S00010, with nothing against it, though Odoo calls it part paid. It is put
  -- on INV/2025/00005 here, which makes every one of the twelve documents agree
  -- with the paid state Odoo showed. Say the word and it moves back.
  for r in
    select * from (values
      ('INV/2025/00001',    2000,  '2025-02-28','CSH','PCSH1/2025/00002'),
      ('INV/2025/00002',     800,  '2025-03-06','BNK','PWSH1/2025/00001'),
      ('BILL/2025/03/0001',273.94, '2025-03-06','CSH','PCSH1/2025/00003'),
      ('INV/2025/00002',     400,  '2025-04-18','BNK','PWSH1/2025/00002'),
      ('INV/2025/00004',    1000,  '2025-06-20','CSH','PCSH1/2025/00005'),
      ('INV/2025/00005',    1000,  '2025-07-25','BNK','PWSH1/2025/00003'),
      ('INV/2025/00008',    2000,  '2025-09-30','CSH','PCSH1/2025/00006'),
      ('INV/2025/00007',    2500,  '2025-10-04','CSH','PCSH1/2025/00007'),
      ('INV/2025/00009',    1000,  '2026-03-24','BNK','PWSH1/2026/00001')
    ) as v(inv_number, amount, d, journal, ref)
  loop
    select id into v_inv from public.invoices where company_id = v_co and number = r.inv_number limit 1;
    if v_inv is null then raise notice 'payment % has no invoice %', r.ref, r.inv_number; continue; end if;
    if exists (select 1 from public.payments pm where pm.company_id = v_co and pm.reference = r.ref) then continue; end if;
    begin
      perform public.register_payment(v_inv, r.amount, r.d::date, r.journal,
                                      case when r.journal = 'CSH' then 'cash' else 'bank' end, r.ref);
      n_paid := n_paid + 1;
    exception when others then
      v_msg := sqlerrm;
      raise notice 'could not register payment % : %', r.ref, v_msg;
      n_failed := n_failed + 1;
    end;
  end loop;

  -- ------------------------------------------------------- the two vouchers
  -- JV000001: 50 into the BEMO bank account against the owner's current account.
  -- JV000002: 26.06 taken out of cash to the owner's current account.
  -- (OPENING BEMO was the cancelled first attempt at JV000001 and is left out.)
  -- Each one is written as a draft, given its lines, and only then marked posted:
  -- a posted entry refuses new lines (trg_guard_line), and post_entry() wants an
  -- app user, which a migration does not have. Both are balanced by hand below.
  if not exists (select 1 from public.journal_entries e where e.company_id = v_co and e.ref = 'Odoo JV000001') then
    insert into public.journal_entries(company_id, journal_id, date, ref, narration, currency_code, state, source_type)
    values (v_co, (select id from public.journals where company_id = v_co and code = 'MISC'), '2025-03-06', 'Odoo JV000001',
            'Brought over from Odoo', 'USD', 'draft', 'import')
    returning id into v_entry;
    insert into public.journal_lines(entry_id, company_id, account_id, partner_id, label, debit, credit)
    values (v_entry, v_co, coalesce(a_bank, a_cash), null, 'Bank BEMO opening (Odoo JV000001)', 50, 0),
           (v_entry, v_co, a_partner,
            (select p.id from public.partners p where p.org_id = v_org and lower(p.name) = 'kevin gemayel' limit 1),
            'Partner current account - Kevin Gemayel', 0, 50);
    update public.journal_entries set entry_number = public.je_next_number(v_co, journal_id, 'import', date), state = 'posted', posted_at = now() where id = v_entry;
  end if;
  if not exists (select 1 from public.journal_entries e where e.company_id = v_co and e.ref = 'Odoo JV000002') then
    insert into public.journal_entries(company_id, journal_id, date, ref, narration, currency_code, state, source_type)
    values (v_co, (select id from public.journals where company_id = v_co and code = 'MISC'), '2025-03-06', 'Odoo JV000002',
            'Brought over from Odoo', 'USD', 'draft', 'import')
    returning id into v_entry;
    insert into public.journal_lines(entry_id, company_id, account_id, partner_id, label, debit, credit)
    values (v_entry, v_co, a_partner,
            (select p.id from public.partners p where p.org_id = v_org and lower(p.name) = 'kevin gemayel' limit 1),
            'Partner current account - Kevin Gemayel', 26.06, 0),
           (v_entry, v_co, a_cash, null, 'Cash (Odoo JV000002)', 0, 26.06);
    update public.journal_entries set entry_number = public.je_next_number(v_co, journal_id, 'import', date), state = 'posted', posted_at = now() where id = v_entry;
  end if;

  raise notice 'Odoo import into % : % invoice(s) posted, % payment(s) registered, % problem(s)', v_co, n_posted, n_paid, n_failed;
end $odoo$;

select 'odoo import' as step,
       (select count(*) from public.partners p join public.companies c on c.org_id = p.org_id where c.name ilike 'space work%') as partners,
       (select count(*) from public.products pr join public.companies c on c.id = pr.company_id where c.name ilike 'space work%') as products,
       (select count(*) from public.sale_orders s join public.companies c on c.id = s.company_id where c.name ilike 'space work%') as sale_orders,
       (select count(*) from public.invoices i join public.companies c on c.id = i.company_id where c.name ilike 'space work%') as invoices;
