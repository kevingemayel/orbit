-- ============================================================================
--  Orbit ERP  -  Country-aware company setup (chart of accounts + VAT)
--  setup_company used to hardcode the Lebanon COA template + Lebanon VAT 11%
--  for every new company. Now it picks a country-specific chart-of-accounts
--  template when one exists (falls back to the universal chart) and seeds the
--  correct VAT rate for the company's country. The account STRUCTURE is the
--  same solid SMB/construction chart across countries; add distinct statutory
--  templates (e.g. FR PCG, DE SKR) as rows in coa_templates to specialise.
--  Idempotent: safe to re-run; taxes are only seeded when none exist yet.
-- ============================================================================

create or replace function public.setup_company(p_company uuid, p_template uuid default null)
returns void language plpgsql security definer set search_path=public as $$
declare tmpl uuid; cur text; ctry text; vat_rate numeric; vat_name text;
begin
  if auth.uid() is not null and not public.can_write_company(p_company) then raise exception 'not allowed'; end if;
  select currency_code, lower(coalesce(country,'')) into cur, ctry from public.companies where id=p_company;

  -- pick a country-specific COA template if one exists, else the universal (LB) chart
  tmpl := coalesce(
    p_template,
    (select id from public.coa_templates where lower(country) = ctry and org_id is null limit 1),
    (select id from public.coa_templates where country='LB' and org_id is null limit 1));

  insert into public.accounts(company_id, code, name, type_code, reconcilable)
  select p_company, l.code, l.name, l.type_code, l.reconcilable
  from public.coa_template_lines l where l.template_id = tmpl
  on conflict (company_id, code) do nothing;

  update public.companies c set
    retained_earnings_account_id = (select id from public.accounts where company_id=p_company and code='1100'),
    current_earnings_account_id  = (select id from public.accounts where company_id=p_company and code='1200'),
    fx_gain_account_id           = (select id from public.accounts where company_id=p_company and code='7660'),
    fx_loss_account_id           = (select id from public.accounts where company_id=p_company and code='6660')
  where c.id = p_company;

  insert into public.journals(company_id, code, name, type, default_account_id, seq_prefix)
  values
    (p_company,'INV','Customer Invoices','sale',   (select id from public.accounts where company_id=p_company and code='7000'), 'INV/'),
    (p_company,'BILL','Vendor Bills','purchase',   (select id from public.accounts where company_id=p_company and code='6000'), 'BILL/'),
    (p_company,'BNK','Bank','bank',                (select id from public.accounts where company_id=p_company and code='5100'), 'BNK/'),
    (p_company,'CSH','Cash','cash',                (select id from public.accounts where company_id=p_company and code='5300'), 'CSH/'),
    (p_company,'MISC','Miscellaneous','general',   null, 'MISC/')
  on conflict (company_id, code) do nothing;

  -- country VAT (only when the company has no tax set up yet, so re-running never duplicates)
  vat_rate := case
    when ctry like '%united arab emirates%' or ctry = 'uae' then 5
    when ctry like '%saudi%' then 15
    when ctry like '%egypt%' then 14
    when ctry like '%united kingdom%' or ctry = 'uk' then 20
    when ctry like '%france%' then 20
    when ctry like '%germany%' then 19
    when ctry like '%lebanon%' then 11
    when ctry like '%qatar%' or ctry like '%kuwait%' or ctry like '%united states%' or ctry = 'usa' then 0
    else 11 end;   -- default to the universal 11% when the country is unknown

  if not exists (select 1 from public.taxes where company_id = p_company) then
    vat_name := 'VAT ' || vat_rate || '%';
    insert into public.taxes(company_id, name, scope, amount_type, amount, account_id) values
      (p_company, vat_name, 'sale', 'percent', vat_rate,               (select id from public.accounts where company_id=p_company and code='4457')),
      (p_company, vat_name || ' (purchase)', 'purchase', 'percent', vat_rate, (select id from public.accounts where company_id=p_company and code='4456')),
      (p_company, 'Exempt 0%', 'sale', 'percent', 0, null);
  end if;

  insert into public.currencies(org_id, code, name, symbol, decimals)
  select c.org_id, x.code, x.name, x.symbol, 2
  from public.companies c, (values ('USD','US Dollar','$'),('EUR','Euro','EUR'),('LBP','Lebanese Pound','LBP'),('AED','UAE Dirham','AED'),('SAR','Saudi Riyal','SAR'),('GBP','Pound Sterling','GBP')) as x(code,name,symbol)
  where c.id = p_company
  on conflict (org_id, code) do nothing;
end; $$;
grant execute on function public.setup_company(uuid, uuid) to authenticated;

select 'country-aware setup_company ready' as done;
