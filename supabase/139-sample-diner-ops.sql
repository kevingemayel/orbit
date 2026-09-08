-- ============================================================================
-- 139-sample-diner-ops.sql  -  the operational month for the sample diner.
--
-- SAMPLE DATA, invented for demonstration.
--
-- Sales alone make a pretty demo and prove nothing. These are the records that
-- make the reports say something true: waste with reasons, a blind count that
-- does not tie, HACCP rounds with a real breach, an aggregator payout that is
-- short, staff, loyalty members and guest feedback.
-- Re-runnable.
-- ============================================================================

delete from public.waste_entries where company_id='aa510000-0000-4000-8000-0000000000c0';
delete from public.checklist_results where run_id in (select id from public.checklist_runs where company_id='aa510000-0000-4000-8000-0000000000c0');
delete from public.checklist_runs where company_id='aa510000-0000-4000-8000-0000000000c0';
delete from public.aggregator_disputes where company_id='aa510000-0000-4000-8000-0000000000c0';
delete from public.aggregator_payouts where company_id='aa510000-0000-4000-8000-0000000000c0';
delete from public.feedback where company_id='aa510000-0000-4000-8000-0000000000c0';

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
insert into public.hr_employees (company_id, name, store_id)
select 'aa510000-0000-4000-8000-0000000000c0', v.n,
       (select id from public.stores where company_id='aa510000-0000-4000-8000-0000000000c0' and code = v.br)
from (values
  ('Rita Haddad','JNH'),('Karim Nassar','JNH'),('Joelle Feghali','JNH'),('Elie Khoury','JNH'),
  ('Maya Saad','JNH'),('Tony Aoun','JNH'),('Hadi Chami','JBL'),('Nour Mansour','JBL'),
  ('Ziad Abou Jaoude','JBL'),('Lara Gemayel','JBL'),('Fadi Rizk','JBL')
) as v(n, br)
where not exists (select 1 from public.hr_employees e where e.company_id='aa510000-0000-4000-8000-0000000000c0' and e.name = v.n);

-- ---------------------------------------------------------------------------
-- Waste. Roughly 2 to 3 percent of food cost, which is where a well run
-- kitchen sits, split across reasons that behave differently.
-- ---------------------------------------------------------------------------
insert into public.waste_entries (company_id, store_id, product_id, reason_id, qty, uom, unit_cost, total_cost, waste_date, shift, recorded_by, note)
select 'aa510000-0000-4000-8000-0000000000c0', st.id, p.id, wr.id,
       round(q.qty, 3), p.uom, p.cost_price, round(q.qty * p.cost_price, 2),
       d.d, (case when public.seed_rand(d.d::text || st.code || slot::text || 'sh') < 0.5 then 'day' else 'evening' end),
       'Shift lead', null
from (select generate_series(date '2026-08-01', date '2026-08-31', interval '1 day')::date d) d
cross join (select id, code from public.stores where company_id='aa510000-0000-4000-8000-0000000000c0') st
cross join generate_series(1,3) slot
cross join lateral (
  select pr.id, pr.name, pr.uom, pr.cost_price
    from public.products pr
   where pr.company_id='aa510000-0000-4000-8000-0000000000c0' and pr.item_type='raw'
     and pr.name in ('Lettuce','Tomato','Beef patty 150g','Chicken breast','Burger bun','Fresh milk','Potato','Mushroom','Halloumi','Orange')
   order by public.seed_rand(d.d::text || st.code || slot::text || pr.name) desc
   limit 1
) p
cross join lateral (
  select wr2.id from public.waste_reasons wr2
   where wr2.company_id='aa510000-0000-4000-8000-0000000000c0'
   order by public.seed_rand(d.d::text || st.code || slot::text || 'r' || wr2.code) desc limit 1
) wr
cross join lateral (
  select (2.2 + public.seed_rand(d.d::text || st.code || slot::text || 'q') * 9.6) as qty
) q
where public.seed_rand(d.d::text || st.code || slot::text || 'has') < 0.72;

-- ---------------------------------------------------------------------------
-- HACCP. Fridge and freezer temperatures, twice a day, with a genuine breach
-- so the corrective-action path is not just theory.
-- ---------------------------------------------------------------------------
insert into public.checklist_templates (id, company_id, name, kind, frequency)
values ('aa510000-0000-4000-8000-00000000dd01','aa510000-0000-4000-8000-0000000000c0','Fridge and freezer temperatures','haccp','per_shift')
on conflict (id) do nothing;

insert into public.checklist_template_items (id, company_id, template_id, text, section, input_type, min_value, max_value, is_critical, sort)
values
  ('aa510000-0000-4000-8000-00000000de01','aa510000-0000-4000-8000-0000000000c0','aa510000-0000-4000-8000-00000000dd01','Walk-in fridge','Cold','temperature',0,5,true,10),
  ('aa510000-0000-4000-8000-00000000de02','aa510000-0000-4000-8000-0000000000c0','aa510000-0000-4000-8000-00000000dd01','Prep fridge','Cold','temperature',0,5,true,20),
  ('aa510000-0000-4000-8000-00000000de03','aa510000-0000-4000-8000-0000000000c0','aa510000-0000-4000-8000-00000000dd01','Freezer','Frozen','temperature',-25,-15,true,30)
on conflict (id) do nothing;

insert into public.checklist_runs (id, company_id, store_id, template_id, run_date, shift, status, completed_by, completed_at)
select gen_random_uuid(), 'aa510000-0000-4000-8000-0000000000c0', st.id,
       'aa510000-0000-4000-8000-00000000dd01', d.d, sh.s, 'complete', 'Shift lead',
       d.d + (case sh.s when 'open' then interval '8 hours' else interval '17 hours' end)
from (select generate_series(date '2026-08-01', date '2026-08-31', interval '1 day')::date d) d
cross join (select id, code from public.stores where company_id='aa510000-0000-4000-8000-0000000000c0') st
cross join (values ('open'),('close')) as sh(s);

insert into public.checklist_results (company_id, run_id, item_id, value_num, is_breach, corrective_action, action_by, recorded_by, recorded_at)
select 'aa510000-0000-4000-8000-0000000000c0', r.id, i.id,
       round(rd.v, 1),
       rd.v < i.min_value or rd.v > i.max_value,
       case when rd.v < i.min_value or rd.v > i.max_value
            then 'Door found ajar. Stock checked and moved to the walk-in, engineer called, temperature back in range within the hour.'
            else null end,
       case when rd.v < i.min_value or rd.v > i.max_value then 'Shift lead' else null end,
       'Shift lead', r.completed_at
from public.checklist_runs r
join public.checklist_template_items i on i.template_id = r.template_id
cross join lateral (
  select case
    -- one real excursion on the prep fridge, at Jbeil, mid month
    when i.text = 'Prep fridge' and r.run_date between date '2026-08-14' and date '2026-08-15'
         and r.store_id = (select id from public.stores where company_id='aa510000-0000-4000-8000-0000000000c0' and code='JBL')
      then 8.4
    when i.text = 'Freezer' then -21 + public.seed_rand(r.id::text || i.id::text) * 4
    else 1.5 + public.seed_rand(r.id::text || i.id::text) * 3.0
  end as v
) rd
where r.company_id='aa510000-0000-4000-8000-0000000000c0';

-- ---------------------------------------------------------------------------
-- The aggregator month, and a payout that does not match.
-- ---------------------------------------------------------------------------
insert into public.aggregator_accounts (id, company_id, store_id, channel_id, platform, external_store_id, commission_percent)
select ('aa510000-0000-4000-8000-00000000ac0' || st.rn)::uuid, 'aa510000-0000-4000-8000-0000000000c0', st.id,
       (select id from public.sales_channels where company_id='aa510000-0000-4000-8000-0000000000c0' and code='aggregator'),
       'toters', 'TOT-' || st.code, 25
from (select id, code, row_number() over (order by code) rn from public.stores where company_id='aa510000-0000-4000-8000-0000000000c0') st
on conflict (id) do nothing;

-- What we expected to keep: aggregator sales less their 25 percent.
insert into public.aggregator_payouts (company_id, account_id, reference, period_start, period_end,
                                       statement_gross, statement_commission, statement_other, statement_net,
                                       expected_net, status, received_on, note)
select 'aa510000-0000-4000-8000-0000000000c0', a.id,
       'TOT-AUG26-' || s.code, date '2026-08-01', date '2026-08-31',
       round(g.gross, 2),
       round(g.gross * 0.25, 2),
       -- the platform also deducted promo funding nobody agreed to
       case when s.code = 'JNH' then round(g.gross * 0.031, 2) else 0 end,
       round(g.gross * 0.75, 2) - case when s.code = 'JNH' then round(g.gross * 0.031, 2) else 0 end,
       round(g.gross * 0.75, 2),
       case when s.code = 'JNH' then 'disputed' else 'matched' end,
       date '2026-09-05',
       case when s.code = 'JNH' then 'Short by an undeclared promotion deduction. Raised with the platform.' else 'Agrees to the order log.' end
from public.stores s
join public.aggregator_accounts a on a.store_id = s.id
cross join lateral (
  select coalesce(sum(o.subtotal), 0) as gross
    from public.pos_orders o
    join public.sales_channels c on c.id = o.channel_id
   where o.company_id='aa510000-0000-4000-8000-0000000000c0' and o.store_id = s.id and c.code='aggregator'
) g
where s.company_id='aa510000-0000-4000-8000-0000000000c0';

insert into public.aggregator_disputes (company_id, payout_id, amount, reason, status, raised_on)
select 'aa510000-0000-4000-8000-0000000000c0', p.id, abs(p.variance),
       'Promotion funding deducted that was never agreed in writing.', 'submitted', date '2026-09-06'
  from public.aggregator_payouts p
 where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.status='disputed';

-- ---------------------------------------------------------------------------
-- Guests: a loyalty programme with members, and honest feedback including some
-- that is not flattering, because a demo where everyone is delighted is useless.
-- ---------------------------------------------------------------------------
insert into public.loyalty_programs (id, company_id, name, kind, stamps_required, reward_product_id, is_active, starts_on)
values ('aa510000-0000-4000-8000-00000000fa01','aa510000-0000-4000-8000-0000000000c0','Burger card','stamp',9,
        (select id from public.products where company_id='aa510000-0000-4000-8000-0000000000c0' and name='Classic Burger'),
        true, date '2026-01-01')
on conflict (id) do nothing;

insert into public.feedback (company_id, store_id, source, nps, comment, status, category, created_at)
select 'aa510000-0000-4000-8000-0000000000c0', st.id, v.src, v.nps, v.c, v.stt, v.cat,
       (date '2026-08-01' + (public.seed_rand(v.c) * 30 || ' days')::interval)
from (select id, code from public.stores where company_id='aa510000-0000-4000-8000-0000000000c0') st
cross join (values
  ('receipt',10,'Fastest service we have had here. Burger was perfect.','closed','service'),
  ('receipt', 9,'Always consistent, the kids love it.','closed','food'),
  ('google',  8,'Good food, but the terrace needed clearing when we arrived.','resolved','cleanliness'),
  ('receipt', 6,'Waited 25 minutes for two burgers at a quiet time.','resolved','speed'),
  ('aggregator',4,'Delivery arrived cold and the fries were soggy.','resolved','delivery'),
  ('google',  3,'Order was wrong twice and nobody apologised.','resolved','service'),
  ('receipt', 9,'Staff were genuinely friendly, will come back.','closed','service'),
  ('app',     7,'Fine, but the app kept losing my order.','new','digital')
) as v(src, nps, c, stt, cat);
