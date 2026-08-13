-- ============================================================================
--  Spacework ERP  -  PAYMENTS + RECONCILIATION  (run AFTER 01-04)
--  register_payment(): pay/receive against a posted invoice or bill.
--  Customer invoice -> Dr Bank / Cr Receivable.  Vendor bill -> Dr Payable / Cr Bank.
--  Posts a balanced entry, records the payment, links a partial_reconcile against
--  the invoice's control line, and updates the invoice residual + payment_state.
-- ============================================================================
create or replace function public.register_payment(p_invoice uuid, p_amount numeric, p_date date default current_date, p_journal_code text default 'BNK', p_method text default 'bank', p_ref text default '')
returns uuid language plpgsql security definer set search_path=public as $fn$
declare inv record; cid uuid; jrn uuid; bank uuid; ctrl uuid; eid uuid; pay uuid; amt numeric; inbound boolean; inv_ctrl_line uuid; pay_ctrl_line uuid;
begin
  select * into inv from public.invoices where id=p_invoice;
  if inv is null then raise exception 'invoice not found'; end if;
  if auth.uid() is not null and not public.can_write_company(inv.company_id) then raise exception 'not allowed'; end if;
  if inv.state<>'posted' then raise exception 'post the invoice first'; end if;
  cid := inv.company_id;
  amt := least(p_amount, coalesce(inv.amount_residual, inv.amount_total));
  if amt is null or amt<=0 then raise exception 'nothing left to pay'; end if;
  inbound := inv.move_type like 'out_%';
  select id into jrn from public.journals where company_id=cid and code=coalesce(nullif(p_journal_code,''),'BNK');
  if jrn is null then select id into jrn from public.journals where company_id=cid and code='BNK'; end if;
  select default_account_id into bank from public.journals where id=jrn;
  if bank is null then select id into bank from public.accounts where company_id=cid and code='5100'; end if;
  select id into ctrl from public.accounts where company_id=cid and code=(case when inbound then '4100' else '4000' end);
  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,p_date,coalesce(p_ref,''),'Payment '||coalesce(inv.number,''),inv.currency_code,'draft','payment',p_invoice::text) returning id into eid;
  if inbound then
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,bank,'Bank receipt',amt,0);
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit) values (eid,cid,ctrl,inv.partner_id,'Receivable settled',0,amt) returning id into pay_ctrl_line;
  else
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit) values (eid,cid,ctrl,inv.partner_id,'Payable settled',amt,0) returning id into pay_ctrl_line;
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,bank,'Bank payment',0,amt);
  end if;
  perform public.post_entry(eid);
  insert into public.payments(company_id,journal_id,partner_id,entry_id,payment_type,date,amount,currency_code,amount_company,memo,reference,state)
    values (cid,jrn,inv.partner_id,eid,(case when inbound then 'inbound' else 'outbound' end),p_date,amt,inv.currency_code,amt,'Payment for '||coalesce(inv.number,''),coalesce(p_ref,''),'posted') returning id into pay;
  select id into inv_ctrl_line from public.journal_lines where entry_id=inv.journal_entry_id and account_id=ctrl limit 1;
  if inv_ctrl_line is not null then
    if inbound then insert into public.partial_reconciles(company_id,debit_line_id,credit_line_id,amount) values (cid, inv_ctrl_line, pay_ctrl_line, amt);
    else insert into public.partial_reconciles(company_id,debit_line_id,credit_line_id,amount) values (cid, pay_ctrl_line, inv_ctrl_line, amt); end if;
  end if;
  update public.invoices set amount_residual = coalesce(amount_residual, amount_total) - amt,
    payment_state = case when coalesce(amount_residual, amount_total) - amt <= 0.005 then 'paid' else 'partial' end
    where id=p_invoice;
  return pay;
end; $fn$;
grant execute on function public.register_payment(uuid,numeric,date,text,text,text) to authenticated;
