-- ============================================================================
-- 176-jv-journal.sql  -  a Journal Voucher journal in every company.
--
-- The journals were Customer Invoices, Vendor Bills, Bank, Cash and
-- Miscellaneous. A general voucher that is none of those had to be filed
-- under Miscellaneous. Every company now also has JV (Journal Voucher), the
-- voucher screen opens on it, and a company created later gets it too: the
-- company setup functions all create a MISC journal, and this trigger adds
-- JV beside it, so no setup function needs rewriting.
-- ============================================================================
insert into public.journals (company_id, code, name, type, default_account_id, seq_prefix)
select c.id, 'JV', 'Journal Voucher', 'general', null, 'JV/'
  from public.companies c
on conflict (company_id, code) do nothing;

create or replace function public.journals_add_jv()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.code = 'MISC' then
    insert into public.journals (company_id, code, name, type, default_account_id, seq_prefix)
    values (new.company_id, 'JV', 'Journal Voucher', 'general', null, 'JV/')
    on conflict (company_id, code) do nothing;
  end if;
  return new;
end $fn$;
revoke all on function public.journals_add_jv() from public, anon, authenticated;

drop trigger if exists trg_journals_add_jv on public.journals;
create trigger trg_journals_add_jv after insert on public.journals
  for each row execute function public.journals_add_jv();
