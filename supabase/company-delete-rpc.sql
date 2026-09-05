-- ============================================================================
--  Orbit ERP  -  Safe "delete an empty company" RPC (powers the Delete button
--  in Settings > Companies). Paste into the Supabase SQL editor and Run once.
--
--  Safe by design:
--   * SECURITY DEFINER + can_write_company() check (only owners/admins).
--   * REFUSES to delete a company that has any real data (journal entries,
--     contacts, products, employees, or cash movements) - it raises a clear
--     message telling you to keep it.
--   * Runs as ONE transaction: it deletes only the setup-seeded config
--     (chart of accounts, journals, taxes, cash accounts, payment methods,
--     appointment settings) and then the company. If anything unexpected still
--     references the company, the whole thing rolls back and nothing changes.
-- ============================================================================

create or replace function public.delete_company_empty(p_company uuid)
returns void language plpgsql security definer set search_path=public as $$
declare n int;
begin
  if not public.can_write_company(p_company) then raise exception 'not allowed'; end if;

  select count(*) into n from public.journal_entries where company_id = p_company;
  if n > 0 then raise exception 'This company has % accounting entries - it can''t be deleted (keep it, or export first).', n; end if;
  select count(*) into n from public.partners where company_id = p_company;
  if n > 0 then raise exception 'This company has % contacts - it can''t be deleted.', n; end if;
  select count(*) into n from public.products where company_id = p_company;
  if n > 0 then raise exception 'This company has % products - it can''t be deleted.', n; end if;
  select count(*) into n from public.hr_employees where company_id = p_company;
  if n > 0 then raise exception 'This company has % employees - it can''t be deleted.', n; end if;
  select count(*) into n from public.cash_movements where company_id = p_company;
  if n > 0 then raise exception 'This company has % cash movements - it can''t be deleted.', n; end if;

  -- only setup-seeded config remains; remove it (FK-safe order), then the company
  delete from public.taxes           where company_id = p_company;
  delete from public.journals        where company_id = p_company;
  delete from public.accounts        where company_id = p_company;
  delete from public.cash_accounts   where company_id = p_company;
  delete from public.payment_methods where company_id = p_company;
  delete from public.appt_settings   where company_id = p_company;
  delete from public.companies       where id = p_company;
end $$;
grant execute on function public.delete_company_empty(uuid) to authenticated;

select 'delete_company_empty ready' as done;
