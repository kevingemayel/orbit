-- 228: a day at the till reaches the accounts and the stock.
--
-- The biggest hole in the product. A shop or a restaurant could take money all
-- day on the Point of Sale and the Kitchen floor, count the drawer, close the
-- session - and NOTHING of it existed in the accounts. No revenue, no VAT, no
-- cash, no cost of what was sold, no stock movement. The sales reports read
-- from the till's own tables, so the screens looked right while the profit and
-- loss showed an empty business.
--
-- Closing a session now writes one journal entry for the whole session, which
-- is how a till is accounted for anywhere: the detail stays in the orders, the
-- ledger gets the day.
--
--   Dr  the cash account        what came in through the drawer
--   Dr  the bank account        card and every other electronic method
--   Dr  a stored value account  where a payment was taken off a gift card
--   Cr  revenue                 the net of the lines, plus service charge
--   Cr  VAT collected           the tax on them
--   Cr  tips payable            tips, which are not the company's money
--   Dr/Cr cash over and short   the drawer counted against what it should hold
--
-- and, for anything sold that is held in stock:
--
--   a stock move out of the store's warehouse, at the product's cost
--   Dr  cost of goods sold / Cr stock
--
-- Deliberate choices. One entry per session, not per order: a busy night is
-- four hundred orders and nobody reads four hundred entries. Only PAID orders:
-- an order still open at close is not a sale yet. Nothing historic is posted -
-- the function runs when a session is closed from now on, or when somebody
-- presses Post to accounts on one that was closed before.
alter table public.pos_sessions
  add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete set null;

create or replace function public.post_pos_session(p_session uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  ses public.pos_sessions;
  cid uuid; jrn uuid; eid uuid; co_ccy text;
  net numeric := 0; tax numeric := 0; tips numeric := 0; svc numeric := 0; taken numeric := 0;
  cash_acc uuid; bank_acc uuid; rev_acc uuid; vat_acc uuid; tip_acc uuid; short_acc uuid;
  cogs_acc uuid; stock_acc uuid;
  cogs_total numeric := 0; diff numeric := 0;
  src_loc uuid; dst_loc uuid;
  pay record; l record;
begin
  select * into ses from public.pos_sessions where id = p_session;
  if ses.id is null then raise exception 'That till session no longer exists.'; end if;
  cid := ses.company_id;

  if auth.uid() is not null and not public.can_write_app(cid, '{pos,kitchen,accounting}'::text[]) then
    raise exception 'Your role cannot post a till session. It needs Work in Point of Sale, Kitchen or Accounting.';
  end if;
  if coalesce(ses.status, '') <> 'closed' then
    raise exception 'Close the session first: a till that is still open has not finished taking money.';
  end if;
  if ses.journal_entry_id is not null then return ses.journal_entry_id; end if;
  if exists (select 1 from public.journal_entries e
              where e.source_type = 'pos_session' and e.source_id = p_session::text) then
    raise exception 'This session is already in the accounts.';
  end if;

  -- what the session sold, from the orders that were actually paid
  select coalesce(sum(o.subtotal), 0), coalesce(sum(o.tax), 0), coalesce(sum(o.service_charge), 0)
    into net, tax, svc
    from public.pos_orders o
   where o.session_id = p_session and o.status = 'paid';

  -- and what it took, from the payments against those orders
  select coalesce(sum(p.amount), 0), coalesce(sum(p.tip_amount), 0)
    into taken, tips
    from public.pos_payments p
    join public.pos_orders o on o.id = p.order_id
   where o.session_id = p_session and o.status = 'paid';

  if net + tax + taken = 0 then
    raise exception 'This session took no money, so there is nothing to post.';
  end if;

  select id into jrn from public.journals where company_id = cid and type = 'sale' order by code limit 1;
  if jrn is null then raise exception 'This company has no sales journal. Add one in Accounting, Journals.'; end if;
  select currency_code into co_ccy from public.companies where id = cid;

  rev_acc   := public.company_account(cid, 'income');
  vat_acc   := public.company_account(cid, 'sale_tax');
  tip_acc   := public.company_account(cid, 'payable');
  short_acc := public.company_account(cid, 'expense');
  select cogs_account_id, stock_account_id into cogs_acc, stock_acc from public.companies where id = cid;
  if rev_acc is null then raise exception 'No income account is set for this company. Choose one in Settings, Companies, Accounting accounts.'; end if;

  select j.default_account_id into cash_acc from public.journals j
   where j.company_id = cid and j.type = 'cash' and j.default_account_id is not null order by j.code limit 1;
  select j.default_account_id into bank_acc from public.journals j
   where j.company_id = cid and j.type = 'bank' and j.default_account_id is not null order by j.code limit 1;
  cash_acc := coalesce(cash_acc, bank_acc);
  bank_acc := coalesce(bank_acc, cash_acc);
  if cash_acc is null then
    raise exception 'No cash or bank account is set on any journal, so there is nowhere to put the takings. Set one in Accounting, Journals.';
  end if;

  insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
  values (cid, jrn, coalesce(ses.closed_at::date, current_date),
          'Till ' || coalesce(ses.register, 'Main') || ' ' || to_char(coalesce(ses.closed_at, now()), 'DD Mon YYYY'),
          'Point of sale session', co_ccy, 'draft', 'pos_session', p_session::text)
  returning id into eid;

  -- the money in, by the way it was taken
  for pay in
    select coalesce(p.stored_value_account_id, case when lower(coalesce(p.method, 'cash')) in ('cash', 'drawer') then cash_acc else bank_acc end) as acc,
           coalesce(p.method, 'cash') as method,
           round(sum(coalesce(p.amount, 0) + coalesce(p.tip_amount, 0)), 2) as amt
      from public.pos_payments p
      join public.pos_orders o on o.id = p.order_id
     where o.session_id = p_session and o.status = 'paid'
     group by 1, 2
     having round(sum(coalesce(p.amount, 0) + coalesce(p.tip_amount, 0)), 2) <> 0
  loop
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, pay.acc, 'Till takings, ' || pay.method,
            case when pay.amt > 0 then pay.amt else 0 end,
            case when pay.amt < 0 then -pay.amt else 0 end,
            pay.amt, co_ccy);
  end loop;

  -- what was sold
  if net + svc <> 0 then
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, rev_acc, 'Till sales', 0, net + svc, -(net + svc), co_ccy);
  end if;
  if tax <> 0 then
    if vat_acc is null then raise exception 'The till collected VAT but no sales VAT account is set. Choose one in Settings, Companies, Accounting accounts.'; end if;
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, vat_acc, 'VAT collected', 0, tax, -tax, co_ccy);
  end if;
  if tips <> 0 then
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, coalesce(tip_acc, rev_acc), 'Tips owed to staff', 0, tips, -tips, co_ccy);
  end if;

  -- the drawer against what it should hold, which is the whole point of counting it
  diff := round(coalesce(taken, 0) + coalesce(tips, 0) - (net + svc + tax + tips), 2);
  if abs(diff) > 0.004 then
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, short_acc, 'Till over and short',
            case when diff < 0 then -diff else 0 end,
            case when diff > 0 then diff else 0 end,
            case when diff < 0 then -diff else -diff end, co_ccy);
  end if;

  -- and the stock that walked out of the door
  if cogs_acc is not null and stock_acc is not null then
    select l.id into dst_loc from public.stock_locations l
     where l.company_id = cid and l.usage = 'customer' and coalesce(l.is_active, true) order by l.name limit 1;
    for l in
      select ol.product_id, sum(ol.qty) as qty, max(o.store_id) as store_id,
             max(p.cost_price) as cost, max(p.uom) as uom
        from public.pos_order_lines ol
        join public.pos_orders o on o.id = ol.order_id
        join public.products p on p.id = ol.product_id
       where o.session_id = p_session and o.status = 'paid'
         and p.type in ('storable', 'consumable')
       group by ol.product_id
      having sum(ol.qty) > 0
    loop
      select sl.id into src_loc from public.stock_locations sl
        left join public.stores st on st.id = l.store_id
       where sl.company_id = cid and sl.usage = 'internal' and coalesce(sl.is_active, true)
         and (st.warehouse_id is null or sl.warehouse_id = st.warehouse_id)
       order by (case when st.warehouse_id is not null and sl.warehouse_id = st.warehouse_id then 0 else 1 end), sl.name
       limit 1;
      if src_loc is not null and dst_loc is not null then
        insert into public.stock_moves (company_id, product_id, quantity, uom, location_id, location_dest_id, state, date, store_id)
        values (cid, l.product_id, l.qty, l.uom, src_loc, dst_loc, 'done', coalesce(ses.closed_at, now()), l.store_id);
      end if;
      cogs_total := cogs_total + round(coalesce(l.cost, 0) * l.qty, 2);
    end loop;

    if cogs_total > 0.004 then
      insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
      values (eid, cid, cogs_acc, 'Cost of what the till sold', cogs_total, 0, cogs_total, co_ccy);
      insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
      values (eid, cid, stock_acc, 'Stock sold at the till', 0, cogs_total, -cogs_total, co_ccy);
    end if;
  end if;

  perform public.post_entry(eid);
  update public.pos_sessions set journal_entry_id = eid where id = p_session;
  return eid;
end $fn$;

grant execute on function public.post_pos_session(uuid) to authenticated;

select 'post_pos_session ready' as done;
