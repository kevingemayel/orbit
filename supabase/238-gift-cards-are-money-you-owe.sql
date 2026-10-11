-- 238: a loaded gift card is money you owe, and the books now say so.
--
-- The Gift cards and wallets screen said it plainly: "Orbit records the card
-- and its balance for reference; nothing is posted." Three things followed from
-- that, and the third is a real money bug rather than a missing feature.
--
--   1. Loading a card took money and recorded nothing. Cash came in and no
--      liability appeared against it, so the balance sheet was short by every
--      card ever sold and the profit and loss was right only by accident.
--   2. stored_value_transactions, the movement history, had 8 rows in it that
--      nothing could write and no screen could show.
--   3. The till offers "Wallet / gift card" as a way to pay. That tender was
--      posting to the BANK, so a card paying for a coffee recorded money
--      arriving in the bank that never arrived, recognised the revenue twice
--      over the card's life, and never touched the card's balance. Worse, the
--      posting read pos_payments.stored_value_account_id straight into
--      journal_lines.account_id, and that column holds a card, not an account:
--      the first wallet tender with a card on it would have failed on a foreign
--      key, in the night's posting, after the shop had shut.
--
-- What is true now:
--
--   Loading a card     cash or bank up, 4190 Gift cards and wallets up. The
--                      money is yours to hold, not yours to keep.
--   Paying with one    the till's own posting sends that tender to 4190, so the
--                      liability comes down as the revenue is earned, which is
--                      the whole point of holding it.
--   The balance        moved by a trigger on the tender itself, so no screen
--                      can take a payment on a card and forget to spend it,
--                      and a card without the balance refuses the payment
--                      instead of going quietly negative.
--   Expiry             a card past its date with a balance left is breakage:
--                      4190 down, 7580 Gift card breakage up, which is the only
--                      point at which it becomes income. Run nightly.

alter table public.companies
  add column if not exists gift_card_account_id uuid references public.accounts(id) on delete set null,
  add column if not exists gift_card_breakage_account_id uuid references public.accounts(id) on delete set null;

create or replace function public.company_account(p_company uuid, p_kind text)
returns uuid language sql stable security definer set search_path = public as $ca$
  select coalesce(
    (select case p_kind
              when 'receivable'          then c.receivable_account_id
              when 'payable'             then c.payable_account_id
              when 'sale_tax'            then c.sale_tax_account_id
              when 'purchase_tax'        then c.purchase_tax_account_id
              when 'income'              then c.income_account_id
              when 'expense'             then c.expense_account_id
              when 'cheques_receivable'  then c.cheques_receivable_account_id
              when 'cheques_payable'     then c.cheques_payable_account_id
              when 'tips_payable'        then c.tips_payable_account_id
              when 'salary_payable'      then c.salary_payable_account_id
              when 'gift_cards'          then c.gift_card_account_id
              when 'gift_card_breakage'  then c.gift_card_breakage_account_id
            end
       from public.companies c where c.id = p_company),
    (select a.id from public.accounts a
      where a.company_id = p_company
        and a.code = case p_kind
                       when 'receivable' then '4100' when 'payable' then '4000'
                       when 'sale_tax' then '4457' when 'purchase_tax' then '4456'
                       when 'income' then '7000' when 'expense' then '6000'
                       when 'cheques_receivable' then '5113' when 'cheques_payable' then '4030'
                       when 'tips_payable' then '4280'
                       when 'gift_cards' then '4198' when 'gift_card_breakage' then '7580'
                     end
      limit 1));
$ca$;
grant execute on function public.company_account(uuid, text) to authenticated;

-- 4190 is taken: every company on the seeded chart already has it as
-- "Customers - advances received", which is a different promise to a different
-- person. Pointing gift cards at it would put card balances into customer
-- advances, so the card liability gets its own code.
insert into public.accounts (company_id, code, name, type_code, reconcilable, is_active)
select c.id, '4198', 'Gift cards and wallets', 'liability_current', false, true
  from public.companies c
 where not exists (select 1 from public.accounts a where a.company_id = c.id and a.code = '4198');
insert into public.accounts (company_id, code, name, type_code, reconcilable, is_active)
select c.id, '7580', 'Gift card breakage', 'income_other', false, true
  from public.companies c
 where not exists (select 1 from public.accounts a where a.company_id = c.id and a.code = '7580');
update public.companies c set
  gift_card_account_id = coalesce(c.gift_card_account_id,
    (select a.id from public.accounts a where a.company_id = c.id and a.code = '4198' limit 1)),
  gift_card_breakage_account_id = coalesce(c.gift_card_breakage_account_id,
    (select a.id from public.accounts a where a.company_id = c.id and a.code = '7580' limit 1));

-- and anything already pointed at an account that is not the card liability is
-- moved onto it. This ran once against 4190 before the clash was spotted; no
-- card had posted, so there is nothing to move but the pointer.
update public.companies c
   set gift_card_account_id = (select a.id from public.accounts a where a.company_id = c.id and a.code = '4198' limit 1)
 where c.gift_card_account_id is not null
   and not exists (select 1 from public.accounts a
                    where a.id = c.gift_card_account_id and a.name = 'Gift cards and wallets');

-- @chunk
-- ------------------------------------------- which account a card sits against
-- A card may name its own, for a corporate account kept separately; otherwise
-- the company's. Null in, null out, because the posting code asks about every
-- tender and most have no card.
create or replace function public.stored_value_gl(p_account uuid)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select coalesce(s.liability_account_id, public.company_account(s.company_id, 'gift_cards'))
    from public.stored_value_accounts s where s.id = p_account;
$fn$;
grant execute on function public.stored_value_gl(uuid) to authenticated;

-- the till's own posting: a wallet or voucher tender belongs against the card
-- liability, never the bank. Rewritten in place, as 171 did with the payment
-- lookups, so the rest of the night's posting is untouched.
do $rewrite$
declare d text; marker text;
begin
  marker := 'select coalesce(p.stored_value_account_id,';
  select pg_get_functiondef(p.oid) into d
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'post_pos_orders';
  if d is null then raise exception 'post_pos_orders is missing - run 229 first'; end if;
  if position(marker in d) = 0 then
    if position('stored_value_gl' in d) > 0 then return; end if;   -- already rewritten
    raise exception 'post_pos_orders no longer maps its tenders the way this migration rewrites';
  end if;
  d := replace(d,
    'select coalesce(p.stored_value_account_id,
                    case when lower(coalesce(p.method, ''cash'')) in (''cash'', ''drawer'') then cash_acc else bank_acc end) as acc,',
    'select coalesce(public.stored_value_gl(p.stored_value_account_id),
                    case when lower(coalesce(p.method, ''cash'')) in (''cash'', ''drawer'') then cash_acc
                         when lower(coalesce(p.method, ''cash'')) in (''wallet'', ''giftcard'', ''gift_card'', ''voucher'')
                              then coalesce(public.company_account(cid, ''gift_cards''), bank_acc)
                         else bank_acc end) as acc,');
  if position('stored_value_gl' in d) = 0 then
    raise exception 'the tender mapping in post_pos_orders did not match, so nothing was changed';
  end if;
  execute d;
end $rewrite$;

-- @chunk
-- ------------------------------------------------------ loading a card
create or replace function public.stored_value_load(
  p_account uuid, p_amount numeric, p_date date default current_date,
  p_from_cash_account uuid default null, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_s public.stored_value_accounts; v_cid uuid; v_liab uuid; v_cash uuid; v_jrn uuid; v_eid uuid; v_ccy text; v_bal numeric;
begin
  select * into v_s from public.stored_value_accounts where id = p_account;
  if v_s.id is null then raise exception 'That card no longer exists.'; end if;
  v_cid := v_s.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{pos,kitchen,sales,counter,accounting}'::text[]) then
    raise exception 'Your role cannot load a card. It needs Work in the till, Kitchen, Sales or Counter.';
  end if;
  if coalesce(p_amount, 0) <= 0 then raise exception 'How much is going on the card?'; end if;
  if coalesce(v_s.status, 'active') <> 'active' then
    raise exception 'That card is %. Only an active card can be loaded.', coalesce(v_s.status, 'not active');
  end if;
  v_liab := public.stored_value_gl(p_account);
  if v_liab is null then raise exception 'This company has no gift card account. Set one in Settings, Companies, Accounting accounts.'; end if;

  if p_from_cash_account is not null then
    select a.gl_account_id into v_cash from public.cash_accounts a where a.id = p_from_cash_account and a.company_id = v_cid;
    if v_cash is null then select a.id into v_cash from public.accounts a where a.id = p_from_cash_account and a.company_id = v_cid; end if;
    if v_cash is null then raise exception 'That account does not belong to this company.'; end if;
  else
    select j.default_account_id into v_cash from public.journals j where j.company_id = v_cid and j.code = 'CSH';
    if v_cash is null then select a.id into v_cash from public.accounts a where a.company_id = v_cid and a.code = '5300' limit 1; end if;
    if v_cash is null then select a.id into v_cash from public.accounts a where a.company_id = v_cid and a.code = '5100' limit 1; end if;
  end if;
  if v_cash is null then raise exception 'Choose the till or the bank account the money came into.'; end if;

  select currency_code into v_ccy from public.companies where id = v_cid;
  select id into v_jrn from public.journals where company_id = v_cid and code = 'CSH';
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid and code = 'BNK'; end if;
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid order by code limit 1; end if;
  if v_jrn is null then raise exception 'This company has no journal to post a card load through.'; end if;

  insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
  values (v_cid, v_jrn, coalesce(p_date, current_date), 'Card ' || coalesce(v_s.card_number, ''),
          'Loaded onto ' || coalesce(v_s.kind, 'a card') || ' ' || coalesce(v_s.card_number, ''),
          v_ccy, 'draft', 'stored_value', p_account::text)
  returning id into v_eid;
  insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
  values (v_eid, v_cid, v_cash, 'Card loaded', p_amount, 0, p_amount, v_ccy);
  insert into public.journal_lines (entry_id, company_id, account_id, partner_id, label, debit, credit, amount_currency, currency_code)
  values (v_eid, v_cid, v_liab, v_s.partner_id, 'Owed on the card', 0, p_amount, -p_amount, v_ccy);
  perform public.post_entry(v_eid);

  v_bal := round(coalesce(v_s.balance, 0) + p_amount, 2);
  update public.stored_value_accounts set balance = v_bal where id = p_account;
  insert into public.stored_value_transactions (company_id, account_id, kind, amount, balance_after, journal_entry_id, note)
  values (v_cid, p_account, 'load', p_amount, v_bal, v_eid, p_note);
  return v_eid;
end $fn$;
grant execute on function public.stored_value_load(uuid, numeric, date, uuid, text) to authenticated;

-- @chunk
-- -------------------------------------- spending it, wherever it is spent from
-- A trigger rather than a function anybody has to remember to call. Every path
-- that takes money at a till writes a pos_payments row; naming a card on that
-- row is now the whole of "pay with the card", and a card without the balance
-- refuses the payment rather than going quietly negative. Change handed back
-- onto a card arrives as a negative tender, which puts it back.
create or replace function public.sv_tender_movement()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_s public.stored_value_accounts; v_amt numeric; v_bal numeric;
begin
  if new.stored_value_account_id is null then return new; end if;
  select * into v_s from public.stored_value_accounts where id = new.stored_value_account_id;
  if v_s.id is null then raise exception 'That card no longer exists.'; end if;
  if v_s.company_id <> new.company_id then raise exception 'That card belongs to another company.'; end if;
  v_amt := round(coalesce(new.amount, 0), 2);
  if v_amt = 0 then return new; end if;
  if v_amt > 0 then
    if coalesce(v_s.status, 'active') <> 'active' then
      raise exception 'Card % is %. It cannot be used to pay.', coalesce(v_s.card_number, ''), coalesce(v_s.status, 'not active');
    end if;
    if v_s.expires_on is not null and v_s.expires_on < current_date then
      raise exception 'Card % expired on %.', coalesce(v_s.card_number, ''), v_s.expires_on;
    end if;
    if v_amt > coalesce(v_s.balance, 0) + 0.005 then
      raise exception 'Card % has % on it, not %.', coalesce(v_s.card_number, ''),
        to_char(coalesce(v_s.balance, 0), 'FM999999990.00'), to_char(v_amt, 'FM999999990.00');
    end if;
  end if;
  v_bal := round(coalesce(v_s.balance, 0) - v_amt, 2);
  update public.stored_value_accounts set balance = v_bal where id = v_s.id;
  insert into public.stored_value_transactions (company_id, account_id, store_id, kind, amount, balance_after, order_id, note)
  values (new.company_id, v_s.id, new.store_id, case when v_amt > 0 then 'spend' else 'change back' end,
          -v_amt, v_bal, new.order_id, null);
  return new;
end $fn$;
drop trigger if exists trg_sv_tender on public.pos_payments;
create trigger trg_sv_tender after insert on public.pos_payments
  for each row execute function public.sv_tender_movement();

-- a correction by hand, which a card scheme needs and which has to be visible
create or replace function public.stored_value_adjust(p_account uuid, p_amount numeric, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_s public.stored_value_accounts; v_cid uuid; v_liab uuid; v_other uuid; v_jrn uuid; v_eid uuid; v_ccy text; v_bal numeric;
begin
  select * into v_s from public.stored_value_accounts where id = p_account;
  if v_s.id is null then raise exception 'That card no longer exists.'; end if;
  v_cid := v_s.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{accounting,kitchen,pos}'::text[]) then
    raise exception 'Your role cannot correct a card balance. It needs Work in Accounting, Kitchen or the till.';
  end if;
  if coalesce(p_amount, 0) = 0 then raise exception 'A correction of nothing is not a correction.'; end if;
  if p_amount < 0 and -p_amount > coalesce(v_s.balance, 0) + 0.005 then
    raise exception 'Card % has only % on it.', coalesce(v_s.card_number, ''), to_char(coalesce(v_s.balance, 0), 'FM999999990.00');
  end if;
  v_liab := public.stored_value_gl(p_account);
  -- putting value on without taking money is a giveaway, so it is a cost; taking
  -- it off without a sale is breakage, so it is income
  v_other := case when p_amount > 0 then public.company_account(v_cid, 'expense')
                  else coalesce(v_s.breakage_account_id, public.company_account(v_cid, 'gift_card_breakage')) end;
  if v_liab is null or v_other is null then raise exception 'This company needs a gift card account and an expense or breakage account before a correction can post.'; end if;
  select currency_code into v_ccy from public.companies where id = v_cid;
  select id into v_jrn from public.journals where company_id = v_cid and type = 'general' order by code limit 1;
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid order by code limit 1; end if;
  insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
  values (v_cid, v_jrn, current_date, 'Card ' || coalesce(v_s.card_number, ''),
          coalesce(p_note, 'Card balance corrected by hand'), v_ccy, 'draft', 'stored_value', p_account::text)
  returning id into v_eid;
  if p_amount > 0 then
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (v_eid, v_cid, v_other, 'Value given on a card', p_amount, 0, p_amount, v_ccy);
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (v_eid, v_cid, v_liab, 'Owed on the card', 0, p_amount, -p_amount, v_ccy);
  else
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (v_eid, v_cid, v_liab, 'Taken off a card', -p_amount, 0, -p_amount, v_ccy);
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (v_eid, v_cid, v_other, 'Card balance written off', 0, -p_amount, p_amount, v_ccy);
  end if;
  perform public.post_entry(v_eid);
  v_bal := round(coalesce(v_s.balance, 0) + p_amount, 2);
  update public.stored_value_accounts set balance = v_bal where id = p_account;
  insert into public.stored_value_transactions (company_id, account_id, kind, amount, balance_after, journal_entry_id, note)
  values (v_cid, p_account, 'adjust', p_amount, v_bal, v_eid, p_note);
  return v_eid;
end $fn$;
grant execute on function public.stored_value_adjust(uuid, numeric, text) to authenticated;

-- @chunk
-- ------------------------------------------------------------- and expiry
-- The only point at which an unspent balance becomes income. Run nightly, and
-- it does nothing at all on a company whose cards carry no expiry date.
create or replace function public.stored_value_expire(p_company uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare c record; s record; v_liab uuid; v_brk uuid; v_jrn uuid; v_eid uuid; v_ccy text; v_n int := 0; v_tot numeric := 0;
begin
  for c in select id, currency_code from public.companies
            where (p_company is null or id = p_company)
              and exists (select 1 from public.stored_value_accounts a
                           where a.company_id = companies.id and coalesce(a.balance, 0) > 0.004
                             and a.expires_on is not null and a.expires_on < current_date
                             and coalesce(a.status, 'active') <> 'expired')
  loop
    v_liab := public.company_account(c.id, 'gift_cards');
    v_brk := public.company_account(c.id, 'gift_card_breakage');
    if v_liab is null or v_brk is null then continue; end if;
    select id into v_jrn from public.journals where company_id = c.id and type = 'general' order by code limit 1;
    if v_jrn is null then select id into v_jrn from public.journals where company_id = c.id order by code limit 1; end if;
    if v_jrn is null then continue; end if;
    v_ccy := c.currency_code;
    v_eid := null;
    for s in select * from public.stored_value_accounts
              where company_id = c.id and coalesce(balance, 0) > 0.004
                and expires_on is not null and expires_on < current_date
                and coalesce(status, 'active') <> 'expired'
    loop
      if v_eid is null then
        insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
        values (c.id, v_jrn, current_date, 'Card breakage', 'Expired card balances', v_ccy, 'draft', 'stored_value_breakage', c.id::text)
        returning id into v_eid;
      end if;
      -- both sides per card, so a card that names its own breakage account is
      -- honoured without any aggregation to get wrong
      insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
      values (v_eid, c.id, coalesce(s.liability_account_id, v_liab),
              'Expired card ' || coalesce(s.card_number, ''), s.balance, 0, s.balance, v_ccy);
      insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
      values (v_eid, c.id, coalesce(s.breakage_account_id, v_brk),
              'Breakage on card ' || coalesce(s.card_number, ''), 0, s.balance, -s.balance, v_ccy);
      insert into public.stored_value_transactions (company_id, account_id, kind, amount, balance_after, journal_entry_id, note)
      values (c.id, s.id, 'expired', -s.balance, 0, v_eid, 'Expired on ' || s.expires_on);
      update public.stored_value_accounts set balance = 0, status = 'expired' where id = s.id;
      v_n := v_n + 1; v_tot := v_tot + s.balance;
    end loop;
    if v_eid is not null then perform public.post_entry(v_eid); end if;
  end loop;
  return jsonb_build_object('ok', true, 'cards', v_n, 'written_off', round(v_tot, 2));
end $fn$;
grant execute on function public.stored_value_expire(uuid) to authenticated;

select cron.unschedule('sv-card-expiry') where exists (select 1 from cron.job where jobname = 'sv-card-expiry');
select cron.schedule('sv-card-expiry', '35 6 * * *', $cron$select public.stored_value_expire(null);$cron$);

-- the 8 movements already here have no balance_after, because nothing was
-- keeping one. Fill it from the card's own balance where it is the only
-- movement, and leave the rest as the history they are.
update public.stored_value_transactions t
   set balance_after = a.balance
  from public.stored_value_accounts a
 where a.id = t.account_id and t.balance_after is null
   and (select count(*) from public.stored_value_transactions x where x.account_id = t.account_id) = 1;

select 'gift cards post now' as done,
       (select count(*) from public.accounts where code = '4198') as liability_accounts,
       (select count(*) from public.stored_value_accounts) as cards,
       (select count(*) from public.stored_value_transactions) as movements;
