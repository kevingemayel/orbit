-- 200: a ledger entry can only be written by an app that owns that kind of entry.
--
-- 191 gated the ledger tables by "can this role write in ANY app that posts", which is
-- how the roles model was honest about its one weak spot: a cashier with Work in the
-- cash desk could write a manual journal voucher straight through the API, and a sales
-- role could write a payroll entry. Every entry already records what made it, in
-- source_type, so the gate can ask the real question: does this person work in the app
-- that owns this kind of entry. The posting functions (post_entry, post_invoice,
-- register_payment and the rest) run with the database's own rights and are unaffected;
-- this only governs rows written directly through the API, which is what the screens do
-- for vouchers, stock, expenses, payslips, retention, cash movements and labour.
-- Safe to re-run.

create or replace function public.je_source_apps(p_src text) returns text[]
  language sql immutable set search_path = public as $fn$
  select case lower(coalesce(nullif(btrim(p_src), ''), 'manual'))
    when 'manual'            then array['accounting']
    when 'depreciation'      then array['accounting','inventory']
    when 'fx_revaluation'    then array['accounting']
    when 'stock'             then array['accounting','inventory']
    when 'material_issue'    then array['accounting','inventory','projects','site','manufacturing']
    when 'expense'           then array['accounting','employees']
    when 'payslip'           then array['accounting','employees']
    when 'retention'         then array['accounting','projects','site']
    when 'retention_release' then array['accounting','projects','site']
    when 'install_labour'    then array['accounting','installation','site','projects']
    when 'cash_movement'     then array['accounting','counter']
    when 'cash_void'         then array['accounting','counter']
    when 'cash_handover'     then array['accounting','counter']
    when 'advance'           then array['accounting','counter','sales']
    when 'invoice'           then array['accounting','sales','purchase','plot','events','appoint','service','projects','site']
    when 'payment'           then array['accounting','sales','purchase','counter','plot']
    else array['accounting']
  end
$fn$;
revoke all on function public.je_source_apps(text) from public, anon;
grant execute on function public.je_source_apps(text) to authenticated, service_role;

-- the entry itself
drop policy if exists rg_src_i on public.journal_entries;
drop policy if exists rg_src_u on public.journal_entries;
drop policy if exists rg_src_d on public.journal_entries;
create policy rg_src_i on public.journal_entries as restrictive for insert
  with check (public.can_write_app(company_id, public.je_source_apps(source_type)));
create policy rg_src_u on public.journal_entries as restrictive for update
  using (public.can_write_app(company_id, public.je_source_apps(source_type)))
  with check (public.can_write_app(company_id, public.je_source_apps(source_type)));
create policy rg_src_d on public.journal_entries as restrictive for delete
  using (public.can_write_app(company_id, public.je_source_apps(source_type)));

-- and its lines, which follow the entry they belong to
drop policy if exists rg_src_i on public.journal_lines;
drop policy if exists rg_src_u on public.journal_lines;
drop policy if exists rg_src_d on public.journal_lines;
create policy rg_src_i on public.journal_lines as restrictive for insert
  with check (exists (select 1 from public.journal_entries e where e.id = entry_id
                        and public.can_write_app(e.company_id, public.je_source_apps(e.source_type))));
create policy rg_src_u on public.journal_lines as restrictive for update
  using (exists (select 1 from public.journal_entries e where e.id = entry_id
                   and public.can_write_app(e.company_id, public.je_source_apps(e.source_type))))
  with check (exists (select 1 from public.journal_entries e where e.id = entry_id
                        and public.can_write_app(e.company_id, public.je_source_apps(e.source_type))));
create policy rg_src_d on public.journal_lines as restrictive for delete
  using (exists (select 1 from public.journal_entries e where e.id = entry_id
                   and public.can_write_app(e.company_id, public.je_source_apps(e.source_type))));
