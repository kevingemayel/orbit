-- 224: a line worth less than nothing posts on the other side.
--
-- post_invoice put every invoice line on one fixed side: revenue credited on a
-- customer invoice, expense debited on a bill. A line with a NEGATIVE amount
-- then tried to write a negative credit, and journal_lines refuses that (check
-- one_side: debit >= 0, credit >= 0, never both). The whole document failed to
-- post, with a constraint name for an error message.
--
-- That is not an edge case. A quotation closed below its list price carries a
-- discount line; an invoice that follows a down payment carries the deposit as
-- a deduction; a rebate, a retention release and a credit for a short delivery
-- all do the same thing. Orbit even ships a product called Discount.
--
-- The amount does not change. The sign decides the side: a negative revenue
-- line debits revenue instead of crediting a negative, and the entry still
-- balances against the same receivable. Every existing document is made of
-- positive lines, so nothing already posted moves.

CREATE OR REPLACE FUNCTION public.post_invoice(p_invoice uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare inv record; cid uuid; oid uuid; co_ccy text; doc_ccy text; rdate date;
  jrn uuid; eid uuid; l record; ar uuid; ap uuid; vatc uuid; vatd uuid; ctrl uuid; vat uuid;
  untax numeric:=0; tax numeric:=0; ctrl_func numeric:=0; lf numeric; tf numeric; sdr numeric;
  is_cust boolean; is_refund boolean; line_dr boolean; ctrl_dr boolean; ctrl_label text;
  rev record; settled numeric := 0; ctrl_line uuid; pl record;
begin
  select * into inv from public.invoices where id=p_invoice;
  if inv is null then raise exception 'invoice not found'; end if;
  if auth.uid() is not null and not public.can_write_company(inv.company_id) then raise exception 'not allowed'; end if;
  if inv.state='posted' then return inv.journal_entry_id; end if;
  cid := inv.company_id;
  select currency_code, org_id into co_ccy, oid from public.companies where id=cid;
  doc_ccy := coalesce(nullif(inv.currency_code,''), co_ccy);
  rdate := inv.invoice_date;
  is_cust   := inv.move_type like 'out_%';
  is_refund := inv.move_type like '%refund';
  line_dr := (is_cust = is_refund);
  ctrl_dr := not line_dr;
  ar   := public.company_account(cid, 'receivable');
  ap   := public.company_account(cid, 'payable');
  vatc := public.company_account(cid, 'sale_tax');
  vatd := public.company_account(cid, 'purchase_tax');
  ctrl := case when is_cust then ar else ap end;
  vat  := case when is_cust then vatc else vatd end;
  if ctrl is null then raise exception '%', case when is_cust then 'No receivable account is set for this company. Choose one in Settings, Companies, Accounting accounts.' else 'No payable account is set for this company. Choose one in Settings, Companies, Accounting accounts.' end; end if;
  ctrl_label := case
    when is_cust and not is_refund then 'Receivable'
    when is_cust and is_refund     then 'Receivable (credit note)'
    when not is_cust and not is_refund then 'Payable'
    else 'Payable (debit note)' end;
  select coalesce(sum(price_subtotal),0),
         coalesce(sum(price_subtotal * coalesce((select amount from public.taxes t where t.id=il.tax_id),0)/100),0)
    into untax, tax from public.invoice_lines il
   where il.invoice_id=p_invoice and coalesce(il.line_type,'item') = 'item';
  select id into jrn from public.journals where company_id=cid and code=(case when is_cust then 'INV' else 'BILL' end);
  if jrn is null then select id into jrn from public.journals where company_id=cid and type=(case when is_cust then 'sale' else 'purchase' end) order by code limit 1; end if;
  if jrn is null then raise exception '%', case when is_cust then 'This company has no sales journal. Add one in Accounting, Journals.' else 'This company has no purchase journal. Add one in Accounting, Journals.' end; end if;
  -- a document reopened with Edit kept its entry row, so it keeps its number
  select id into eid from public.journal_entries where id = inv.journal_entry_id and state = 'draft';
  if eid is not null then
    delete from public.journal_lines where entry_id = eid;
    update public.journal_entries set journal_id = jrn, date = rdate, ref = inv.number, narration = coalesce(inv.number,'')||' entry',
      currency_code = doc_ccy, book_id = coalesce(inv.book_id, book_id) where id = eid;
  else
    insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
      values (cid,jrn,rdate,inv.number,coalesce(inv.number,'')||' entry',doc_ccy,'draft','invoice',p_invoice::text)
      returning id into eid;
  end if;
  for l in select il.*,
             coalesce(il.account_id, public.company_account(cid, case when is_cust then 'income' else 'expense' end)) as acc
           from public.invoice_lines il
           where il.invoice_id=p_invoice and coalesce(il.line_type,'item') = 'item' loop
    if l.acc is null then raise exception 'The line "%" has no account, and this company has no default % account. Choose an account on the line, or set one in Settings, Companies, Accounting accounts.', coalesce(l.name, ''), case when is_cust then 'income' else 'expense' end; end if;
    lf := round(public.fx_convert(oid, coalesce(l.price_subtotal,0), doc_ccy, co_ccy, rdate, 'spot'), 2);
    ctrl_func := ctrl_func + lf;
    -- A line can be worth less than nothing: a discount line, a down payment
    -- already taken, a rebate. The amount is the same, it is simply on the other
    -- side of the ledger, and journal_lines refuses a negative debit or credit
    -- (check one_side). So the sign decides the side instead of the value.
    sdr := case when line_dr then lf else -lf end;
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code,analytic_distribution)
      values (eid,cid,l.acc,l.name,
              case when sdr > 0 then sdr else 0 end,
              case when sdr < 0 then -sdr else 0 end,
              case when line_dr then coalesce(l.price_subtotal,0) else -coalesce(l.price_subtotal,0) end,
              doc_ccy,
              case when l.analytic_account_id is not null then jsonb_build_object(l.analytic_account_id::text,100) else '{}'::jsonb end);
  end loop;
  if tax<>0 then
    if vat is null then raise exception '%', case when is_cust then 'This document carries VAT but no sales VAT account is set. Choose one in Settings, Companies, Accounting accounts.' else 'This document carries VAT but no purchase VAT account is set. Choose one in Settings, Companies, Accounting accounts.' end; end if;
    tf := round(public.fx_convert(oid, tax, doc_ccy, co_ccy, rdate, 'spot'), 2);
    ctrl_func := ctrl_func + tf;
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code)
      values (eid,cid,vat,(case when is_cust then 'VAT collected' else 'VAT deductible' end),
              case when line_dr then tf else 0 end,
              case when line_dr then 0 else tf end,
              case when line_dr then tax else -tax end,
              doc_ccy);
  end if;
  insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit,amount_currency,currency_code,date_maturity)
    values (eid,cid,ctrl,inv.partner_id,ctrl_label,
            case when ctrl_dr then ctrl_func else 0 end,
            case when ctrl_dr then 0 else ctrl_func end,
            case when ctrl_dr then (untax+tax) else -(untax+tax) end,
            doc_ccy,inv.due_date);
  perform public.post_entry(eid);
  -- what was paid before it was reopened stays paid
  select r.id, coalesce((r.snapshot->>'settled')::numeric, 0) as settled,
         r.snapshot->'invoice'->>'partner_id' as partner_id,
         coalesce(nullif(r.snapshot->'invoice'->>'currency_code', ''), co_ccy) as currency_code
    into rev from public.document_revisions r
   where r.doc_type = 'invoice' and r.doc_id = p_invoice and r.reposted_at is null
   order by r.created_at desc limit 1;
  if rev.id is not null then
    settled := rev.settled;
    if settled > 0.005 then
      if rev.partner_id is distinct from inv.partner_id::text then
        raise exception '% % is already paid on %, by the contact it had before. Keep that contact, or reverse those payments first.', rev.currency_code, to_char(settled, 'FM999,999,999,990.00'), coalesce(inv.number, 'this document');
      end if;
      if rev.currency_code is distinct from doc_ccy then
        raise exception '% % is already paid on %. Keep it in %, or reverse those payments first.', rev.currency_code, to_char(settled, 'FM999,999,999,990.00'), coalesce(inv.number, 'this document'), rev.currency_code;
      end if;
      if settled > untax + tax + 0.005 then
        raise exception '% % is already paid on %, more than its new total of % %. Raise the total, or reverse a payment first.', doc_ccy, to_char(settled, 'FM999,999,999,990.00'), coalesce(inv.number, 'this document'), doc_ccy, to_char(untax + tax, 'FM999,999,999,990.00');
      end if;
    end if;
    update public.document_revisions set reposted_at = now() where doc_type = 'invoice' and doc_id = p_invoice and reposted_at is null;
  end if;
  update public.invoices set state='posted', journal_entry_id=eid, amount_untaxed=untax, amount_tax=tax,
    amount_total=untax+tax, amount_residual=round(untax+tax-settled, 2),
    payment_state = case when settled <= 0.005 then 'not_paid' when untax+tax-settled <= 0.005 then 'paid' else 'partial' end
    where id=p_invoice;
  -- payments registered against it are matched to the new entry again
  if settled > 0.005 then
    select id into ctrl_line from public.journal_lines where entry_id = eid and account_id = ctrl limit 1;
    if ctrl_line is not null then
      for pl in select jl.id, p.amount from public.payments p
                  join public.journal_entries pe on pe.id = p.entry_id
                  join public.journal_lines jl on jl.entry_id = pe.id and jl.account_id = ctrl
                 where pe.source_type = 'payment' and pe.source_id = p_invoice::text and p.company_id = cid loop
        insert into public.partial_reconciles(company_id, debit_line_id, credit_line_id, amount)
        values (cid, case when ctrl_dr then ctrl_line else pl.id end, case when ctrl_dr then pl.id else ctrl_line end, pl.amount);
      end loop;
    end if;
  end if;
  return eid;
end; $function$
;

select 'a negative line now picks its side' as done;
