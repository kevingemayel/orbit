-- 226: one invoice for Francois Eid, showing 1,500 of it paid.
--
-- Kevin: "also for francois i prefer to keep it one invoice now two and to show
-- that the 10,000 invoice is partially paid".
--
-- 223 had the deal on two documents, the way Odoo kept it: a 1,500 sales
-- receipt for the deposit and a 10,000 invoice that deducted that deposit back
-- out, leaving 8,500 to ask for. The money came out right, the paperwork did
-- not: a customer who is sent one quotation expects one invoice.
--
-- So the 10,000 goes back to being the whole invoice, and the 1,500 becomes
-- what it actually is, a payment against it:
--
--   INV/2026/00003   10,000 invoiced, 1,500 paid, 8,500 outstanding, part paid
--   INV/2026/00002   the deposit receipt, cancelled, out of the ledger
--   the cash         still 1,500, banked once, now matched to the invoice
--
-- Nothing is deleted. The receipt keeps its number and its place in the list,
-- marked cancelled, and its ledger entry is emptied through the same reopen
-- path Edit uses, so no revenue is counted twice and no reversal pair clutters
-- the accounts. The 1,500 payment is registered again against the invoice,
-- dated the day it was received.

-- @chunk
-- the invoice asks for the whole 10,000 again
do $t$
declare
  v_co uuid; inv public.invoices; e public.journal_entries; settled numeric; v_line uuid;
begin
  select id into v_co from public.companies where name = 'Space Work S.A.R.L';
  select * into inv from public.invoices where number = 'INV/2026/00003' and company_id = v_co;
  if inv.id is null then raise exception 'INV/2026/00003 is not in this database'; end if;
  select * into e from public.journal_entries where id = inv.journal_entry_id;

  settled := round(coalesce(inv.amount_total, 0) - coalesce(inv.amount_residual, inv.amount_total, 0), 2);
  insert into public.document_revisions (company_id, doc_type, doc_id, doc_number, reason, snapshot)
  values (v_co, 'invoice', inv.id, inv.number,
    'One invoice for the whole 10,000, with the 1,500 deposit shown as a payment instead of a deduction',
    jsonb_build_object('invoice', to_jsonb(inv),
      'lines', coalesce((select jsonb_agg(to_jsonb(il) order by il.sequence, il.id)
                           from public.invoice_lines il where il.invoice_id = inv.id), '[]'::jsonb),
      'entry', case when e.id is null then null else to_jsonb(e) end,
      'entry_lines', coalesce((select jsonb_agg(to_jsonb(jl) order by jl.id)
                                 from public.journal_lines jl where jl.entry_id = e.id), '[]'::jsonb)));

  if e.id is not null and e.state = 'posted' then
    perform set_config('orbit.reopen_entry', e.id::text, true);
    update public.journal_entries set state = 'draft', posted_at = null where id = e.id;
    perform set_config('orbit.reopen_entry', '', true);
  end if;
  if e.id is not null then delete from public.journal_lines where entry_id = e.id; end if;
  perform set_config('orbit.reopen_invoice', inv.id::text, true);
  update public.invoices set state = 'draft' where id = inv.id;
  perform set_config('orbit.reopen_invoice', '', true);

  -- the deduction line goes: the deposit is a payment, not a discount
  delete from public.invoice_lines
   where invoice_id = inv.id
     and name like 'Less down payment received%';

  update public.invoices set amount_untaxed = 10000, amount_tax = 0, amount_total = 10000,
                             amount_residual = 10000, payment_state = 'not_paid'
   where id = inv.id;

  perform public.post_invoice(inv.id);
end $t$;

-- @chunk
-- the deposit receipt steps out of the ledger, keeping its number
do $t$
declare
  v_co uuid; rec public.invoices; e public.journal_entries; pay record; pent public.journal_entries;
begin
  select id into v_co from public.companies where name = 'Space Work S.A.R.L';
  select * into rec from public.invoices where number = 'INV/2026/00002' and company_id = v_co;
  if rec.id is null then raise notice 'the deposit receipt is already gone'; return; end if;

  -- the payment that settled it: unmatch it, empty its entry, remove it. The same
  -- 1,500 is registered against the invoice in the next step, so the cash is
  -- recorded once, not twice.
  select p.* into pay from public.payments p
   where p.company_id = v_co and p.date = rec.invoice_date and p.amount = rec.amount_total
     and p.memo = 'Payment for ' || rec.number
   limit 1;
  if pay.id is not null then
    delete from public.partial_reconciles pr
     where pr.debit_line_id in (select id from public.journal_lines where entry_id = pay.entry_id)
        or pr.credit_line_id in (select id from public.journal_lines where entry_id = pay.entry_id);
    select * into pent from public.journal_entries where id = pay.entry_id;
    if pent.id is not null then
      if pent.state = 'posted' then
        perform set_config('orbit.reopen_entry', pent.id::text, true);
        update public.journal_entries set state = 'draft', posted_at = null where id = pent.id;
        perform set_config('orbit.reopen_entry', '', true);
      end if;
      delete from public.journal_lines where entry_id = pent.id;
      delete from public.payments where id = pay.id;
      delete from public.journal_entries where id = pent.id;
    else
      delete from public.payments where id = pay.id;
    end if;
  end if;

  -- and the receipt itself: emptied out of the ledger, kept as a cancelled document
  insert into public.document_revisions (company_id, doc_type, doc_id, doc_number, reason, snapshot)
  values (v_co, 'invoice', rec.id, rec.number,
    'Cancelled: the deposit it recorded is now a payment on INV/2026/00003',
    jsonb_build_object('invoice', to_jsonb(rec),
      'lines', coalesce((select jsonb_agg(to_jsonb(il) order by il.sequence, il.id)
                           from public.invoice_lines il where il.invoice_id = rec.id), '[]'::jsonb),
      'entry_lines', coalesce((select jsonb_agg(to_jsonb(jl) order by jl.id)
                                 from public.journal_lines jl where jl.entry_id = rec.journal_entry_id), '[]'::jsonb)));

  select * into e from public.journal_entries where id = rec.journal_entry_id;
  if e.id is not null then
    delete from public.partial_reconciles pr
     where pr.debit_line_id in (select id from public.journal_lines where entry_id = e.id)
        or pr.credit_line_id in (select id from public.journal_lines where entry_id = e.id);
    if e.state = 'posted' then
      perform set_config('orbit.reopen_entry', e.id::text, true);
      update public.journal_entries set state = 'draft', posted_at = null where id = e.id;
      perform set_config('orbit.reopen_entry', '', true);
    end if;
    delete from public.journal_lines where entry_id = e.id;
  end if;

  perform set_config('orbit.reopen_invoice', rec.id::text, true);
  update public.invoices set state = 'draft' where id = rec.id;
  perform set_config('orbit.reopen_invoice', '', true);
  update public.invoices
     set state = 'cancel', amount_residual = 0, payment_state = 'not_paid', journal_entry_id = null
   where id = rec.id;
  if e.id is not null then delete from public.journal_entries where id = e.id; end if;
end $t$;

-- @chunk
-- the 1,500 is a payment on the invoice, dated the day it came in
do $t$
declare v_co uuid; v_inv uuid;
begin
  select id into v_co from public.companies where name = 'Space Work S.A.R.L';
  select id into v_inv from public.invoices where number = 'INV/2026/00003' and company_id = v_co;
  perform public.register_payment(v_inv, 1500, date '2026-10-07', 'CSH', 'cash',
                                  'Down payment on signature, S00021');
end $t$;

-- @chunk
select i.number, i.move_type, i.state, i.amount_total, i.amount_residual, i.payment_state
from public.invoices i
where i.number in ('INV/2026/00002', 'INV/2026/00003')
  and i.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
order by i.number;

-- @chunk
select a.code, left(a.name, 26) as account, sum(jl.debit) as debit, sum(jl.credit) as credit
from public.journal_lines jl
join public.accounts a on a.id = jl.account_id
join public.journal_entries e on e.id = jl.entry_id
where e.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
  and e.ref like '%2026/0000[23]%' or e.source_id in (
    select id::text from public.invoices
     where number in ('INV/2026/00002', 'INV/2026/00003')
       and company_id = (select id from public.companies where name = 'Space Work S.A.R.L'))
group by a.code, a.name
order by a.code;
