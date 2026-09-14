-- ============================================================================
-- 171-company-accounts-and-voucher-numbers.sql
--
-- Three things a company needs from its books and did not get.
--
-- 1. Posting found accounts by code. A bill posted the supplier to 4000, the
--    VAT to 4456 and the expense to 6000, whatever chart the company keeps.
--    ALGECO keeps its own chart, where suppliers are 4011, so the lookup came
--    back empty and the bill failed with "a required field is missing". The
--    company now names its receivable, payable, sales VAT, purchase VAT,
--    default income and default expense accounts. The codes are only the
--    fallback, and a missing account says which one and where to set it.
--    (The payment and bank functions are repaired the same way by the apply
--    script, which rewrites their lookups in place.)
-- 2. Journal entries had a number column that nothing filled. Every entry is
--    numbered as it is saved: JV/2026/0001 for a voucher typed by hand, the
--    journal's code for the ones Orbit posts (BILL/2026/0001, BNK/2026/0001).
--    Settings, Document numbering can change the voucher prefix.
-- 3. A voucher line in another currency keeps the rate it was entered at.
-- ============================================================================

alter table public.companies add column if not exists receivable_account_id   uuid references public.accounts(id) on delete set null;
alter table public.companies add column if not exists payable_account_id      uuid references public.accounts(id) on delete set null;
alter table public.companies add column if not exists sale_tax_account_id     uuid references public.accounts(id) on delete set null;
alter table public.companies add column if not exists purchase_tax_account_id uuid references public.accounts(id) on delete set null;
alter table public.companies add column if not exists income_account_id       uuid references public.accounts(id) on delete set null;
alter table public.companies add column if not exists expense_account_id      uuid references public.accounts(id) on delete set null;

-- the company's own choice first, the seeded code only as a fallback
create or replace function public.company_account(p_company uuid, p_kind text)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case p_kind
              when 'receivable'   then c.receivable_account_id
              when 'payable'      then c.payable_account_id
              when 'sale_tax'     then c.sale_tax_account_id
              when 'purchase_tax' then c.purchase_tax_account_id
              when 'income'       then c.income_account_id
              when 'expense'      then c.expense_account_id
            end
       from public.companies c where c.id = p_company),
    (select a.id from public.accounts a
      where a.company_id = p_company
        and a.code = case p_kind
                       when 'receivable' then '4100' when 'payable' then '4000'
                       when 'sale_tax' then '4457' when 'purchase_tax' then '4456'
                       when 'income' then '7000' when 'expense' then '6000'
                     end
      limit 1));
$$;
grant execute on function public.company_account(uuid, text) to authenticated;

-- every company on the seeded chart keeps posting exactly where it did
update public.companies c set
  receivable_account_id   = coalesce(c.receivable_account_id,   (select a.id from public.accounts a where a.company_id = c.id and a.code = '4100' limit 1)),
  payable_account_id      = coalesce(c.payable_account_id,      (select a.id from public.accounts a where a.company_id = c.id and a.code = '4000' limit 1)),
  sale_tax_account_id     = coalesce(c.sale_tax_account_id,     (select a.id from public.accounts a where a.company_id = c.id and a.code = '4457' limit 1)),
  purchase_tax_account_id = coalesce(c.purchase_tax_account_id, (select a.id from public.accounts a where a.company_id = c.id and a.code = '4456' limit 1)),
  income_account_id       = coalesce(c.income_account_id,       (select a.id from public.accounts a where a.company_id = c.id and a.code = '7000' limit 1)),
  expense_account_id      = coalesce(c.expense_account_id,      (select a.id from public.accounts a where a.company_id = c.id and a.code = '6000' limit 1));

-- ALGECO keeps its own Lebanese chart
update public.companies c set
  receivable_account_id   = coalesce(c.receivable_account_id,   (select a.id from public.accounts a where a.company_id = c.id and a.code = '4111')),
  payable_account_id      = coalesce(c.payable_account_id,      (select a.id from public.accounts a where a.company_id = c.id and a.code = '4011')),
  sale_tax_account_id     = coalesce(c.sale_tax_account_id,     (select a.id from public.accounts a where a.company_id = c.id and a.code = '44217')),
  purchase_tax_account_id = coalesce(c.purchase_tax_account_id, (select a.id from public.accounts a where a.company_id = c.id and a.code = '44210')),
  income_account_id       = coalesce(c.income_account_id,       (select a.id from public.accounts a where a.company_id = c.id and a.code = '7011')),
  expense_account_id      = coalesce(c.expense_account_id,      (select a.id from public.accounts a where a.company_id = c.id and a.code = '6011'))
 where c.id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1';

-- the rate a foreign line was entered at: company currency per one unit
alter table public.journal_lines add column if not exists fx_rate numeric;

-- ---- numbering -------------------------------------------------------------
create or replace function public.je_next_number(p_company uuid, p_journal uuid, p_source text, p_date date)
returns text language plpgsql security definer set search_path = public as $fn$
declare pfx text; jcode text; seqr public.number_sequences; pad int := 4; useyr boolean := true; base text; n bigint;
begin
  select code into jcode from public.journals where id = p_journal;
  pfx := case when coalesce(nullif(p_source, ''), 'manual') = 'manual' then 'JV' else coalesce(nullif(jcode, ''), 'JE') end;
  select * into seqr from public.number_sequences where company_id = p_company and doc_type = pfx limit 1;
  if seqr.id is not null then
    pad := coalesce(seqr.padding, 4);
    useyr := coalesce(seqr.use_year, true);
    pfx := coalesce(nullif(seqr.prefix, ''), pfx);
  end if;
  base := pfx || case when useyr then '/' || to_char(coalesce(p_date, current_date), 'YYYY') else '' end || '/';
  perform pg_advisory_xact_lock(hashtext(p_company::text || '|' || base));
  select coalesce(max(nullif(regexp_replace(substr(entry_number, length(base) + 1), '[^0-9]', '', 'g'), '')::bigint), 0) + 1 into n
    from public.journal_entries
   where company_id = p_company and left(entry_number, length(base)) = base;
  return base || case when length(n::text) >= pad then n::text else lpad(n::text, pad, '0') end;
end $fn$;

create or replace function public.je_set_number()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.entry_number is null or new.entry_number = '' then
    new.entry_number := public.je_next_number(new.company_id, new.journal_id, new.source_type, new.date);
  end if;
  return new;
end $fn$;
drop trigger if exists je_number on public.journal_entries;
create trigger je_number before insert on public.journal_entries
  for each row execute function public.je_set_number();

-- number the entries saved before today, oldest first, company by company
do $bf$
declare r record;
begin
  for r in select id, company_id, journal_id, source_type, date
             from public.journal_entries
            where entry_number is null or entry_number = ''
            order by company_id, date, created_at loop
    update public.journal_entries
       set entry_number = public.je_next_number(r.company_id, r.journal_id, r.source_type, r.date)
     where id = r.id;
  end loop;
end $bf$;

create unique index if not exists journal_entries_number_uq
  on public.journal_entries (company_id, entry_number) where entry_number is not null;
