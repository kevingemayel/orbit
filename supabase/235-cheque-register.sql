-- 235: the cheque register. A post-dated cheque is a promise, not money.
--
-- Half the trade in Lebanon pays by cheque, and most of those cheques are dated
-- weeks or months ahead. Orbit had nowhere to hold one. "Cheque" existed only as
-- the name of a payment method, which meant a business had two bad choices: ring
-- the invoice as paid on the day the paper arrived, which puts money in the bank
-- that is not there, or leave the invoice open, which leaves the salesman chasing
-- a customer who has already paid.
--
-- A cheque is now its own record with its own life, and the books follow it:
--
--   received / issued   the cheque is in the drawer, or has been handed over.
--                       The invoice or bill is settled, but against a holding
--                       account, not the bank: 5113 Cheques receivable for one
--                       coming in, 4030 Cheques payable for one going out.
--   deposited           given to the bank, waiting to clear. A date, no posting:
--                       it is still the same asset in the same account.
--   cleared             the bank paid it. Only now does the bank account move.
--   bounced             it did not clear. The debt goes straight back onto the
--                       customer, the invoice reopens for exactly what it was,
--                       and any bank charge posts where you say.
--   endorsed            a cheque received is signed over to a supplier, which is
--                       everyday practice here: it settles what you owe them
--                       without any bank touching it.
--   cancelled           torn up before it cleared. The posting is undone and the
--                       invoice goes back to what it owed.
--
-- The point of the two holding accounts is the question every business with a
-- drawer full of cheques cannot answer: what is going to hit the bank, and when.
-- Their balance is, by construction, the value of every cheque still in flight,
-- so the balance sheet and the register can never disagree.

-- ------------------------------------------------------------------ 1. accounts
alter table public.companies add column if not exists cheques_receivable_account_id uuid references public.accounts(id) on delete set null;
alter table public.companies add column if not exists cheques_payable_account_id    uuid references public.accounts(id) on delete set null;

-- the company's own choice first, the seeded code only as a fallback, exactly as
-- every other control account resolves
create or replace function public.company_account(p_company uuid, p_kind text)
returns uuid language sql stable security definer set search_path = public as $ca$
  select coalesce(
    (select case p_kind
              when 'receivable'         then c.receivable_account_id
              when 'payable'            then c.payable_account_id
              when 'sale_tax'           then c.sale_tax_account_id
              when 'purchase_tax'       then c.purchase_tax_account_id
              when 'income'             then c.income_account_id
              when 'expense'            then c.expense_account_id
              when 'cheques_receivable' then c.cheques_receivable_account_id
              when 'cheques_payable'    then c.cheques_payable_account_id
            end
       from public.companies c where c.id = p_company),
    (select a.id from public.accounts a
      where a.company_id = p_company
        and a.code = case p_kind
                       when 'receivable' then '4100' when 'payable' then '4000'
                       when 'sale_tax' then '4457' when 'purchase_tax' then '4456'
                       when 'income' then '7000' when 'expense' then '6000'
                       when 'cheques_receivable' then '5113' when 'cheques_payable' then '4030'
                     end
      limit 1));
$ca$;
grant execute on function public.company_account(uuid, text) to authenticated;

-- every company gets the two accounts, so nobody has to configure anything
-- before the register works
insert into public.accounts (company_id, code, name, type_code, reconcilable, is_active)
select c.id, '5113', 'Cheques receivable', 'asset_current', true, true
  from public.companies c
 where not exists (select 1 from public.accounts a where a.company_id = c.id and a.code = '5113');
insert into public.accounts (company_id, code, name, type_code, reconcilable, is_active)
select c.id, '4030', 'Cheques payable', 'liability_current', true, true
  from public.companies c
 where not exists (select 1 from public.accounts a where a.company_id = c.id and a.code = '4030');
update public.companies c set
  cheques_receivable_account_id = coalesce(c.cheques_receivable_account_id,
    (select a.id from public.accounts a where a.company_id = c.id and a.code = '5113' limit 1)),
  cheques_payable_account_id = coalesce(c.cheques_payable_account_id,
    (select a.id from public.accounts a where a.company_id = c.id and a.code = '4030' limit 1));

-- @chunk
-- ------------------------------------------------------------------- 2. the table
create table if not exists public.cheques (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  direction text not null default 'in',            -- in = received, out = issued
  status text not null default 'draft',            -- draft pending deposited cleared bounced endorsed cancelled
  cheque_number text not null,
  bank_name text,
  drawer_name text,                                -- whose cheque it is, as printed
  partner_id uuid references public.partners(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(16,2) not null default 0,
  currency_code text,
  issue_date date,                                 -- the day it came in or went out
  due_date date not null default current_date,     -- the day it may be banked
  bank_account_id uuid references public.accounts(id) on delete set null,
  deposited_on date,
  cleared_on date,
  bounced_on date,
  bounce_reason text,
  bank_charge numeric(16,2) default 0,
  endorsed_to_id uuid references public.partners(id) on delete set null,
  endorsed_on date,
  cancelled_on date,
  notes text,
  reference text,
  entry_id uuid references public.journal_entries(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  settle_entry_id uuid references public.journal_entries(id) on delete set null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists cheques_company_idx on public.cheques (company_id, status, due_date);
create index if not exists cheques_partner_idx on public.cheques (partner_id);
create index if not exists cheques_invoice_idx on public.cheques (invoice_id);

alter table public.cheques enable row level security;
drop policy if exists cq_r on public.cheques;
drop policy if exists cq_w on public.cheques;
create policy cq_r on public.cheques for select to authenticated
  using (company_id in (select public.my_company_ids()));
create policy cq_w on public.cheques for all to authenticated
  using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- and the same role gates every accounting table has, under the names 191
-- generates, so a regeneration replaces these instead of doubling them
drop policy if exists rg_sel on public.cheques;
drop policy if exists rg_ins on public.cheques;
drop policy if exists rg_upd on public.cheques;
drop policy if exists rg_del on public.cheques;
create policy rg_sel on public.cheques as restrictive for select to authenticated
  using (company_id in (select public.my_view_company_ids('{accounting}'::text[])));
create policy rg_ins on public.cheques as restrictive for insert to authenticated
  with check (public.can_write_app(company_id, '{accounting}'::text[]));
create policy rg_upd on public.cheques as restrictive for update to authenticated
  using (public.can_write_app(company_id, '{accounting}'::text[]))
  with check (public.can_write_app(company_id, '{accounting}'::text[]));
create policy rg_del on public.cheques as restrictive for delete to authenticated
  using (public.can_write_app(company_id, '{accounting}'::text[]));

-- @chunk
-- --------------------------------------------------------- 3. one entry, two lines
-- Every cheque movement is the same shape: a date, two accounts and one amount.
-- Writing it once means every status change posts the same way and none of them
-- can drift from the others.
create or replace function public.cheque_move(
  p_cheque uuid, p_date date, p_debit uuid, p_credit uuid, p_amount numeric,
  p_label text, p_debit_partner uuid default null, p_credit_partner uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques; v_cid uuid; v_co_ccy text; v_jrn uuid; v_eid uuid;
begin
  select * into v_c from public.cheques where id = p_cheque;
  v_cid := v_c.company_id;
  select currency_code into v_co_ccy from public.companies where id = v_cid;
  select id into v_jrn from public.journals where company_id = v_cid and code = 'BNK';
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid and type = 'bank' order by code limit 1; end if;
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid order by code limit 1; end if;
  if v_jrn is null then raise exception 'This company has no journal to post a cheque through. Add a bank journal in Accounting, Journals.'; end if;
  if p_debit is null or p_credit is null then
    raise exception 'A cheque needs both of its accounts. Check the cheque accounts in Settings, Companies, Accounting accounts.';
  end if;
  insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
  values (v_cid, v_jrn, p_date, 'Cheque ' || coalesce(v_c.cheque_number, ''), p_label, v_co_ccy, 'draft', 'cheque', p_cheque::text)
  returning id into v_eid;
  insert into public.journal_lines (entry_id, company_id, account_id, partner_id, label, debit, credit, amount_currency, currency_code)
  values (v_eid, v_cid, p_debit, p_debit_partner, p_label, p_amount, 0, p_amount, v_co_ccy);
  insert into public.journal_lines (entry_id, company_id, account_id, partner_id, label, debit, credit, amount_currency, currency_code)
  values (v_eid, v_cid, p_credit, p_credit_partner, p_label, 0, p_amount, -p_amount, v_co_ccy);
  perform public.post_entry(v_eid);
  return v_eid;
end $fn$;
revoke all on function public.cheque_move(uuid, date, uuid, uuid, numeric, text, uuid, uuid) from public, anon, authenticated;

-- Undoing a settlement, used by bounce and by cancel. The posted entry is never
-- deleted: the counter-entry is posted separately by the caller. What this does
-- is unpick the match, so the invoice is owed again for exactly what it was.
create or replace function public.cheque_unsettle(p_cheque uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques; v_pay public.payments; v_back numeric; v_tot numeric;
begin
  select * into v_c from public.cheques where id = p_cheque;
  if v_c.invoice_id is null or v_c.payment_id is null then return; end if;
  select * into v_pay from public.payments where id = v_c.payment_id;
  if v_pay.id is null then return; end if;
  delete from public.partial_reconciles pr
   where pr.debit_line_id in (select l.id from public.journal_lines l where l.entry_id = v_pay.entry_id)
      or pr.credit_line_id in (select l.id from public.journal_lines l where l.entry_id = v_pay.entry_id);
  select coalesce(amount_total, 0) into v_tot from public.invoices where id = v_c.invoice_id;
  select least(coalesce(amount_residual, 0) + coalesce(v_pay.amount, 0), v_tot) into v_back
    from public.invoices where id = v_c.invoice_id;
  update public.invoices
     set amount_residual = v_back,
         payment_state = case when v_back >= v_tot - 0.005 then 'not_paid'
                              when v_back <= 0.005 then 'paid' else 'partial' end
   where id = v_c.invoice_id;
  update public.payments set state = 'cancelled',
         memo = coalesce(memo, '') || ' (cheque ' || coalesce(v_c.cheque_number, '') || ' did not clear)'
   where id = v_pay.id;
end $fn$;
revoke all on function public.cheque_unsettle(uuid) from public, anon, authenticated;

-- @chunk
-- ----------------------------------------------------- 4. the cheque arrives
create or replace function public.cheque_post(p_cheque uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques; v_cid uuid; v_hold uuid; v_ctrl uuid; v_inv record; v_pay uuid; v_eid uuid; v_date date;
begin
  select * into v_c from public.cheques where id = p_cheque;
  if v_c.id is null then raise exception 'That cheque no longer exists.'; end if;
  v_cid := v_c.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{accounting}'::text[]) then
    raise exception 'Your role cannot record a cheque. It needs Work in Accounting.';
  end if;
  if v_c.status <> 'draft' then raise exception 'This cheque is already in the register.'; end if;
  if coalesce(v_c.amount, 0) <= 0 then raise exception 'A cheque needs an amount.'; end if;
  if coalesce(v_c.cheque_number, '') = '' then raise exception 'Type the number printed on the cheque.'; end if;
  v_date := coalesce(v_c.issue_date, current_date);

  v_hold := public.company_account(v_cid, case when v_c.direction = 'out' then 'cheques_payable' else 'cheques_receivable' end);
  if v_hold is null then
    raise exception 'This company has no cheque holding account. Set one in Settings, Companies, Accounting accounts.';
  end if;

  -- against an invoice or a bill, the ordinary payment machinery does the work,
  -- with the cheque account standing in for the bank. That keeps one path for
  -- matching, residuals and foreign currency instead of a second, divergent one.
  if v_c.invoice_id is not null then
    select i.id, i.state, i.amount_residual, i.amount_total, i.number, i.move_type, i.partner_id into v_inv
      from public.invoices i where i.id = v_c.invoice_id;
    if v_inv.id is null then raise exception 'The invoice this cheque is against no longer exists.'; end if;
    if v_inv.state <> 'posted' then raise exception 'Post % before putting a cheque against it.', coalesce(v_inv.number, 'that document'); end if;
    if coalesce(v_c.amount, 0) > coalesce(v_inv.amount_residual, v_inv.amount_total) + 0.005 then
      raise exception 'That cheque is for more than % still owes (%). Record the difference as its own cheque or on account.',
        coalesce(v_inv.number, 'the document'), to_char(coalesce(v_inv.amount_residual, v_inv.amount_total), 'FM999999990.00');
    end if;
    v_pay := public.register_payment(v_c.invoice_id, v_c.amount, v_date, 'BNK', 'cheque',
                                     'Cheque ' || v_c.cheque_number, v_hold);
    select p.entry_id into v_eid from public.payments p where p.id = v_pay;
    update public.cheques
       set status = 'pending', payment_id = v_pay, entry_id = v_eid,
           partner_id = coalesce(partner_id, v_inv.partner_id), updated_at = now()
     where id = p_cheque;
    return v_eid;
  end if;

  -- a loose cheque: an advance, a deposit, a cheque for something not invoiced
  -- yet. It still has to land on the customer or the supplier, or the ledger
  -- would show a cheque belonging to nobody.
  v_ctrl := public.company_account(v_cid, case when v_c.direction = 'out' then 'payable' else 'receivable' end);
  if v_ctrl is null then
    raise exception 'This company has no receivable or payable account set. Choose them in Settings, Companies, Accounting accounts.';
  end if;
  if v_c.direction = 'out' then
    v_eid := public.cheque_move(p_cheque, v_date, v_ctrl, v_hold, v_c.amount,
                                'Cheque ' || v_c.cheque_number || ' issued on account', v_c.partner_id, null);
  else
    v_eid := public.cheque_move(p_cheque, v_date, v_hold, v_ctrl, v_c.amount,
                                'Cheque ' || v_c.cheque_number || ' received on account', null, v_c.partner_id);
  end if;
  update public.cheques set status = 'pending', entry_id = v_eid, updated_at = now() where id = p_cheque;
  return v_eid;
end $fn$;
grant execute on function public.cheque_post(uuid) to authenticated;

-- @chunk
-- ------------------------------------------- 5. to the bank, and through it
create or replace function public.cheque_deposit(p_cheque uuid, p_date date default current_date)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques;
begin
  select * into v_c from public.cheques where id = p_cheque;
  if v_c.id is null then raise exception 'That cheque no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(v_c.company_id, '{accounting}'::text[]) then
    raise exception 'Your role cannot bank a cheque. It needs Work in Accounting.';
  end if;
  if v_c.direction <> 'in' then raise exception 'Only a cheque you have received can be deposited.'; end if;
  if v_c.status <> 'pending' then raise exception 'Only a cheque waiting in the drawer can be deposited.'; end if;
  -- nothing posts: the cheque is the same asset in the same account, it has just
  -- changed hands. What changes is that you are now waiting on the bank.
  update public.cheques set status = 'deposited', deposited_on = coalesce(p_date, current_date), updated_at = now()
   where id = p_cheque;
end $fn$;
grant execute on function public.cheque_deposit(uuid, date) to authenticated;

create or replace function public.cheque_clear(p_cheque uuid, p_date date default current_date, p_bank_account uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques; v_cid uuid; v_hold uuid; v_bank uuid; v_eid uuid; v_date date;
begin
  select * into v_c from public.cheques where id = p_cheque;
  if v_c.id is null then raise exception 'That cheque no longer exists.'; end if;
  v_cid := v_c.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{accounting}'::text[]) then
    raise exception 'Your role cannot clear a cheque. It needs Work in Accounting.';
  end if;
  if v_c.status not in ('pending', 'deposited') then raise exception 'Only a cheque still in flight can clear.'; end if;
  v_date := coalesce(p_date, current_date);
  v_hold := public.company_account(v_cid, case when v_c.direction = 'out' then 'cheques_payable' else 'cheques_receivable' end);
  v_bank := coalesce(p_bank_account, v_c.bank_account_id);
  if v_bank is not null then
    if not exists (select 1 from public.accounts a where a.id = v_bank and a.company_id = v_cid) then
      raise exception 'That bank account does not belong to this company.';
    end if;
  else
    select j.default_account_id into v_bank from public.journals j where j.company_id = v_cid and j.code = 'BNK';
    if v_bank is null then select a.id into v_bank from public.accounts a where a.company_id = v_cid and a.code = '5100' limit 1; end if;
  end if;
  if v_bank is null then
    raise exception 'Choose the bank account this cheque went through, or set a default account on the bank journal.';
  end if;

  -- only now does the bank move: in for a cheque received, out for one issued
  if v_c.direction = 'out' then
    v_eid := public.cheque_move(p_cheque, v_date, v_hold, v_bank, v_c.amount, 'Cheque ' || v_c.cheque_number || ' paid by the bank');
  else
    v_eid := public.cheque_move(p_cheque, v_date, v_bank, v_hold, v_c.amount, 'Cheque ' || v_c.cheque_number || ' cleared');
  end if;
  update public.cheques set status = 'cleared', cleared_on = v_date, settle_entry_id = v_eid,
         bank_account_id = v_bank, updated_at = now()
   where id = p_cheque;
  return v_eid;
end $fn$;
grant execute on function public.cheque_clear(uuid, date, uuid) to authenticated;

-- @chunk
-- ------------------------------------------------- 6. and when it does not
create or replace function public.cheque_bounce(p_cheque uuid, p_date date default current_date,
  p_reason text default '', p_charge numeric default 0, p_charge_account uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques; v_cid uuid; v_hold uuid; v_ctrl uuid; v_eid uuid; v_date date; v_bank uuid; v_exp uuid;
begin
  select * into v_c from public.cheques where id = p_cheque;
  if v_c.id is null then raise exception 'That cheque no longer exists.'; end if;
  v_cid := v_c.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{accounting}'::text[]) then
    raise exception 'Your role cannot return a cheque. It needs Work in Accounting.';
  end if;
  if v_c.status not in ('pending', 'deposited') then raise exception 'Only a cheque still in flight can be returned.'; end if;
  v_date := coalesce(p_date, current_date);
  v_hold := public.company_account(v_cid, case when v_c.direction = 'out' then 'cheques_payable' else 'cheques_receivable' end);
  v_ctrl := public.company_account(v_cid, case when v_c.direction = 'out' then 'payable' else 'receivable' end);

  -- the debt goes back where it came from, dated the day the bank said no
  if v_c.direction = 'out' then
    v_eid := public.cheque_move(p_cheque, v_date, v_hold, v_ctrl, v_c.amount,
                                'Cheque ' || v_c.cheque_number || ' returned unpaid', null, v_c.partner_id);
  else
    v_eid := public.cheque_move(p_cheque, v_date, v_ctrl, v_hold, v_c.amount,
                                'Cheque ' || v_c.cheque_number || ' returned unpaid', v_c.partner_id, null);
  end if;
  perform public.cheque_unsettle(p_cheque);

  -- the bank's charge for the trouble, if there was one
  if coalesce(p_charge, 0) > 0.004 then
    v_exp := coalesce(p_charge_account, public.company_account(v_cid, 'expense'));
    select j.default_account_id into v_bank from public.journals j where j.company_id = v_cid and j.code = 'BNK';
    if v_bank is null then select a.id into v_bank from public.accounts a where a.company_id = v_cid and a.code = '5100' limit 1; end if;
    if v_exp is not null and v_bank is not null then
      perform public.cheque_move(p_cheque, v_date, v_exp, v_bank, p_charge,
                                 'Bank charge on returned cheque ' || v_c.cheque_number);
    end if;
  end if;

  update public.cheques set status = 'bounced', bounced_on = v_date,
         bounce_reason = nullif(btrim(coalesce(p_reason, '')), ''),
         bank_charge = coalesce(p_charge, 0), settle_entry_id = v_eid, updated_at = now()
   where id = p_cheque;
  return v_eid;
end $fn$;
grant execute on function public.cheque_bounce(uuid, date, text, numeric, uuid) to authenticated;

create or replace function public.cheque_endorse(p_cheque uuid, p_to uuid, p_date date default current_date)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques; v_cid uuid; v_hold uuid; v_ap uuid; v_eid uuid; v_date date; v_who text;
begin
  select * into v_c from public.cheques where id = p_cheque;
  if v_c.id is null then raise exception 'That cheque no longer exists.'; end if;
  v_cid := v_c.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{accounting}'::text[]) then
    raise exception 'Your role cannot endorse a cheque. It needs Work in Accounting.';
  end if;
  if v_c.direction <> 'in' then raise exception 'Only a cheque you have received can be signed over.'; end if;
  if v_c.status not in ('pending', 'deposited') then raise exception 'Only a cheque still in flight can be signed over.'; end if;
  if p_to is null then raise exception 'Say who the cheque is being signed over to.'; end if;
  if not exists (select 1 from public.partners p where p.id = p_to and p.company_id = v_cid) then
    raise exception 'That supplier does not belong to this company.';
  end if;
  v_date := coalesce(p_date, current_date);
  select p.name into v_who from public.partners p where p.id = p_to;
  v_hold := public.company_account(v_cid, 'cheques_receivable');
  v_ap := public.company_account(v_cid, 'payable');
  -- what you owe them goes down, the cheque leaves your hands, the bank never sees it
  v_eid := public.cheque_move(p_cheque, v_date, v_ap, v_hold, v_c.amount,
                              'Cheque ' || v_c.cheque_number || ' endorsed to ' || coalesce(v_who, ''), p_to, null);
  update public.cheques set status = 'endorsed', endorsed_to_id = p_to, endorsed_on = v_date,
         settle_entry_id = v_eid, updated_at = now()
   where id = p_cheque;
  return v_eid;
end $fn$;
grant execute on function public.cheque_endorse(uuid, uuid, date) to authenticated;

create or replace function public.cheque_cancel(p_cheque uuid, p_reason text default '', p_date date default current_date)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_c public.cheques; v_cid uuid; v_hold uuid; v_ctrl uuid; v_eid uuid; v_date date;
begin
  select * into v_c from public.cheques where id = p_cheque;
  if v_c.id is null then raise exception 'That cheque no longer exists.'; end if;
  v_cid := v_c.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{accounting}'::text[]) then
    raise exception 'Your role cannot cancel a cheque. It needs Work in Accounting.';
  end if;
  if v_c.status in ('cleared', 'cancelled', 'endorsed') then
    raise exception 'A cheque that has cleared or already left cannot be cancelled. Return it instead, or raise the correction yourself.';
  end if;
  v_date := coalesce(p_date, current_date);
  if v_c.status = 'draft' then
    update public.cheques set status = 'cancelled', cancelled_on = v_date,
           notes = coalesce(nullif(btrim(coalesce(p_reason, '')), ''), notes), updated_at = now()
     where id = p_cheque;
    return null;
  end if;
  v_hold := public.company_account(v_cid, case when v_c.direction = 'out' then 'cheques_payable' else 'cheques_receivable' end);
  v_ctrl := public.company_account(v_cid, case when v_c.direction = 'out' then 'payable' else 'receivable' end);
  if v_c.direction = 'out' then
    v_eid := public.cheque_move(p_cheque, v_date, v_hold, v_ctrl, v_c.amount,
                                'Cheque ' || v_c.cheque_number || ' cancelled', null, v_c.partner_id);
  else
    v_eid := public.cheque_move(p_cheque, v_date, v_ctrl, v_hold, v_c.amount,
                                'Cheque ' || v_c.cheque_number || ' cancelled', v_c.partner_id, null);
  end if;
  perform public.cheque_unsettle(p_cheque);
  update public.cheques set status = 'cancelled', cancelled_on = v_date, settle_entry_id = v_eid,
         notes = coalesce(nullif(btrim(coalesce(p_reason, '')), ''), notes), updated_at = now()
   where id = p_cheque;
  return v_eid;
end $fn$;
grant execute on function public.cheque_cancel(uuid, text, date) to authenticated;

-- @chunk
-- ------------------------------------------------------- 7. what hits the bank
-- The question a drawer full of cheques exists to answer. One row per week, both
-- directions, and the running effect on the bank if every cheque behaves.
create or replace function public.cheque_position(p_company uuid, p_weeks int default 12)
returns table (week_start date, cheques_in numeric, cheques_out numeric, net numeric, running numeric)
language sql
stable
security definer
set search_path to 'public'
as $pos$
  with live as (
    select date_trunc('week', c.due_date)::date as wk,
           sum(case when c.direction = 'in' then c.amount else 0 end) as cin,
           sum(case when c.direction = 'out' then c.amount else 0 end) as cout
      from public.cheques c
     where c.company_id = p_company
       and c.status in ('pending', 'deposited')
       and c.due_date < (date_trunc('week', current_date) + (coalesce(p_weeks, 12) || ' weeks')::interval)::date
     group by 1)
  select wk, round(cin, 2), round(cout, 2), round(cin - cout, 2),
         round(sum(cin - cout) over (order by wk rows between unbounded preceding and current row), 2)
    from live order by wk;
$pos$;
grant execute on function public.cheque_position(uuid, int) to authenticated;

select 'cheque register ready' as done,
       (select count(*) from public.accounts where code = '5113') as cheque_recv_accounts,
       (select count(*) from public.accounts where code = '4030') as cheque_pay_accounts;
