-- 227: the cancelled deposit receipt goes, so S00021 has one invoice and only one.
--
-- Kevin, twice: one invoice, not two. 226 took the 1,500 receipt out of the
-- ledger and left it in the list as a cancelled document; he still sees two.
--
-- There is nothing left in it to keep: no ledger entry, no payment, no money.
-- The 1,500 is a payment on INV/2026/00003, the revenue is the invoice's
-- 10,000, and the receipt was never a document Space Work issued from Orbit at
-- all - it arrived in yesterday's import as Odoo's way of recording a deposit.
--
-- What survives: the snapshot 226 wrote into document_revisions, which holds
-- the whole document, its line and its journal lines as they were, and the
-- original record in Odoo. Nothing of the company's money history depends on
-- the row itself.
do $t$
declare v_co uuid; rec public.invoices;
begin
  select id into v_co from public.companies where name = 'Space Work S.A.R.L';
  select * into rec from public.invoices where number = 'INV/2026/00002' and company_id = v_co;
  if rec.id is null then raise notice 'already gone'; return; end if;
  if rec.state <> 'cancel' then raise exception 'INV/2026/00002 is %, not cancelled: stopping rather than deleting a live document', rec.state; end if;
  if rec.journal_entry_id is not null then raise exception 'INV/2026/00002 still has a ledger entry: stopping'; end if;

  delete from public.invoice_lines where invoice_id = rec.id;
  delete from public.invoices where id = rec.id;
end $t$;

-- what S00021 has now, and what the books say
select 'invoices on the order' as what, count(*)::text as n,
       coalesce(string_agg(i.number || ' ' || i.state, '; '), '-') as detail
from public.invoices i
where i.sale_order_id = (select id from public.sale_orders where number = 'S00021'
   and company_id = (select id from public.companies where name = 'Space Work S.A.R.L'))
union all
select 'the invoice', i.number, i.amount_total || ' total, ' || i.amount_residual || ' due, ' || i.payment_state
from public.invoices i
where i.sale_order_id = (select id from public.sale_orders where number = 'S00021'
   and company_id = (select id from public.companies where name = 'Space Work S.A.R.L'))
union all
select 'kept in the document history', count(*)::text, string_agg(r.doc_number || ': ' || r.reason, ' / ')
from public.document_revisions r
where r.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
  and r.doc_number = 'INV/2026/00002';
