-- ============================================================================
-- 177-counter-accounts.sql  -  the cash desk posts to the accounts you can see.
--
-- register_payment took the cash side of a payment from the Bank or Cash
-- journal's default account (and 5100 if that was empty), so money received at
-- the Counter into a named till or bank account was booked somewhere else. It
-- now accepts the account the money actually moved through. The old signature
-- is dropped first: adding a defaulted parameter with create or replace makes a
-- second function beside the first, and every call then fails as ambiguous.
--
-- A movement also keeps every journal entry it created, and the versions it had
-- before each edit, so the Counter can show the JV numbers and the history.
-- ============================================================================
drop function if exists public.register_payment(uuid, numeric, date, text, text, text);

create or replace function public.register_payment(p_invoice uuid, p_amount numeric, p_date date default current_date, p_journal_code text default 'BNK'::text, p_method text default 'bank'::text, p_ref text default ''::text, p_cash_account uuid default null)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare inv record; cid uuid; oid uuid; co_ccy text; doc_ccy text; jrn uuid; bank uuid; ctrl uuid; eid uuid; pay uuid;
  amt numeric; inbound boolean; inv_ctrl_line uuid; pay_ctrl_line uuid;
  inv_ctrl_func numeric; orig_rate numeric; relief_func numeric; bank_func numeric; fx_diff numeric;
  fx_gain uuid; fx_loss uuid;
begin
  select * into inv from public.invoices where id=p_invoice;
  if inv is null then raise exception 'invoice not found'; end if;
  if auth.uid() is not null and not public.can_write_company(inv.company_id) then raise exception 'not allowed'; end if;
  if inv.state<>'posted' then raise exception 'post the invoice first'; end if;
  cid := inv.company_id;
  select currency_code, org_id, fx_gain_account_id, fx_loss_account_id into co_ccy, oid, fx_gain, fx_loss from public.companies where id=cid;
  doc_ccy := coalesce(nullif(inv.currency_code,''), co_ccy);
  amt := least(p_amount, coalesce(inv.amount_residual, inv.amount_total));
  if amt is null or amt<=0 then raise exception 'nothing left to pay'; end if;
  inbound := inv.move_type like 'out_%';
  select id into jrn from public.journals where company_id=cid and code=coalesce(nullif(p_journal_code,''),'BNK');
  if jrn is null then select id into jrn from public.journals where company_id=cid and code='BNK'; end if;
  if jrn is null then raise exception 'This company has no bank journal. Add one in Accounting, Journals.'; end if;
  -- the account the money moved through: the one the caller names (a Counter till
  -- or bank account), otherwise the journal's own default account
  if p_cash_account is not null then
    select id into bank from public.accounts where id = p_cash_account and company_id = cid;
    if bank is null then raise exception 'The cash or bank account chosen does not belong to this company.'; end if;
  else
    select default_account_id into bank from public.journals where id=jrn;
    if bank is null then select id into bank from public.accounts where company_id=cid and code='5100'; end if;
  end if;
  if bank is null then raise exception 'The payment journal has no bank or cash account. Set its default account in Accounting, Journals, or choose the account the money moved through.'; end if;
  ctrl := public.company_account(cid, case when inbound then 'receivable' else 'payable' end);
  if ctrl is null then raise exception '%', case when inbound then 'No receivable account is set for this company. Choose one in Settings, Companies, Accounting accounts.' else 'No payable account is set for this company. Choose one in Settings, Companies, Accounting accounts.' end; end if;
  select coalesce(sum(debit+credit),0) into inv_ctrl_func from public.journal_lines where entry_id=inv.journal_entry_id and account_id=ctrl;
  orig_rate := case when coalesce(inv.amount_total,0)=0 then 1 else inv_ctrl_func / inv.amount_total end;
  relief_func := round(amt * orig_rate, 2);
  bank_func := round(public.fx_convert(oid, amt, doc_ccy, co_ccy, p_date, 'spot'), 2);
  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,p_date,coalesce(p_ref,''),'Payment '||coalesce(inv.number,''),doc_ccy,'draft','payment',p_invoice::text) returning id into eid;
  if inbound then
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,bank,'Bank receipt',bank_func,0,bank_func,co_ccy);
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,ctrl,inv.partner_id,'Receivable settled',0,relief_func,-amt,doc_ccy) returning id into pay_ctrl_line;
    fx_diff := bank_func - relief_func;
    if fx_diff > 0.004 and fx_gain is not null then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,fx_gain,'FX gain '||coalesce(inv.number,''),0,fx_diff);
    elsif fx_diff < -0.004 and fx_loss is not null then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,fx_loss,'FX loss '||coalesce(inv.number,''),-fx_diff,0); end if;
  else
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,ctrl,inv.partner_id,'Payable settled',relief_func,0,amt,doc_ccy) returning id into pay_ctrl_line;
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,bank,'Bank payment',0,bank_func,-bank_func,co_ccy);
    fx_diff := relief_func - bank_func;
    if fx_diff > 0.004 and fx_gain is not null then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,fx_gain,'FX gain '||coalesce(inv.number,''),0,fx_diff);
    elsif fx_diff < -0.004 and fx_loss is not null then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,fx_loss,'FX loss '||coalesce(inv.number,''),-fx_diff,0); end if;
  end if;
  perform public.post_entry(eid);
  insert into public.payments(company_id,journal_id,partner_id,entry_id,payment_type,date,amount,currency_code,amount_company,memo,reference,state)
    values (cid,jrn,inv.partner_id,eid,(case when inbound then 'inbound' else 'outbound' end),p_date,amt,doc_ccy,bank_func,'Payment for '||coalesce(inv.number,''),coalesce(p_ref,''),'posted') returning id into pay;
  select id into inv_ctrl_line from public.journal_lines where entry_id=inv.journal_entry_id and account_id=ctrl limit 1;
  if inv_ctrl_line is not null then
    if inbound then insert into public.partial_reconciles(company_id,debit_line_id,credit_line_id,amount) values (cid, inv_ctrl_line, pay_ctrl_line, amt);
    else insert into public.partial_reconciles(company_id,debit_line_id,credit_line_id,amount) values (cid, pay_ctrl_line, inv_ctrl_line, amt); end if;
  end if;
  update public.invoices set amount_residual = coalesce(amount_residual, amount_total) - amt,
    payment_state = case when coalesce(amount_residual, amount_total) - amt <= 0.005 then 'paid' else 'partial' end
    where id=p_invoice;
  return pay;
end; $function$;
revoke all on function public.register_payment(uuid, numeric, date, text, text, text, uuid) from public, anon;
grant execute on function public.register_payment(uuid, numeric, date, text, text, text, uuid) to authenticated, service_role;

-- every journal entry a movement created, and what it looked like before each edit
alter table public.cash_movements add column if not exists entry_ids uuid[] not null default '{}';
alter table public.cash_movements add column if not exists revisions jsonb not null default '[]'::jsonb;
