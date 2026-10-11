-- 229: post the ORDERS, not the session, because most of them have no session.
--
-- 228 posted a till session. Then the data said what really happens: of 7,639
-- paid orders in this database, **every single one belongs to no session at
-- all**. The register opens a session; the restaurant floor and the kitchen do
-- not, and an order taken at a table when no drawer is open is still a sale.
-- Posting by session would have left all of it out, which is the same hole in
-- a new place.
--
-- So the unit is the order. Each one carries the entry that took it to the
-- accounts, and anything not yet stamped can be posted, whichever way it was
-- rung up:
--
--   post_pos_session(session)        everything that session took
--   post_pos_day(company, store, d)  a day on the floor, store by store
--
-- Both end in one entry per batch, built the same way: the money in by the way
-- it was taken, the sales, the VAT, the tips, the drawer over and short, and
-- the cost of anything that came out of stock. An order already posted is
-- never posted twice, so running either again is safe.
alter table public.pos_orders
  add column if not exists journal_entry_id uuid references public.journal_entries(id) on delete set null;
create index if not exists pos_orders_unposted_idx on public.pos_orders (company_id, status) where journal_entry_id is null;

create or replace function public.post_pos_orders(p_company uuid, p_session uuid default null,
                                                  p_store uuid default null, p_date date default null,
                                                  p_label text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  cid uuid := p_company; jrn uuid; eid uuid; co_ccy text; rdate date;
  v_net numeric := 0; v_tax numeric := 0; v_tips numeric := 0; v_svc numeric := 0; v_taken numeric := 0;
  cash_acc uuid; bank_acc uuid; rev_acc uuid; vat_acc uuid; tip_acc uuid; short_acc uuid;
  cogs_acc uuid; stock_acc uuid; v_cogs numeric := 0; v_diff numeric := 0;
  src_loc uuid; dst_loc uuid; n_orders int; pay record; l record;
begin
  if cid is null then raise exception 'A till batch has to belong to a company.'; end if;
  if auth.uid() is not null and not public.can_write_app(cid, '{pos,kitchen,accounting}'::text[]) then
    raise exception 'Your role cannot post till takings. It needs Work in Point of Sale, Kitchen or Accounting.';
  end if;

  -- the orders this batch is made of: paid, this company, not already posted
  create temp table _batch on commit drop as
  select o.id, o.subtotal, o.tax, o.service_charge, o.tip_amount, o.store_id, o.created_at
    from public.pos_orders o
   where o.company_id = cid
     and o.status = 'paid'
     and o.journal_entry_id is null
     and (p_session is null or o.session_id = p_session)
     and (p_store is null or o.store_id = p_store)
     and (p_date is null or (o.created_at at time zone 'UTC')::date = p_date);

  select count(*) into n_orders from _batch;
  if n_orders = 0 then
    raise exception 'There is nothing left to post here: every paid order in this batch is already in the accounts.';
  end if;

  select coalesce(sum(b.subtotal), 0), coalesce(sum(b.tax), 0), coalesce(sum(b.service_charge), 0), max(b.created_at)::date
    into v_net, v_tax, v_svc, rdate from _batch b;
  select coalesce(sum(p.amount), 0), coalesce(sum(p.tip_amount), 0)
    into v_taken, v_tips
    from public.pos_payments p join _batch b on b.id = p.order_id;

  rdate := coalesce(p_date, rdate, current_date);
  if v_net + v_tax + v_taken = 0 then
    raise exception 'These orders took no money, so there is nothing to post.';
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
  cash_acc := coalesce(cash_acc, bank_acc); bank_acc := coalesce(bank_acc, cash_acc);
  if cash_acc is null then
    raise exception 'No cash or bank account is set on any journal, so there is nowhere to put the takings. Set one in Accounting, Journals.';
  end if;

  insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
  values (cid, jrn, rdate,
          coalesce(p_label, 'Till ' || to_char(rdate, 'DD Mon YYYY')),
          n_orders || ' till order(s)', co_ccy, 'draft', 'pos_batch',
          coalesce(p_session::text, cid::text || ':' || to_char(rdate, 'YYYY-MM-DD')))
  returning id into eid;

  for pay in
    select coalesce(p.stored_value_account_id,
                    case when lower(coalesce(p.method, 'cash')) in ('cash', 'drawer') then cash_acc else bank_acc end) as acc,
           coalesce(p.method, 'cash') as method,
           round(sum(coalesce(p.amount, 0) + coalesce(p.tip_amount, 0)), 2) as amt
      from public.pos_payments p join _batch b on b.id = p.order_id
     group by 1, 2
     having round(sum(coalesce(p.amount, 0) + coalesce(p.tip_amount, 0)), 2) <> 0
  loop
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, pay.acc, 'Till takings, ' || pay.method,
            case when pay.amt > 0 then pay.amt else 0 end,
            case when pay.amt < 0 then -pay.amt else 0 end, pay.amt, co_ccy);
  end loop;

  if v_net + v_svc <> 0 then
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, rev_acc, 'Till sales', 0, v_net + v_svc, -(v_net + v_svc), co_ccy);
  end if;
  if v_tax <> 0 then
    if vat_acc is null then raise exception 'The till collected VAT but no sales VAT account is set. Choose one in Settings, Companies, Accounting accounts.'; end if;
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, vat_acc, 'VAT collected', 0, v_tax, -v_tax, co_ccy);
  end if;
  if v_tips <> 0 then
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, coalesce(tip_acc, rev_acc), 'Tips owed to staff', 0, v_tips, -v_tips, co_ccy);
  end if;

  -- what was taken against what was sold: the difference is over and short
  v_diff := round(coalesce(v_taken, 0) + coalesce(v_tips, 0) - (v_net + v_svc + v_tax + v_tips), 2);
  if abs(v_diff) > 0.004 then
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (eid, cid, short_acc, 'Till over and short',
            case when v_diff < 0 then -v_diff else 0 end,
            case when v_diff > 0 then v_diff else 0 end, -v_diff, co_ccy);
  end if;

  -- and the stock that walked out of the door
  if cogs_acc is not null and stock_acc is not null then
    select sl.id into dst_loc from public.stock_locations sl
     where sl.company_id = cid and sl.usage = 'customer' and coalesce(sl.is_active, true) order by sl.name limit 1;
    for l in
      select ol.product_id, sum(ol.qty) as qty, (array_agg(b.store_id))[1] as store_id,
             max(p.cost_price) as cost, max(p.uom) as uom
        from public.pos_order_lines ol
        join _batch b on b.id = ol.order_id
        join public.products p on p.id = ol.product_id
       where p.type in ('storable', 'consumable')
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
        values (cid, l.product_id, l.qty, l.uom, src_loc, dst_loc, 'done', rdate, l.store_id);
      end if;
      v_cogs := v_cogs + round(coalesce(l.cost, 0) * l.qty, 2);
    end loop;
    if v_cogs > 0.004 then
      insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
      values (eid, cid, cogs_acc, 'Cost of what the till sold', v_cogs, 0, v_cogs, co_ccy);
      insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
      values (eid, cid, stock_acc, 'Stock sold at the till', 0, v_cogs, -v_cogs, co_ccy);
    end if;
  end if;

  perform public.post_entry(eid);
  update public.pos_orders o set journal_entry_id = eid from _batch b where b.id = o.id;
  if p_session is not null then update public.pos_sessions set journal_entry_id = eid where id = p_session; end if;
  return eid;
end $fn$;

-- the two ways a batch is named in the app
create or replace function public.post_pos_session(p_session uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare ses public.pos_sessions;
begin
  select * into ses from public.pos_sessions where id = p_session;
  if ses.id is null then raise exception 'That till session no longer exists.'; end if;
  if coalesce(ses.status, '') <> 'closed' then
    raise exception 'Close the session first: a till that is still open has not finished taking money.';
  end if;
  if ses.journal_entry_id is not null then return ses.journal_entry_id; end if;
  return public.post_pos_orders(ses.company_id, p_session, null, null,
    'Till ' || coalesce(ses.register, 'Main') || ' ' || to_char(coalesce(ses.closed_at, now()), 'DD Mon YYYY'));
end $fn$;

create or replace function public.post_pos_day(p_company uuid, p_store uuid default null, p_date date default null)
returns uuid language plpgsql security definer set search_path to 'public' as $fn$
declare d date := coalesce(p_date, current_date); nm text;
begin
  select name into nm from public.stores where id = p_store;
  return public.post_pos_orders(p_company, null, p_store, d,
    'Till ' || coalesce(nm || ' ', '') || to_char(d, 'DD Mon YYYY'));
end $fn$;

grant execute on function public.post_pos_orders(uuid, uuid, uuid, date, text) to authenticated;
grant execute on function public.post_pos_session(uuid) to authenticated;
grant execute on function public.post_pos_day(uuid, uuid, date) to authenticated;

-- what is waiting to be posted, per company and day
select c.name as company, (o.created_at at time zone 'UTC')::date as day,
       count(*) as paid_orders, round(sum(o.total), 2) as takings
from public.pos_orders o join public.companies c on c.id = o.company_id
where o.status = 'paid' and o.journal_entry_id is null
group by 1, 2 order by 2 desc, 1 limit 10;
