-- 242  The two documents a customer asks for after an invoice
--
-- Orbit could email an invoice and nothing else. A customer who pays wants a
-- receipt, and a customer with a running account wants a statement. The receipt
-- did not exist as a document at all: a payment had a record, an Edit and a
-- Reverse, and no piece of paper. The statement existed and printed, but there
-- was no way to send it.
--
-- Both are built the same way as everything else here: the document is worked
-- out in the database, so the screen, the printed page and the email are three
-- renderings of one answer rather than three answers.

-- @chunk
-- A receipt is a numbered document. Numbering it once and keeping the number
-- matters: a customer who is emailed the same receipt twice must get the same
-- paper, and an auditor must be able to ask for receipt 7 and be given one thing.
alter table public.payments add column if not exists receipt_no text;
alter table public.payments add column if not exists receipt_issued_at timestamptz;

create unique index if not exists payments_receipt_no_once
  on public.payments (company_id, receipt_no) where receipt_no is not null;

-- @chunk
-- next_doc_number knows where each kind of document is kept, and it did not know
-- about receipts. Everything else about it is unchanged.
create or replace function public.next_doc_number(p_company uuid, p_doc text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_code text; v_prefix text; v_pad int; v_year boolean; v_py text; v_max int := 0;
begin
  -- the sequence row is keyed by the document's code, not its move type
  v_code := case lower(coalesce(p_doc, ''))
              when 'out_invoice' then 'INV' when 'out_refund' then 'RINV'
              when 'in_invoice' then 'BILL' when 'in_refund' then 'RBILL'
              when 'sale_order' then 'SO' when 'purchase_order' then 'PO'
              when 'receipt' then 'RCT'
              else upper(coalesce(nullif(p_doc, ''), 'INV')) end;
  select coalesce(nullif(btrim(ns.prefix), ''), v_code), coalesce(ns.padding, 4), coalesce(ns.use_year, true)
    into v_prefix, v_pad, v_year
    from public.number_sequences ns
   where ns.company_id = p_company and ns.doc_type = v_code
   limit 1;
  v_prefix := coalesce(v_prefix, v_code);
  v_pad := coalesce(v_pad, 4);
  v_year := coalesce(v_year, true);
  v_py := v_prefix || case when v_year then '/' || to_char(current_date, 'YYYY') else '' end || '/';

  if v_code in ('INV', 'RINV', 'BILL', 'RBILL') then
    select coalesce(max((regexp_replace(i.number, '^.*?(\d+)\s*$', '\1'))::bigint), 0) into v_max
      from public.invoices i
     where i.company_id = p_company and i.number like v_py || '%'
       and i.number ~ '\d\s*$';
  elsif v_code = 'SO' then
    select coalesce(max((regexp_replace(o.number, '^.*?(\d+)\s*$', '\1'))::bigint), 0) into v_max
      from public.sale_orders o
     where o.company_id = p_company and o.number like v_py || '%'
       and o.number ~ '\d\s*$';
  elsif v_code = 'PO' then
    select coalesce(max((regexp_replace(o.number, '^.*?(\d+)\s*$', '\1'))::bigint), 0) into v_max
      from public.purchase_orders o
     where o.company_id = p_company and o.number like v_py || '%'
       and o.number ~ '\d\s*$';
  elsif v_code = 'RCT' then
    select coalesce(max((regexp_replace(p.receipt_no, '^.*?(\d+)\s*$', '\1'))::bigint), 0) into v_max
      from public.payments p
     where p.company_id = p_company and p.receipt_no like v_py || '%'
       and p.receipt_no ~ '\d\s*$';
  else
    raise exception 'next_doc_number does not know where % documents are kept.', v_code;
  end if;

  return v_py || lpad((v_max + 1)::text, greatest(v_pad, length((v_max + 1)::text)), '0');
end $fn$;

grant execute on function public.next_doc_number(uuid, text) to authenticated;

-- @chunk
-- Give every company a receipt sequence so the number reads like a document and
-- not like a database id. Idempotent, and it never touches a sequence already set.
insert into public.number_sequences (company_id, doc_type, label, prefix, padding, use_year)
select c.id, 'RCT', 'Receipts', 'RCT', 4, true
  from public.companies c
 where not exists (
   select 1 from public.number_sequences ns
    where ns.company_id = c.id and ns.doc_type = 'RCT');

-- @chunk
-- Issuing the number is a write, so it is gated like one, and it happens once.
-- A receipt is what you hand someone who paid you; there is no such thing as a
-- receipt for money you sent out, so asking for one says so plainly.
create or replace function public.payment_receipt_issue(p_payment uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare p record; v_no text;
begin
  select * into p from public.payments where id = p_payment;
  if p.id is null then raise exception 'That payment no longer exists.'; end if;
  -- execute is granted to authenticated only, so a caller always has a uid; the
  -- guard is written this way so the check runs for every real caller and the
  -- function is still callable from a migration or a scheduled job
  if auth.uid() is not null and not public.can_write_app(p.company_id, '{accounting}') then
    raise exception 'You do not have permission to issue a receipt in this company.';
  end if;
  if p.payment_type <> 'inbound' then
    raise exception 'A receipt is for money received. This is a payment out, so the other party issues the receipt.';
  end if;
  if coalesce(btrim(p.receipt_no), '') <> '' then return p.receipt_no; end if;

  v_no := public.next_doc_number(p.company_id, 'receipt');
  update public.payments
     set receipt_no = v_no, receipt_issued_at = now()
   where id = p_payment;
  return v_no;
end $fn$;

revoke all on function public.payment_receipt_issue(uuid) from public, anon;
grant execute on function public.payment_receipt_issue(uuid) to authenticated;

-- @chunk
-- Everything a receipt has to say, in one answer: who paid, how much, against
-- which invoice, what is left on that invoice, and what the account stands at
-- afterwards. Invoker rights, so a caller only ever sees their own company.
create or replace function public.payment_receipt(p_payment uuid)
returns jsonb
language plpgsql
stable
set search_path to 'public'
as $fn$
declare
  p record; co record; pt record; inv record; v_bal numeric := 0; v_inv_id uuid;
begin
  select * into p from public.payments where id = p_payment;
  if p.id is null then return null; end if;

  select id, name, profile, currency_code into co from public.companies where id = p.company_id;
  select name, email, phone, vat, street, city, country into pt
    from public.partners where id = p.partner_id;

  -- the entry a payment wrote points back at the invoice it settled
  -- source_id is free text on a journal entry, so it is only read as a key when it
  -- actually looks like one
  select e.source_id::uuid into v_inv_id
    from public.journal_entries e
   where e.id = p.entry_id and e.source_type = 'payment'
     and e.source_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  if v_inv_id is not null then
    select number, invoice_date, amount_total, amount_residual, currency_code
      into inv from public.invoices where id = v_inv_id;
  end if;

  -- what the account stands at, on the same basis the statement uses
  select coalesce(sum(l.debit - l.credit), 0) into v_bal
    from public.journal_lines l
    join public.journal_entries e on e.id = l.entry_id
   where l.company_id = p.company_id and l.partner_id = p.partner_id
     and e.state = 'posted';

  return jsonb_build_object(
    'payment', jsonb_build_object(
      'id', p.id, 'receipt_no', p.receipt_no, 'date', p.date, 'amount', p.amount,
      'currency_code', coalesce(p.currency_code, co.currency_code), 'method', p.method,
      'reference', p.reference, 'memo', p.memo, 'payer_name', p.payer_name,
      'payment_type', p.payment_type, 'state', p.state),
    'company', jsonb_build_object(
      'id', co.id, 'name', co.name, 'currency_code', co.currency_code,
      'legal_name', co.profile ->> 'legal_name', 'country', co.profile ->> 'country',
      'vat', co.profile ->> 'vat', 'address', co.profile ->> 'address',
      'email', co.profile ->> 'email', 'phone', co.profile ->> 'phone'),
    'partner', jsonb_build_object(
      'name', pt.name, 'email', pt.email, 'phone', pt.phone, 'vat', pt.vat,
      'street', pt.street, 'city', pt.city, 'country', pt.country),
    'invoice', case when inv.number is null then null else jsonb_build_object(
      'id', v_inv_id, 'number', inv.number, 'invoice_date', inv.invoice_date,
      'amount_total', inv.amount_total, 'amount_residual', inv.amount_residual,
      'currency_code', inv.currency_code) end,
    'account_balance', round(v_bal, 2));
end $fn$;

grant execute on function public.payment_receipt(uuid) to authenticated;

-- @chunk
-- The statement of account, as rows rather than as markup, so the screen, the
-- printed page and the email all read the same answer. Same basis the report has
-- always used: posted journal lines carrying the contact, anything before the
-- period collapsed into a balance brought forward.
-- the shape of the answer is part of the answer, so a changed column list replaces
-- the function rather than trying to patch it in place
drop function if exists public.partner_statement(uuid, uuid, date, date);
create or replace function public.partner_statement(
  p_company uuid, p_partner uuid, p_from date, p_to date)
returns table (
  seq int, row_kind text, doc_date date, doc_no text, entry_no text, doc_type text,
  description text, debit numeric, credit numeric, balance numeric)
language sql
stable
set search_path to 'public'
as $fn$
  with lines as (
    -- A statement is read against the customer's own papers, so the document column
    -- carries the number they hold: the invoice number, or the receipt number once
    -- one is issued. The journal's own entry number is kept beside it for whoever
    -- has to trace the row back into the ledger.
    select e.date as d,
           coalesce(iv.number, pm.receipt_no, e.entry_number) as doc_number,
           e.entry_number, e.ref, e.narration, e.source_type,
           j.name as journal_name, l.label, l.debit, l.credit, l.id as lid
      from public.journal_lines l
      join public.journal_entries e on e.id = l.entry_id
      left join public.journals j on j.id = e.journal_id
      -- source_id is free text and some entries carry an empty one, so the key is
      -- matched as text. A guard beside a cast is not a guard: the planner is free
      -- to try the cast first, and then one blank source_id anywhere in the
      -- database makes the statement fail for every contact.
      left join public.invoices iv
             on e.source_type = 'invoice'
            and iv.id::text = e.source_id
      left join public.payments pm on pm.entry_id = e.id
     where l.company_id = p_company and l.partner_id = p_partner
       and e.state = 'posted'
       and (p_to is null or e.date <= p_to)
  ), opening as (
    select coalesce(sum(debit - credit), 0) as bal
      from lines where p_from is not null and d < p_from
  ), moves as (
    -- On one date a charge is read before the payment that settles it. Ordering by
    -- the document number instead puts a cash receipt above the invoice it pays
    -- (CSH before INV), and the customer reads a credit balance that never existed.
    select row_number() over (
             order by d, case when coalesce(debit, 0) > 0 then 0 else 1 end, doc_number, lid) as rn,
           d, doc_number, entry_number, ref, narration, source_type, journal_name, label, debit, credit
      from lines
     where p_from is null or d >= p_from
  ), running as (
    select m.*, (select bal from opening)
             + sum(m.debit - m.credit) over (order by m.rn rows between unbounded preceding and current row) as bal
      from moves m
  )
  select 0, 'opening'::text, p_from, null::text, null::text, null::text,
         'Balance brought forward'::text,
         null::numeric, null::numeric, round((select bal from opening), 2)
  union all
  select r.rn::int, 'movement'::text, r.d, r.doc_number, r.entry_number,
         coalesce(nullif(r.journal_name, ''), case r.source_type
           when 'invoice' then 'Invoice or bill' when 'payment' then 'Payment'
           when 'expense' then 'Expense claim' when 'payslip' then 'Payroll'
           when 'stock' then 'Stock movement' when 'material_issue' then 'Material issue'
           when 'depreciation' then 'Depreciation' when 'retention' then 'Retention'
           when 'retention_release' then 'Retention release' when 'advance' then 'Advance recovery'
           when 'fx_revaluation' then 'Currency revaluation' when 'install_labour' then 'Installation labour'
           when 'cash_movement' then 'Counter movement' when 'cash_handover' then 'Counter handover'
           when 'cash_void' then 'Reversal' else 'Journal voucher' end),
         coalesce(nullif(r.label, ''), nullif(r.narration, ''), nullif(r.ref, ''), ''),
         nullif(r.debit, 0), nullif(r.credit, 0), round(r.bal, 2)
    from running r
  union all
  select 2147483646, 'total'::text, null::date, null::text, null::text, null::text,
         'Movements in the period'::text,
         round(coalesce((select sum(debit) from moves), 0), 2),
         round(coalesce((select sum(credit) from moves), 0), 2),
         round(coalesce((select sum(debit - credit) from moves), 0), 2)
  union all
  select 2147483647, 'closing'::text, p_to, null::text, null::text, null::text,
         'Balance carried forward'::text,
         null::numeric, null::numeric,
         round((select bal from opening) + coalesce((select sum(debit - credit) from moves), 0), 2)
  order by 1
$fn$;

grant execute on function public.partner_statement(uuid, uuid, date, date) to authenticated;

-- @chunk
-- Saving an address onto a contact so a document can be sent to it. Orbit only
-- emails an address the company already holds (email_on_file), which is the right
-- rule and was a dead end in practice: the send refused and told you to go and
-- edit the contact in another screen. Now the send box can put it on the contact
-- itself, which is the same permission check an edit of that contact would make.
create or replace function public.partner_email_set(p_partner uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_co uuid; v_clean text;
begin
  v_clean := lower(btrim(coalesce(p_email, '')));
  if v_clean !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception '% does not look like an email address.', coalesce(nullif(btrim(p_email), ''), '(blank)');
  end if;
  select company_id into v_co from public.partners where id = p_partner;
  if v_co is null then raise exception 'That contact no longer exists.'; end if;
  if not public.can_write_app(v_co, '{sales,accounting,purchase}') then
    raise exception 'You do not have permission to change this contact.';
  end if;
  update public.partners set email = v_clean, updated_at = now() where id = p_partner;
  return true;
end $fn$;

revoke all on function public.partner_email_set(uuid, text) from public, anon;
grant execute on function public.partner_email_set(uuid, text) to authenticated;
