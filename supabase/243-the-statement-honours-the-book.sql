-- 243  The emailed statement honours the chosen book
--
-- partner_statement had no book filter, so on a company that keeps statutory and
-- management books the emailed statement mixed both. The screen has always
-- filtered, which is exactly the failure the "every ledger report honours the
-- selected book" check exists to catch: one report that forgets shows a number
-- that looks right and is not. The check reads the app, and this was in SQL, so
-- it went through.
--
-- The book is the last argument and defaults to null, meaning every book, which
-- is what a company with one book wants and what the money tests already call.

-- @chunk
-- the four-argument version goes, or a call with four arguments is ambiguous
-- between it and the new one
drop function if exists public.partner_statement(uuid, uuid, date, date);
drop function if exists public.partner_statement(uuid, uuid, date, date, uuid);

create or replace function public.partner_statement(
  p_company uuid, p_partner uuid, p_from date, p_to date, p_book uuid default null)
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
       and (p_book is null or e.book_id = p_book)
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

grant execute on function public.partner_statement(uuid, uuid, date, date, uuid) to authenticated;
