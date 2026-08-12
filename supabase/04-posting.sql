-- ============================================================================
--  Spacework ERP  -  POSTING  (run AFTER 01-03)
--  post_invoice(): turn a draft invoice/bill into a BALANCED journal entry in
--  the General Ledger, then mark it posted. Customer invoice -> Dr Receivable /
--  Cr Income (+ Cr VAT collected). Vendor bill -> Dr Expense (+ Dr VAT) / Cr Payable.
--  Uses post_entry() so it can never post out of balance.
-- ============================================================================
create or replace function public.post_invoice(p_invoice uuid)
returns uuid language plpgsql security definer set search_path=public as $fn$
declare inv record; cid uuid; jrn uuid; eid uuid; untax numeric:=0; tax numeric:=0; l record; ar uuid; ap uuid; vatc uuid; vatd uuid;
begin
  select * into inv from public.invoices where id=p_invoice;
  if inv is null then raise exception 'invoice not found'; end if;
  if auth.uid() is not null and not public.can_write_company(inv.company_id) then raise exception 'not allowed'; end if;
  if inv.state='posted' then return inv.journal_entry_id; end if;
  cid := inv.company_id;
  select id into ar   from public.accounts where company_id=cid and code='4100';
  select id into ap   from public.accounts where company_id=cid and code='4000';
  select id into vatc from public.accounts where company_id=cid and code='4457';
  select id into vatd from public.accounts where company_id=cid and code='4456';
  select coalesce(sum(price_subtotal),0),
         coalesce(sum(price_subtotal * coalesce((select amount from public.taxes t where t.id=il.tax_id),0)/100),0)
    into untax, tax from public.invoice_lines il where il.invoice_id=p_invoice;
  select id into jrn from public.journals where company_id=cid and code=(case when inv.move_type like 'out_%' then 'INV' else 'BILL' end);
  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,inv.invoice_date,inv.number,'Invoice '||coalesce(inv.number,''),inv.currency_code,'draft','invoice',p_invoice::text)
    returning id into eid;
  if inv.move_type like 'out_%' then
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,date_maturity)
      values (eid,cid,ar,inv.partner_id,'Receivable',untax+tax,0,inv.due_date);
    for l in select il.*, coalesce(il.account_id,(select id from public.accounts where company_id=cid and code='7000')) as inc
             from public.invoice_lines il where il.invoice_id=p_invoice loop
      insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,analytic_distribution)
        values (eid,cid,l.inc,l.name,0,l.price_subtotal,coalesce(l.analytic_distribution,'{}'::jsonb));
    end loop;
    if tax<>0 then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,vatc,'VAT collected',0,tax); end if;
  else
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,date_maturity)
      values (eid,cid,ap,inv.partner_id,'Payable',0,untax+tax,inv.due_date);
    for l in select il.*, coalesce(il.account_id,(select id from public.accounts where company_id=cid and code='6000')) as exp
             from public.invoice_lines il where il.invoice_id=p_invoice loop
      insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,analytic_distribution)
        values (eid,cid,l.exp,l.name,l.price_subtotal,0,coalesce(l.analytic_distribution,'{}'::jsonb));
    end loop;
    if tax<>0 then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,vatd,'VAT deductible',tax,0); end if;
  end if;
  perform public.post_entry(eid);
  update public.invoices set state='posted', journal_entry_id=eid, amount_untaxed=untax, amount_tax=tax,
    amount_total=untax+tax, amount_residual=untax+tax, payment_state='not_paid' where id=p_invoice;
  return eid;
end; $fn$;
grant execute on function public.post_invoice(uuid) to authenticated;
