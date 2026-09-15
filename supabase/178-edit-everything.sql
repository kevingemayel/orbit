-- ============================================================================
-- 178-edit-everything.sql  -  every posted transaction can be edited, and an
-- account says where its auxiliaries come from.
--
-- 1. Auxiliaries. Dolphin marks some accounts as taking their auxiliaries from
--    the contact register rather than from sub-accounts: at ALGECO these are 21
--    accounts, among them 4011 SUPPLIERS, 4111 CLIENTS and 4515 OTHER PARTNERS.
--    Their chart export lists no auxiliary rows for them, because the auxiliary
--    of such an account is a contact. accounts.aux_kind records which kind an
--    account uses, so the journal voucher offers contacts for those accounts
--    and the chosen contact is kept on the line.
--
-- 2. Edit on every journal entry. reopen_journal_entry refused any entry Orbit
--    had posted for another record, so a voucher typed by hand could be edited
--    and one from stock, payroll or depreciation could not. It now reopens any
--    entry, except the three owned by a document that has to change with it
--    (an invoice or bill, a payment, a Counter movement): those are edited from
--    that document, and the screen takes the user there.
--
-- 3. History for app-side edits. document_revisions accepts purchase and sales
--    orders, receipts, payments and Counter movements, written through
--    record_revision, which checks the caller may write to the company.
-- ============================================================================

-- 1. where an account's auxiliaries come from
alter table public.accounts add column if not exists aux_kind text;
alter table public.accounts drop constraint if exists accounts_aux_kind_check;
alter table public.accounts add constraint accounts_aux_kind_check check (aux_kind is null or aux_kind in ('accounts', 'contacts'));

update public.accounts set aux_kind = 'contacts'
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
   and code in ('4011','4031','4110','4111','4150','4190','421','4281','44210','44211','44213','44215','44216','44217','44218','44219','4428','4515','4611','4619','473');

update public.accounts p set aux_kind = 'accounts'
 where p.aux_kind is null
   and exists (select 1 from public.accounts c where c.parent_account_id = p.id and c.code like '%.%');

-- 3. more document types keep their history
alter table public.document_revisions drop constraint if exists document_revisions_doc_type_check;
alter table public.document_revisions add constraint document_revisions_doc_type_check
  check (doc_type in ('journal_entry', 'invoice', 'purchase_order', 'sale_order', 'stock_picking', 'payment', 'cash_movement'));

create or replace function public.record_revision(p_company uuid, p_doc_type text, p_doc_id uuid, p_doc_number text, p_snapshot jsonb, p_reason text default null)
returns uuid language plpgsql security definer set search_path = public as $fn$
declare rid uuid;
begin
  if not public.can_write_company(p_company) then
    raise exception 'Only an owner, administrator or accountant of this company can edit this document.';
  end if;
  if p_doc_type not in ('purchase_order', 'sale_order', 'stock_picking', 'payment', 'cash_movement') then
    raise exception 'Unknown document type %.', p_doc_type;
  end if;
  insert into public.document_revisions (company_id, doc_type, doc_id, doc_number, reason, snapshot, actor, actor_email, reposted_at)
  values (p_company, p_doc_type, p_doc_id, p_doc_number, nullif(btrim(coalesce(p_reason, '')), ''), coalesce(p_snapshot, '{}'::jsonb),
          auth.uid(), nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', now())
  returning id into rid;
  return rid;
end $fn$;
revoke all on function public.record_revision(uuid, text, uuid, text, jsonb, text) from public, anon;
grant execute on function public.record_revision(uuid, text, uuid, text, jsonb, text) to authenticated, service_role;

-- 2. any journal entry can be reopened, apart from the three a document owns
create or replace function public.reopen_journal_entry(p_entry uuid, p_reason text default null)
returns text language plpgsql security definer set search_path = public as $fn$
declare e public.journal_entries; lk date; doc text;
begin
  select * into e from public.journal_entries where id = p_entry;
  if e.id is null then raise exception 'This entry no longer exists.'; end if;
  if not public.can_write_company(e.company_id) then
    raise exception 'Only an owner, administrator or accountant of this company can edit a posted entry.';
  end if;
  if e.source_type = 'invoice' then
    select number into doc from public.invoices where id::text = e.source_id;
    raise exception 'This entry belongs to %. Edit that document, and its entry follows.', coalesce(doc, 'an invoice or bill');
  elsif e.source_type = 'payment' then
    raise exception 'This entry records a payment. Edit the payment, and its entry follows.';
  elsif e.source_type = 'cash_movement' then
    raise exception 'This entry was posted by the Counter. Edit the movement there, and its entry follows.';
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
