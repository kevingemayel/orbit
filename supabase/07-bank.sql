-- ============================================================================
--  Spacework ERP  -  BANK STATEMENTS + RECONCILIATION  (run AFTER 01-06)
--  A bank statement holds lines (money in +, money out -). Reconciling a line
--  posts a balanced GL entry Dr/Cr Bank vs a chosen counterpart account and
--  marks the line reconciled. Company-scoped RLS like the other op tables.
-- ============================================================================
create table if not exists public.bank_statements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  journal_id uuid references public.journals(id) on delete set null,
  name text not null,
  statement_date date default current_date,
  balance_start numeric(20,4) default 0,
  balance_end numeric(20,4) default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create table if not exists public.bank_statement_lines (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.bank_statements(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  line_date date default current_date,
  label text default '',
  amount numeric(20,4) default 0,                 -- + money in, - money out
  partner_id uuid references public.partners(id) on delete set null,
  counterpart_account_id uuid references public.accounts(id) on delete set null,
  is_reconciled boolean default false,
  entry_id uuid references public.journal_entries(id) on delete set null
);
create index if not exists idx_bs_company on public.bank_statements(company_id, statement_date);
create index if not exists idx_bsl_stmt on public.bank_statement_lines(statement_id);

alter table public.bank_statements enable row level security;
alter table public.bank_statement_lines enable row level security;
drop policy if exists bs_r on public.bank_statements;
create policy bs_r on public.bank_statements for select using (company_id in (select public.my_company_ids()));
drop policy if exists bs_w on public.bank_statements;
create policy bs_w on public.bank_statements for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));
drop policy if exists bsl_r on public.bank_statement_lines;
create policy bsl_r on public.bank_statement_lines for select using (company_id in (select public.my_company_ids()));
drop policy if exists bsl_w on public.bank_statement_lines;
create policy bsl_w on public.bank_statement_lines for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

create or replace function public.reconcile_bank_line(p_line uuid, p_account uuid, p_journal_code text default 'BNK')
returns uuid language plpgsql security definer set search_path=public as $fn$
declare ln record; cid uuid; jrn uuid; bank uuid; eid uuid; amt numeric; inbound boolean;
begin
  select * into ln from public.bank_statement_lines where id=p_line;
  if ln is null then raise exception 'line not found'; end if;
  if auth.uid() is not null and not public.can_write_company(ln.company_id) then raise exception 'not allowed'; end if;
  if ln.is_reconciled then return ln.entry_id; end if;
  if p_account is null then raise exception 'pick a counterpart account'; end if;
  cid := ln.company_id; amt := abs(ln.amount); inbound := ln.amount >= 0;
  select id, default_account_id into jrn, bank from public.journals where company_id=cid and code=coalesce(nullif(p_journal_code,''),'BNK');
  if jrn is null then select id, default_account_id into jrn, bank from public.journals where company_id=cid and code='BNK'; end if;
  if bank is null then select id into bank from public.accounts where company_id=cid and code='5100'; end if;
  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,ln.line_date,'',coalesce(nullif(ln.label,''),'Bank line'),(select currency_code from public.companies where id=cid),'draft','bank',p_line::text)
    returning id into eid;
  if inbound then
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,bank,ln.label,amt,0);
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit) values (eid,cid,p_account,ln.partner_id,ln.label,0,amt);
  else
    insert into public.journal_lines(entry_id,company_id,account_id,partner_id,label,debit,credit) values (eid,cid,p_account,ln.partner_id,ln.label,amt,0);
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit) values (eid,cid,bank,ln.label,0,amt);
  end if;
  perform public.post_entry(eid);
  update public.bank_statement_lines set is_reconciled=true, counterpart_account_id=p_account, entry_id=eid where id=p_line;
  return eid;
end; $fn$;
grant execute on function public.reconcile_bank_line(uuid,uuid,text) to authenticated;
