-- ============================================================================
-- 172-edit-posted-documents.sql  -  a posted voucher or bill can be edited.
--
-- Until now a posted journal voucher could only be reversed and a posted bill
-- or invoice only credited. Edit now takes either back to draft, the way
-- accountants expect, without losing what was posted:
--   * the posted version (header, lines, its ledger entry, what was already
--     paid) is written to document_revisions first, with who and when;
--   * the document keeps its number, and a bill keeps its ledger entry row, so
--     posting again fills the same entry and the number sequence has no gap;
--   * nothing dated inside a closed period can be reopened;
--   * a voucher matched to payments or a bank line must be unmatched first;
--     a bill's own payments stay recorded and are matched again on posting;
--   * entries Orbit posts for other records (payroll, stock, the cash desk)
--     are changed where they came from, not here.
-- Only reopen_journal_entry and reopen_invoice can set a posted document back
-- to draft. The guards refuse it from anywhere else, the API included.
-- ============================================================================

create table if not exists public.document_revisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  doc_type text not null check (doc_type in ('journal_entry', 'invoice')),
  doc_id uuid not null,
  doc_number text,
  reason text,
  snapshot jsonb not null,
  actor uuid,
  actor_email text,
  created_at timestamptz not null default now(),
  reposted_at timestamptz
);
create index if not exists document_revisions_doc_idx on public.document_revisions (doc_type, doc_id, created_at desc);
alter table public.document_revisions enable row level security;
drop policy if exists document_revisions_r on public.document_revisions;
create policy document_revisions_r on public.document_revisions for select
  using (company_id in (select public.my_company_ids()));
-- no write policy: rows are written only by the two reopen functions below
revoke insert, update, delete on public.document_revisions from anon, authenticated;

-- ---------------------------------------------------------------- the guards
create or replace function public.guard_posted_entry()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'DELETE' then
    -- the one exception: the whole company is being deleted (a discarded
    -- restore), and the entries are going with it through the cascade
    if old.state = 'posted' and exists (select 1 from public.companies c where c.id = old.company_id) then
      raise exception 'A posted entry cannot be deleted. Edit it or reverse it instead.';
    end if;
    return old;
  end if;
  if old.state = 'posted' then
    -- the one way back to draft is Edit, through reopen_journal_entry or
    -- reopen_invoice, which keep the posted version first
    if new.state = 'draft' and coalesce(current_setting('orbit.reopen_entry', true), '') = old.id::text then
      return new;
    end if;
    if new.state is distinct from old.state
       or new.date is distinct from old.date
       or new.journal_id is distinct from old.journal_id
       or new.book_id is distinct from old.book_id
       or new.company_id is distinct from old.company_id
       or new.currency_code is distinct from old.currency_code
       or new.posted_at is distinct from old.posted_at then
      raise exception 'A posted entry is changed with Edit, which keeps the posted version, or reversed. It cannot be changed directly.';
    end if;
  end if;
  return new;
end $fn$;

create or replace function public.guard_posted_invoice()
returns trigger language plpgsql set search_path to 'public' as $fn$
begin
  if TG_OP = 'DELETE' then
    if OLD.state = 'posted' then raise exception 'A posted invoice cannot be deleted. Cancel it or issue a credit note instead.'; end if;
    return OLD;
  end if;
  if OLD.state = 'posted' and NEW.state = 'draft' then
    if coalesce(current_setting('orbit.reopen_invoice', true), '') <> OLD.id::text then
      raise exception 'A posted document goes back to draft with Edit, which keeps the posted version. It cannot be set to draft directly.';
    end if;
    return NEW;
  end if;
  if OLD.state = 'posted' and (
        coalesce(NEW.amount_total,0)   is distinct from coalesce(OLD.amount_total,0)
     or coalesce(NEW.amount_untaxed,0) is distinct from coalesce(OLD.amount_untaxed,0)
     or NEW.partner_id   is distinct from OLD.partner_id
     or NEW.invoice_date is distinct from OLD.invoice_date
     or NEW.number       is distinct from OLD.number
     or NEW.move_type    is distinct from OLD.move_type
  ) then
    raise exception 'A posted document''s amounts, contact, date and number change with Edit, which keeps the posted version, or with a credit note.';
  end if;
  return NEW;
end $fn$;

-- ------------------------------------------------------ reopen a voucher
create or replace function public.reopen_journal_entry(p_entry uuid, p_reason text default null)
returns text language plpgsql security definer set search_path = public as $fn$
declare e public.journal_entries; lk date; doc text;
begin
  select * into e from public.journal_entries where id = p_entry;
  if e.id is null then raise exception 'This entry no longer exists.'; end if;
  if not public.can_write_company(e.company_id) then
    raise exception 'Only an owner, administrator or accountant of this company can edit a posted entry.';
  end if;
  -- an entry that belongs to another record says so first, posted or not
  if coalesce(nullif(e.source_type, ''), 'manual') <> 'manual' then
    if e.source_type = 'invoice' then
      select number into doc from public.invoices where id::text = e.source_id;
      raise exception 'This entry belongs to %. Edit that document, and its entry follows.', coalesce(doc, 'an invoice or bill');
    end if;
    raise exception 'Orbit posted this entry for a % record. Change that record, or reverse the entry.', replace(e.source_type, '_', ' ');
  end if;
  if e.state <> 'posted' then raise exception 'This entry is not posted, so it can be edited as it is.'; end if;
  select greatest(c.lock_date, c.period_lock_date) into lk from public.companies c where c.id = e.company_id;
  if lk is not null and e.date <= lk then
    raise exception 'The books are closed up to %, and this entry is dated %. Reverse it with a later date instead.', to_char(lk, 'DD Mon YYYY'), to_char(e.date, 'DD Mon YYYY');
  end if;
  if exists (select 1 from public.journal_lines jl where jl.entry_id = e.id and (jl.full_reconcile_id is not null
             or exists (select 1 from public.partial_reconciles pr where pr.debit_line_id = jl.id or pr.credit_line_id = jl.id))) then
    raise exception 'Lines of this entry are matched to payments or invoices. Undo that match first, or reverse the entry.';
  end if;
  if exists (select 1 from public.bank_statement_lines b where b.entry_id = e.id) then
    raise exception 'This entry is matched to a bank statement line. Undo that match in bank reconciliation first, or reverse the entry.';
  end if;
  insert into public.document_revisions (company_id, doc_type, doc_id, doc_number, reason, snapshot, actor, actor_email)
  values (e.company_id, 'journal_entry', e.id, e.entry_number, nullif(btrim(coalesce(p_reason, '')), ''),
    jsonb_build_object(
      'entry', to_jsonb(e),
      'lines', coalesce((select jsonb_agg(to_jsonb(jl) || jsonb_build_object('account', a.code || ' ' || a.name) order by jl.created_at, jl.id)
                           from public.journal_lines jl left join public.accounts a on a.id = jl.account_id
                          where jl.entry_id = e.id), '[]'::jsonb)),
    auth.uid(), nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email');
  perform set_config('orbit.reopen_entry', e.id::text, true);
  update public.journal_entries set state = 'draft', posted_at = null where id = e.id;
  perform set_config('orbit.reopen_entry', '', true);
  return e.entry_number;
end $fn$;
revoke all on function public.reopen_journal_entry(uuid, text) from public, anon;
grant execute on function public.reopen_journal_entry(uuid, text) to authenticated, service_role;

-- ------------------------------------------------ reopen a bill or invoice
create or replace function public.reopen_invoice(p_invoice uuid, p_reason text default null)
returns text language plpgsql security definer set search_path = public as $fn$
declare inv public.invoices; e public.journal_entries; lk date; noun text; settled numeric;
begin
  select * into inv from public.invoices where id = p_invoice;
  if inv.id is null then raise exception 'This document no longer exists.'; end if;
  noun := case inv.move_type when 'out_invoice' then 'invoice' when 'out_refund' then 'credit note'
            when 'in_invoice' then 'bill' when 'in_refund' then 'vendor credit note' else 'document' end;
  if not public.can_write_company(inv.company_id) then
    raise exception 'Only an owner, administrator or accountant of this company can edit a posted %.', noun;
  end if;
  if inv.state <> 'posted' then raise exception 'This % is not posted, so it can be edited as it is.', noun; end if;
  select greatest(c.lock_date, c.period_lock_date) into lk from public.companies c where c.id = inv.company_id;
  if lk is not null and inv.invoice_date <= lk then
    raise exception 'The books are closed up to %, and this % is dated %. Issue a credit note with a later date instead.', to_char(lk, 'DD Mon YYYY'), noun, to_char(inv.invoice_date, 'DD Mon YYYY');
  end if;
  if exists (select 1 from public.einvoice_docs d where d.invoice_id = inv.id and coalesce(d.status, '') not in ('', 'draft', 'failed', 'error', 'rejected')) then
    raise exception 'This % has been sent as an e-invoice, so it cannot change. Issue a credit note instead.', noun;
  end if;
  select * into e from public.journal_entries where id = inv.journal_entry_id;
  if e.id is not null and exists (select 1 from public.bank_statement_lines b where b.entry_id = e.id) then
    raise exception 'The ledger entry of this % is matched to a bank statement line. Undo that match in bank reconciliation first.', noun;
  end if;
  settled := round(coalesce(inv.amount_total, 0) - coalesce(inv.amount_residual, inv.amount_total, 0), 2);
  insert into public.document_revisions (company_id, doc_type, doc_id, doc_number, reason, snapshot, actor, actor_email)
  values (inv.company_id, 'invoice', inv.id, inv.number, nullif(btrim(coalesce(p_reason, '')), ''),
    jsonb_build_object(
      'invoice', to_jsonb(inv),
      'partner', (select p.name from public.partners p where p.id = inv.partner_id),
      'settled', settled,
      'lines', coalesce((select jsonb_agg(to_jsonb(il) || jsonb_build_object('account', a.code || ' ' || a.name, 'tax', t.name) order by il.sequence, il.id)
                           from public.invoice_lines il
                           left join public.accounts a on a.id = il.account_id
                           left join public.taxes t on t.id = il.tax_id
                          where il.invoice_id = inv.id), '[]'::jsonb),
      'entry', case when e.id is null then null else to_jsonb(e) end,
      'entry_lines', coalesce((select jsonb_agg(to_jsonb(jl) || jsonb_build_object('account', a.code || ' ' || a.name) order by jl.created_at, jl.id)
                                 from public.journal_lines jl left join public.accounts a on a.id = jl.account_id
                                where jl.entry_id = e.id), '[]'::jsonb)),
    auth.uid(), nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email');
  if e.id is not null then
    if e.state = 'posted' then
      perform set_config('orbit.reopen_entry', e.id::text, true);
      update public.journal_entries set state = 'draft', posted_at = null where id = e.id;
      perform set_config('orbit.reopen_entry', '', true);
    end if;
    -- the entry row stays, so it keeps its number; its lines go, and with
    -- them (by cascade) the matches to payments, which posting makes again
    delete from public.journal_lines where entry_id = e.id;
  end if;
  perform set_config('orbit.reopen_invoice', inv.id::text, true);
  update public.invoices set state = 'draft' where id = inv.id;
  perform set_config('orbit.reopen_invoice', '', true);
  return inv.number;
end $fn$;
revoke all on function public.reopen_invoice(uuid, text) from public, anon;
grant execute on function public.reopen_invoice(uuid, text) to authenticated, service_role;

-- ------------------------------------------------ posting marks the revision
create or replace function public.post_entry(p_entry uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $fn$ declare e record; d numeric; c numeric; n int; lk date; begin select * into e from public.journal_entries where id = p_entry; if e is null then raise exception 'entry not found'; end if; if auth.uid() is not null and not public.can_write_company(e.company_id) then raise exception 'not allowed'; end if; if e.state <> 'draft' then raise exception 'entry is not draft'; end if; select coalesce(sum(debit),0), coalesce(sum(credit),0), count(*) into d,c,n from public.journal_lines where entry_id = p_entry; if n < 2 then raise exception 'needs two lines'; end if; if abs(d - c) > 0.005 then raise exception 'entry not balanced: % <> %', d, c; end if; select period_lock_date into lk from public.companies where id = e.company_id; if lk is not null and e.date <= lk then raise exception 'period locked on %', lk; end if; update public.journal_entries set state='posted', posted_at=now() where id = p_entry; update public.document_revisions set reposted_at = now() where doc_type = 'journal_entry' and doc_id = p_entry and reposted_at is null; end; $fn$;

-- ------------------------------------ posting a bill reuses its reopened entry
create or replace function public.post_invoice(p_invoice uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare inv record; cid uuid; oid uuid; co_ccy text; doc_ccy text; rdate date;
  jrn uuid; eid uuid; l record; ar uuid; ap uuid; vatc uuid; vatd uuid; ctrl uuid; vat uuid;
  untax numeric:=0; tax numeric:=0; ctrl_func numeric:=0; lf numeric; tf numeric;
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
    into untax, tax from public.invoice_lines il where il.invoice_id=p_invoice;
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
           from public.invoice_lines il where il.invoice_id=p_invoice loop
    if l.acc is null then raise exception 'The line "%" has no account, and this company has no default % account. Choose an account on the line, or set one in Settings, Companies, Accounting accounts.', coalesce(l.name, ''), case when is_cust then 'income' else 'expense' end; end if;
    lf := round(public.fx_convert(oid, coalesce(l.price_subtotal,0), doc_ccy, co_ccy, rdate, 'spot'), 2);
    ctrl_func := ctrl_func + lf;
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code,analytic_distribution)
      values (eid,cid,l.acc,l.name,
              case when line_dr then lf else 0 end,
              case when line_dr then 0 else lf end,
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
end; $function$;
