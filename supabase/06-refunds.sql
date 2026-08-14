-- ============================================================================
--  Spacework ERP  -  CREDIT NOTES / REFUNDS  (run AFTER 01-05)
--  Rewrites post_invoice() to handle all four move types. Refunds reverse the
--  normal invoice entry so revenue/AR (or expense/AP) move the opposite way.
--    out_invoice : Dr 4100 AR      / Cr 7xxx income / Cr 4457 VAT collected
--    out_refund  : Cr 4100 AR      / Dr 7xxx income / Dr 4457 VAT collected
--    in_invoice  : Dr 6xxx expense / Dr 4456 VAT ded / Cr 4000 AP
--    in_refund   : Cr 6xxx expense / Cr 4456 VAT ded / Dr 4000 AP
--  Still routed through post_entry() so it can never post out of balance.
-- ============================================================================
create or replace function public.post_invoice(p_invoice uuid)
returns uuid language plpgsql security definer set search_path=public as $fn$
declare inv record; cid uuid; jrn uuid; eid uuid; untax numeric:=0; tax numeric:=0; l record;
  ar uuid; ap uuid; vatc uuid; vatd uuid; ctrl uuid; is_cust boolean; is_refund boolean;
begin
  select * into inv from public.invoices where id=p_invoice;
  if inv is null then raise exception 'invoice not found'; end if;
  if auth.uid() is not null and not public.can_write_company(inv.company_id) then raise exception 'not allowed'; end if;
  if inv.state='posted' then return inv.journal_entry_id; end if;
  cid := inv.company_id;
  is_cust   := inv.move_type like 'out_%';
  is_refund := inv.move_type like '%refund';
  select id into ar   from public.accounts where company_id=cid and code='4100';
  select id into ap   from public.accounts where company_id=cid and code='4000';
  select id into vatc from public.accounts where company_id=cid and code='4457';
  select id into vatd from public.accounts where company_id=cid and code='4456';
  select coalesce(sum(price_subtotal),0),
         coalesce(sum(price_subtotal * coalesce((select amount from public.taxes t where t.id=il.tax_id),0)/100),0)
    into untax, tax from public.invoice_lines il where il.invoice_id=p_invoice;
  select id into jrn from public.journals where company_id=cid and code=(case when is_cust then 'INV' else 'BILL' end);
  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,inv.invoice_date,inv.number,coalesce(inv.number,'')||' entry',inv.currency_code,'draft','invoice',p_invoice::text)
    returning id into eid;

  if is_cust then
    ctrl := ar;
    if not is_refund then
      insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,date_maturity)
        values (eid,cid,ctrl,inv.partner_id,'Receivable',untax+tax,0,inv.due_date);
      for l in select il.*, coalesce(il.account_id,(select id from public.accounts where company_id=cid and code='7000')) as acc
               from public.invoice_lines il where il.invoice_id=p_invoice loop
        insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,analytic_distribution)
          values (eid,cid,l.acc,l.name,0,l.price_subtotal,(case when l.analytic_account_id is not null then jsonb_build_object(l.analytic_account_id::text, 100) else '{}'::jsonb end));
      end loop;
      if tax<>0 then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,vatc,'VAT collected',0,tax); end if;
    else
      insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,date_maturity)
        values (eid,cid,ctrl,inv.partner_id,'Receivable (credit note)',0,untax+tax,inv.due_date);
      for l in select il.*, coalesce(il.account_id,(select id from public.accounts where company_id=cid and code='7000')) as acc
               from public.invoice_lines il where il.invoice_id=p_invoice loop
        insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,analytic_distribution)
          values (eid,cid,l.acc,l.name,l.price_subtotal,0,(case when l.analytic_account_id is not null then jsonb_build_object(l.analytic_account_id::text, 100) else '{}'::jsonb end));
      end loop;
      if tax<>0 then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,vatc,'VAT collected (reversed)',tax,0); end if;
    end if;
  else
    ctrl := ap;
    if not is_refund then
      for l in select il.*, coalesce(il.account_id,(select id from public.accounts where company_id=cid and code='6000')) as acc
               from public.invoice_lines il where il.invoice_id=p_invoice loop
        insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,analytic_distribution)
          values (eid,cid,l.acc,l.name,l.price_subtotal,0,(case when l.analytic_account_id is not null then jsonb_build_object(l.analytic_account_id::text, 100) else '{}'::jsonb end));
      end loop;
      if tax<>0 then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,vatd,'VAT deductible',tax,0); end if;
      insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,date_maturity)
        values (eid,cid,ctrl,inv.partner_id,'Payable',0,untax+tax,inv.due_date);
    else
      for l in select il.*, coalesce(il.account_id,(select id from public.accounts where company_id=cid and code='6000')) as acc
               from public.invoice_lines il where il.invoice_id=p_invoice loop
        insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,analytic_distribution)
          values (eid,cid,l.acc,l.name,0,l.price_subtotal,(case when l.analytic_account_id is not null then jsonb_build_object(l.analytic_account_id::text, 100) else '{}'::jsonb end));
      end loop;
      if tax<>0 then insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,vatd,'VAT deductible (reversed)',0,tax); end if;
      insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,date_maturity)
        values (eid,cid,ctrl,inv.partner_id,'Payable (debit note)',untax+tax,0,inv.due_date);
    end if;
  end if;

  perform public.post_entry(eid);
  update public.invoices set state='posted', journal_entry_id=eid, amount_untaxed=untax, amount_tax=tax,
    amount_total=untax+tax, amount_residual=untax+tax, payment_state='not_paid' where id=p_invoice;
  return eid;
end; $fn$;
grant execute on function public.post_invoice(uuid) to authenticated;
