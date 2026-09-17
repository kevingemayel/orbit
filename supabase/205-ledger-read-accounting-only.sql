-- 205: reading the general ledger needs Accounting, not Insights.
--
-- 204 let the ledger be read by Accounting or Insights, on the grounds that reports read
-- it. Testing on the pilot company showed what that means in practice: a sales role with
-- Accounting set to None still read all 17 vouchers, because the same role carries
-- Insights at View. The reports that need the ledger (trial balance, profit and loss,
-- balance sheet) go through functions that run with the database's own rights and do
-- their own company check, so they keep working. Reading raw ledger rows now needs
-- Accounting.
-- Safe to re-run.

drop policy if exists rg_sel on public.journal_entries;
create policy rg_sel on public.journal_entries as restrictive for select to authenticated
  using (company_id in (select public.my_view_company_ids('{accounting}'::text[])));

drop policy if exists rg_sel on public.journal_lines;
create policy rg_sel on public.journal_lines as restrictive for select to authenticated
  using (company_id in (select public.my_view_company_ids('{accounting}'::text[])));
