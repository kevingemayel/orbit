-- ============================================================================
--  Remove the throwaway "ZZ VAT Test UAE" company created only to verify the
--  country-aware VAT setup. Paste into the Supabase SQL editor (orbit project)
--  and Run. Optional - the company is harmless if you'd rather leave it.
--
--  Safe by design: it only touches this ONE company id and its own company-
--  scoped rows (chart of accounts, journals, taxes, appointment settings). It
--  does NOT touch org-level currencies (those are shared). The whole thing runs
--  as one transaction, so if anything unexpected still references the company it
--  rolls back cleanly and changes nothing (then tell me and I'll extend it).
-- ============================================================================
do $$
declare cid uuid := '2840fef3-da10-43c3-a373-3ed99cff130c';  -- ZZ VAT Test UAE
begin
  delete from public.taxes         where company_id = cid;
  delete from public.journals      where company_id = cid;
  delete from public.accounts      where company_id = cid;
  delete from public.appt_settings where company_id = cid;
  delete from public.companies     where id = cid;
  raise notice 'ZZ VAT Test UAE removed';
end $$;
