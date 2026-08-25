-- ============================================================================
--  Spacework ERP  -  FX-AWARE POSTING (Phase 1) + REALIZED FX (Phase 2)  AFTER 74
--  post_invoice: convert every line from the document currency to the company's
--    FUNCTIONAL currency at the spot rate on the invoice date, storing debit/credit
--    in functional and the original signed amount in amount_currency/currency_code.
--    Same-currency invoices are unchanged (fx_convert short-circuits, no rate needed).
--  register_payment: relieve the receivable/payable at its ORIGINAL booked rate, take
--    the bank at the PAYMENT-date rate, and post the difference to the FX gain/loss
--    account (realized foreign-exchange). Multi-currency-safe and always balanced.
--  Both keep the invoice header amounts in the document currency (what the client sees).
-- ============================================================================

create or replace function public.post_invoice(p_invoice uuid)
returns uuid language plpgsql security definer set search_path=public as $fn$
declare inv record; cid uuid; oid uuid; co_ccy text; doc_ccy text; rdate date;
  jrn uuid; eid uuid; l record; ar uuid; ap uuid; vatc uuid; vatd uuid;
  untax numeric:=0; tax numeric:=0; ctrl_func numeric:=0; lf numeric; tf numeric; is_out boolean;
begin
  select * into inv from public.invoices where id=p_invoice;
  if inv is null then raise exception 'invoice not found'; end if;
  if auth.uid() is not null and not public.can_write_company(inv.company_id) then raise exception 'not allowed'; end if;
  if inv.state='posted' then return inv.journal_entry_id; end if;
  cid := inv.company_id;
  select currency_code, org_id into co_ccy, oid from public.companies where id=cid;
  doc_ccy := coalesce(nullif(inv.currency_code,''), co_ccy);
  rdate := inv.invoice_date;
  is_out := inv.move_type like 'out_%';
  select id into ar   from public.accounts where company_id=cid and code='4100';
  select id into ap   from public.accounts where company_id=cid and code='4000';
  select id into vatc from public.accounts where company_id=cid and code='4457';
  select id into vatd from public.accounts where company_id=cid and code='4456';
  select coalesce(sum(price_subtotal),0),
         coalesce(sum(price_subtotal * coalesce((select amount from public.taxes t where t.id=il.tax_id),0)/100),0)
    into untax, tax from public.invoice_lines il where il.invoice_id=p_invoice;
  select id into jrn from public.journals where company_id=cid and code=(case when is_out then 'INV' else 'BILL' end);
  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,rdate,inv.number,'Invoice '||coalesce(inv.number,''),doc_ccy,'draft','invoice',p_invoice::text)
    returning id into eid;
  for l in select il.*,
             coalesce(il.account_id,(select id from public.accounts where company_id=cid and code=(case when is_out then '7000' else '6000' end))) as acc
           from public.invoice_lines il where il.invoice_id=p_invoice loop
    lf := round(public.fx_convert(oid, coalesce(l.price_subtotal,0), doc_ccy, co_ccy, rdate, 'spot'), 2);
    ctrl_func := ctrl_func + lf;
    if is_out then
      insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code,analytic_distribution)
        values (eid,cid,l.acc,l.name,0,lf, -coalesce(l.price_subtotal,0), doc_ccy, coalesce(l.analytic_distribution,'{}'::jsonb));
    else
      insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code,analytic_distribution)
        values (eid,cid,l.acc,l.name,lf,0, coalesce(l.price_subtotal,0), doc_ccy, coalesce(l.analytic_distribution,'{}'::jsonb));
    end if;
  end loop;
  if tax<>0 then
    tf := round(public.fx_convert(oid, tax, doc_ccy, co_ccy, rdate, 'spot'), 2);
    ctrl_func := ctrl_func + tf;
    if is_out then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,vatc,'VAT collected',0,tf,-tax,doc_ccy);
    else insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,vatd,'VAT deductible',tf,0,tax,doc_ccy); end if;
  end if;
  if is_out then
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,amount_currency,currency_code,date_maturity)
      values (eid,cid,ar,inv.partner_id,'Receivable',ctrl_func,0,(untax+tax),doc_ccy,inv.due_date);
  else
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,amount_currency,currency_code,date_maturity)
      values (eid,cid,ap,inv.partner_id,'Payable',0,ctrl_func,-(untax+tax),doc_ccy,inv.due_date);
  end if;
  perform public.post_entry(eid);
  update public.invoices set state='posted', journal_entry_id=eid, amount_untaxed=untax, amount_tax=tax,
    amount_total=untax+tax, amount_residual=untax+tax, payment_state='not_paid' where id=p_invoice;
  return eid;
end; $fn$;
grant execute on function public.post_invoice(uuid) to authenticated;

create or replace function public.register_payment(p_invoice uuid, p_amount numeric, p_date date default current_date, p_journal_code text default 'BNK', p_method text default 'bank', p_ref text default '')
returns uuid language plpgsql security definer set search_path=public as $fn$
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
  select default_account_id into bank from public.journals where id=jrn;
  if bank is null then select id into bank from public.accounts where company_id=cid and code='5100'; end if;
  select id into ctrl from public.accounts where company_id=cid and code=(case when inbound then '4100' else '4000' end);
  -- original booked rate = the functional value the invoice recorded its control at, per doc unit
  select coalesce(sum(debit+credit),0) into inv_ctrl_func from public.journal_lines where entry_id=inv.journal_entry_id and account_id=ctrl;
  orig_rate := case when coalesce(inv.amount_total,0)=0 then 1 else inv_ctrl_func / inv.amount_total end;
  relief_func := round(amt * orig_rate, 2);
  bank_func := round(public.fx_convert(oid, amt, doc_ccy, co_ccy, p_date, 'spot'), 2);
  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,p_date,coalesce(p_ref,''),'Payment '||coalesce(inv.number,''),doc_ccy,'draft','payment',p_invoice::text) returning id into eid;
  if inbound then
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,bank,'Bank receipt',bank_func,0,bank_func,co_ccy);
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,ctrl,inv.partner_id,'Receivable settled',0,relief_func,-amt,doc_ccy) returning id into pay_ctrl_line;
    fx_diff := bank_func - relief_func;   -- +ve = received more functional than owed = gain
    if fx_diff > 0.004 and fx_gain is not null then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,fx_gain,'FX gain '||coalesce(inv.number,''),0,fx_diff);
    elsif fx_diff < -0.004 and fx_loss is not null then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,fx_loss,'FX loss '||coalesce(inv.number,''),-fx_diff,0); end if;
  else
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,ctrl,inv.partner_id,'Payable settled',relief_func,0,amt,doc_ccy) returning id into pay_ctrl_line;
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code) values (eid,cid,bank,'Bank payment',0,bank_func,-bank_func,co_ccy);
    fx_diff := relief_func - bank_func;   -- +ve = settled a bigger liability with less cash = gain
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
end; $fn$;
grant execute on function public.register_payment(uuid,numeric,date,text,text,text) to authenticated;

select 'fx posting ready' as done;
