-- 240: a pass the till honours, and a standing order that raises itself.
--
-- Two more tables nothing could reach. Subscription plans had a screen - an
-- unlimited-coffee pass, a bean box, a corporate plan, with a daily limit and a
-- period limit on it - and the help page admitted the rest: "the tills do not
-- enforce it". So a shop could sell a 40-a-month unlimited pass, take the
-- money, and then have nothing to ring the coffee up against: the cashier
-- discounted it by hand, or charged for it, and the limit was a number in a
-- table. 6 subscriptions and 4 standing orders sat underneath, written by
-- something that no longer exists.
--
-- A subscription has three jobs and did none of them:
--
--   subscription_for(company, partner, product)
--       what the person in front of the cashier is entitled to right now: the
--       pass, what it includes, how many are left today and this period. One
--       call, so the till does not have to understand the rules.
--   subscription_redeem(subscription, order, store)
--       takes one off, writes the redemption, and refuses past the limit with
--       a sentence a cashier can read out. The limit is enforced here, in the
--       database, so no screen can forget it.
--   subscription_bill(company, on_date)
--       raises and posts the next period's invoice for every pass that is due,
--       advances the billing date and resets the period count. Nightly.
--
-- And a standing order is a wholesale customer's weekly 20 kilos: due dates
-- that nothing read, so somebody kept a spreadsheet beside Orbit.
--
--   standing_orders_raise(company, on_date)
--       one sales order per wholesale account that is due, with a line per
--       standing order on it, and the next date moved on by its frequency.
--
-- Deliberately not done: taking the subscription payment by card on a schedule.
-- That is a gateway, not a function, and it is already on the roadmap as online
-- payments.

alter table public.subscriptions
  add column if not exists redemptions_today int default 0,
  add column if not exists last_redeemed_on date,
  add column if not exists last_invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists cancel_reason text,
  add column if not exists created_at timestamptz default now();
create unique index if not exists subscriptions_one_live_per_plan
  on public.subscriptions (company_id, partner_id, plan_id)
  where status = 'active';
create index if not exists subscription_redemptions_sub_idx on public.subscription_redemptions (subscription_id, redeemed_at desc);

alter table public.standing_orders
  add column if not exists last_raised_on date,
  add column if not exists note text,
  add column if not exists created_at timestamptz default now();
create index if not exists standing_orders_due_idx on public.standing_orders (company_id, next_date) where is_active;

-- @chunk
-- ------------------------------- a document number, worked out in the database
-- Every document Orbit numbers is numbered in the browser: read the sequence
-- settings, find the highest number already used under this year's prefix, add
-- one. Nothing nightly can do that, so a scheduled job had nowhere to get a
-- number from. This is the same rule, in SQL, reading the same
-- number_sequences row the Document Numbering screen writes: the prefix, the
-- padding, and whether the year is in it. A number longer than the padding
-- keeps all its digits, which is the bug that once turned 10000 into 0000 and
-- handed out a number already in use.
create or replace function public.next_doc_number(p_company uuid, p_doc text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_code text; v_prefix text; v_pad int; v_year boolean; v_py text; v_max int := 0;
begin
  -- the sequence row is keyed by the document's code, not its move type
  v_code := case lower(coalesce(p_doc, ''))
              when 'out_invoice' then 'INV' when 'out_refund' then 'RINV'
              when 'in_invoice' then 'BILL' when 'in_refund' then 'RBILL'
              when 'sale_order' then 'SO' when 'purchase_order' then 'PO'
              else upper(coalesce(nullif(p_doc, ''), 'INV')) end;
  select coalesce(nullif(btrim(ns.prefix), ''), v_code), coalesce(ns.padding, 4), coalesce(ns.use_year, true)
    into v_prefix, v_pad, v_year
    from public.number_sequences ns
   where ns.company_id = p_company and ns.doc_type = v_code
   limit 1;
  v_prefix := coalesce(v_prefix, v_code);
  v_pad := coalesce(v_pad, 4);
  v_year := coalesce(v_year, true);
  v_py := v_prefix || case when v_year then '/' || to_char(current_date, 'YYYY') else '' end || '/';

  if v_code in ('INV', 'RINV', 'BILL', 'RBILL') then
    select coalesce(max((regexp_replace(i.number, '^.*?(\d+)\s*$', '\1'))::bigint), 0) into v_max
      from public.invoices i
     where i.company_id = p_company and i.number like v_py || '%'
       and i.number ~ '\d\s*$';
  elsif v_code = 'SO' then
    select coalesce(max((regexp_replace(o.number, '^.*?(\d+)\s*$', '\1'))::bigint), 0) into v_max
      from public.sale_orders o
     where o.company_id = p_company and o.number like v_py || '%'
       and o.number ~ '\d\s*$';
  elsif v_code = 'PO' then
    select coalesce(max((regexp_replace(o.number, '^.*?(\d+)\s*$', '\1'))::bigint), 0) into v_max
      from public.purchase_orders o
     where o.company_id = p_company and o.number like v_py || '%'
       and o.number ~ '\d\s*$';
  else
    raise exception 'next_doc_number does not know where % documents are kept.', v_code;
  end if;

  return v_py || lpad((v_max + 1)::text, greatest(v_pad, length((v_max + 1)::text)), '0');
end $fn$;
grant execute on function public.next_doc_number(uuid, text) to authenticated;

-- @chunk
-- ------------------------------------- what is this person entitled to, now
create or replace function public.subscription_for(p_company uuid, p_partner uuid, p_product uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare s record; v_today int; v_period int;
begin
  if p_company is null or p_partner is null then return jsonb_build_object('ok', false); end if;
  select sub.*, p.name as plan_name, p.included_product_id, p.daily_limit, p.period_limit, p.kind, p.price, p.period
    into s
    from public.subscriptions sub
    join public.subscription_plans p on p.id = sub.plan_id
   where sub.company_id = p_company and sub.partner_id = p_partner
     and coalesce(sub.status, 'active') = 'active'
     and (p_product is null or p.included_product_id is null or p.included_product_id = p_product)
   order by (case when p.included_product_id = p_product then 0 else 1 end), sub.started_on desc
   limit 1;
  if s.id is null then return jsonb_build_object('ok', false); end if;

  -- today's count is only today's: a pass that was last used yesterday starts again
  v_today := case when s.last_redeemed_on = current_date then coalesce(s.redemptions_today, 0) else 0 end;
  v_period := coalesce(s.redemptions_this_period, 0);
  return jsonb_build_object(
    'ok', true, 'subscription', s.id, 'plan', s.plan_name, 'kind', s.kind,
    'product', s.included_product_id, 'price', s.price, 'period', s.period,
    'daily_limit', s.daily_limit, 'period_limit', s.period_limit,
    'used_today', v_today, 'used_this_period', v_period,
    'left_today', case when s.daily_limit is null then null else greatest(s.daily_limit - v_today, 0) end,
    'left_this_period', case when s.period_limit is null then null else greatest(s.period_limit - v_period, 0) end,
    'can_redeem', (s.daily_limit is null or v_today < s.daily_limit)
                  and (s.period_limit is null or v_period < s.period_limit),
    'next_billing_on', s.next_billing_on);
end $fn$;
grant execute on function public.subscription_for(uuid, uuid, uuid) to authenticated;

create or replace function public.subscription_redeem(p_subscription uuid, p_order uuid default null, p_store uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare s record; v_today int;
begin
  select sub.*, p.daily_limit, p.period_limit, p.name as plan_name
    into s
    from public.subscriptions sub join public.subscription_plans p on p.id = sub.plan_id
   where sub.id = p_subscription;
  if s.id is null then raise exception 'That pass no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(s.company_id, '{pos,kitchen,sales,counter}'::text[]) then
    raise exception 'Your role cannot use a pass. It needs Work in the till, Kitchen or Sales.';
  end if;
  if coalesce(s.status, 'active') <> 'active' then
    raise exception 'That pass is %. It cannot be used.', coalesce(s.status, 'not active');
  end if;
  v_today := case when s.last_redeemed_on = current_date then coalesce(s.redemptions_today, 0) else 0 end;
  if s.daily_limit is not null and v_today >= s.daily_limit then
    raise exception 'That pass covers % a day and % has already been taken today.', s.daily_limit, v_today;
  end if;
  if s.period_limit is not null and coalesce(s.redemptions_this_period, 0) >= s.period_limit then
    raise exception 'That pass covers % this period and % have been taken. It starts again on %.',
      s.period_limit, coalesce(s.redemptions_this_period, 0), coalesce(s.next_billing_on::text, 'the next billing date');
  end if;

  insert into public.subscription_redemptions (company_id, subscription_id, store_id, order_id, redeemed_at)
  values (s.company_id, p_subscription, p_store, p_order, now());
  update public.subscriptions
     set redemptions_today = v_today + 1,
         last_redeemed_on = current_date,
         redemptions_this_period = coalesce(redemptions_this_period, 0) + 1
   where id = p_subscription;
  return jsonb_build_object('ok', true, 'plan', s.plan_name,
    'used_today', v_today + 1,
    'left_today', case when s.daily_limit is null then null else s.daily_limit - v_today - 1 end,
    'left_this_period', case when s.period_limit is null then null else s.period_limit - coalesce(s.redemptions_this_period, 0) - 1 end);
end $fn$;
grant execute on function public.subscription_redeem(uuid, uuid, uuid) to authenticated;

-- @chunk
-- ------------------------------------------------- the next period's invoice
create or replace function public.subscription_bill(p_company uuid default null, p_on date default current_date)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare s record; v_inv uuid; v_n int := 0; v_tot numeric := 0; v_num text; v_months int; v_ccy text;
begin
  for s in
    select sub.*, p.name as plan_name, p.price, p.period, c.currency_code
      from public.subscriptions sub
      join public.subscription_plans p on p.id = sub.plan_id
      join public.companies c on c.id = sub.company_id
     where coalesce(sub.status, 'active') = 'active'
       and sub.next_billing_on is not null and sub.next_billing_on <= p_on
       and coalesce(p.price, 0) > 0
       and (p_company is null or sub.company_id = p_company)
     order by sub.company_id, sub.next_billing_on
  loop
    if auth.uid() is not null and not public.can_write_app(s.company_id, '{accounting,sales,kitchen,pos}'::text[]) then
      continue;   -- a nightly run has no uid; a person without the right simply bills nothing
    end if;
    v_ccy := s.currency_code;
    v_months := case lower(coalesce(s.period, 'monthly'))
                  when 'weekly' then 0 when 'quarterly' then 3 when 'yearly' then 12 else 1 end;
    v_num := public.next_doc_number(s.company_id, 'out_invoice');

    insert into public.invoices (company_id, move_type, partner_id, number, invoice_date, due_date, state,
                                 currency_code, ref, amount_untaxed, amount_tax, amount_total, amount_residual)
    values (s.company_id, 'out_invoice', s.partner_id, v_num, s.next_billing_on,
            s.next_billing_on + 14, 'draft', v_ccy,
            s.plan_name || ' ' || to_char(s.next_billing_on, 'Mon YYYY'),
            s.price, 0, s.price, s.price)
    returning id into v_inv;
    insert into public.invoice_lines (company_id, invoice_id, sequence, line_type, name, quantity, unit_price, discount, price_subtotal)
    values (s.company_id, v_inv, 10, 'item',
            s.plan_name || ', ' || to_char(s.next_billing_on, 'FMDD Mon YYYY') ||
            case when v_months = 0 then ' for the week' when v_months = 1 then ' for the month'
                 else ' for ' || v_months || ' months' end,
            1, s.price, 0, s.price);
    perform public.post_invoice(v_inv);

    update public.subscriptions
       set next_billing_on = case when v_months = 0 then s.next_billing_on + 7
                                  else (s.next_billing_on + (v_months || ' months')::interval)::date end,
           redemptions_this_period = 0,
           last_invoice_id = v_inv
     where id = s.id;
    v_n := v_n + 1; v_tot := v_tot + coalesce(s.price, 0);
  end loop;
  return jsonb_build_object('ok', true, 'billed', v_n, 'total', round(v_tot, 2));
end $fn$;
grant execute on function public.subscription_bill(uuid, date) to authenticated;

create or replace function public.subscription_cancel(p_subscription uuid, p_reason text default null, p_on date default current_date)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare s public.subscriptions;
begin
  select * into s from public.subscriptions where id = p_subscription;
  if s.id is null then raise exception 'That pass no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(s.company_id, '{sales,kitchen,pos,counter,accounting}'::text[]) then
    raise exception 'Your role cannot cancel a pass.';
  end if;
  if coalesce(s.status, 'active') = 'cancelled' then raise exception 'That pass is already cancelled.'; end if;
  update public.subscriptions
     set status = 'cancelled', cancelled_on = coalesce(p_on, current_date),
         cancel_reason = nullif(btrim(coalesce(p_reason, '')), ''), next_billing_on = null
   where id = p_subscription;
  -- what they have already paid for stands: the pass stops billing, it does not
  -- claw back a period somebody has used half of
  return jsonb_build_object('ok', true, 'cancelled_on', coalesce(p_on, current_date));
end $fn$;
grant execute on function public.subscription_cancel(uuid, text, date) to authenticated;

-- @chunk
-- --------------------------------------------- the wholesale customer's week
create or replace function public.standing_orders_raise(p_company uuid default null, p_on date default current_date)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare a record; l record; v_oid uuid; v_num text; v_seq int; v_sub numeric; v_n int := 0; v_lines int := 0; v_days int; v_next date;
begin
  for a in
    select w.id as acct, w.company_id, w.partner_id, c.currency_code
      from public.wholesale_accounts w
      join public.companies c on c.id = w.company_id
     where coalesce(w.is_active, true)
       and (p_company is null or w.company_id = p_company)
       and exists (select 1 from public.standing_orders s
                    where s.wholesale_account_id = w.id and coalesce(s.is_active, true)
                      and s.next_date is not null and s.next_date <= p_on)
     order by w.company_id
  loop
    if auth.uid() is not null and not public.can_write_app(a.company_id, '{sales,kitchen,inventory}'::text[]) then continue; end if;
    v_oid := null; v_seq := 0; v_sub := 0;
    for l in
      select s.*, p.name as product_name, coalesce(p.list_price, 0) as price
        from public.standing_orders s
        left join public.products p on p.id = s.product_id
       where s.wholesale_account_id = a.acct and coalesce(s.is_active, true)
         and s.next_date is not null and s.next_date <= p_on
       order by p.name
    loop
      if v_oid is null then
        v_num := public.next_doc_number(a.company_id, 'sale_order');
        insert into public.sale_orders (company_id, number, partner_id, date_order, state, currency_code, note)
        values (a.company_id, v_num, a.partner_id, p_on, 'draft', a.currency_code,
                'Raised from the standing order for this account')
        returning id into v_oid;
      end if;
      v_seq := v_seq + 10;
      insert into public.sale_order_lines (company_id, order_id, product_id, name, sequence, quantity, unit_price, discount, price_subtotal, uom, line_type)
      values (a.company_id, v_oid, l.product_id, coalesce(l.product_name, 'Standing order item'), v_seq,
              coalesce(l.qty, 0), l.price, 0, round(coalesce(l.qty, 0) * l.price, 2), l.uom, 'item');
      v_sub := v_sub + round(coalesce(l.qty, 0) * l.price, 2);
      v_lines := v_lines + 1;

      -- The next date catches all the way up, not one step. A standing order
      -- nobody has looked at since January must not raise thirty orders over
      -- the next thirty nights for deliveries that never happened: it raises
      -- one, today, and its schedule lands on the next date in the future.
      v_days := case lower(coalesce(l.frequency, 'weekly'))
                  when 'daily' then 1 when 'weekly' then 7 when 'fortnightly' then 14
                  when 'monthly' then 30 else 7 end;
      v_next := l.next_date + (ceil(((p_on - l.next_date) + 1)::numeric / v_days) * v_days)::int;
      update public.standing_orders
         set next_date = v_next, last_raised_on = p_on
       where id = l.id;
    end loop;
    if v_oid is not null then
      update public.sale_orders set amount_untaxed = v_sub, amount_tax = 0, amount_total = v_sub where id = v_oid;
      v_n := v_n + 1;
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'orders', v_n, 'lines', v_lines);
end $fn$;
grant execute on function public.standing_orders_raise(uuid, date) to authenticated;

-- @chunk
-- nightly, both of them. A pass that is due is billed and a standing order that
-- is due is raised, which is the whole point of writing a date on them.
select cron.unschedule('subs-billing') where exists (select 1 from cron.job where jobname = 'subs-billing');
select cron.schedule('subs-billing', '25 6 * * *', $cron$select public.subscription_bill(null, current_date);$cron$);
select cron.unschedule('standing-orders') where exists (select 1 from cron.job where jobname = 'standing-orders');
select cron.schedule('standing-orders', '30 6 * * *', $cron$select public.standing_orders_raise(null, current_date);$cron$);

select 'passes and standing orders act' as done,
       (select count(*) from public.subscriptions) as subs,
       (select count(*) from public.standing_orders) as standing,
       (select count(*) from public.subscription_redemptions) as redemptions;
