-- ============================================================================
-- 185-pos-voucher-unique-code.sql
--
-- Why: Point of Sale > Vouchers let two vouchers share one code. The Register
-- then could not tell them apart (its lookup expected one row and reported "No
-- active voucher with that code."). The app now refuses a repeated code, ignoring
-- capital letters; this index is the database backstop for two people adding the
-- same code at the same moment. The app turns its unique-violation error (23505)
-- into a plain message.
--
-- A company that already holds duplicate codes would make the index fail, so it
-- is only created when there are none; otherwise a notice names the fix and the
-- rest of the database is untouched. Re-run after renaming the duplicates.
--
-- Safe to re-run.
-- ============================================================================

do $$
begin
  if exists (
    select 1 from public.pos_vouchers
    group by company_id, lower(btrim(code))
    having count(*) > 1
  ) then
    raise notice 'Skipped the unique voucher code index: some company has two vouchers with the same code. Rename or delete the duplicates in Point of Sale, Vouchers, then run this file again.';
  else
    create unique index if not exists pos_vouchers_company_code_uniq
      on public.pos_vouchers (company_id, lower(btrim(code)));
  end if;
end $$;

select '185 voucher codes unique per company' as done;
