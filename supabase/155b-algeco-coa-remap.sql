-- ============================================================================
-- 155b-algeco-coa-remap.sql  -  point everything at the new chart, then remove
-- the parked originals.
--
-- 281 products, 4 journals and 2 taxes referenced the seeded accounts. Each is
-- moved to the equivalent account in ALGECO's own chart rather than being left
-- pointing at a row that is about to disappear.
-- ============================================================================

do $$
declare
  co uuid := 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1';
  m record;
  oldid uuid; newid uuid;
begin
  -- old seeded code -> the account ALGECO actually uses for that purpose
  for m in select * from (values
      ('5100', '5121'),   -- Bank                     -> BLF Dora
      ('5300', '5312'),   -- Cash on hand             -> CASH
      ('6000', '6011'),   -- Purchases of goods       -> Purchases of goods
      ('7000', '713'),    -- Sales of services        -> SERVICES
      ('6010', '6111'),   -- Purchases of raw mats    -> RAW MATERIAL PURCHASES
      ('7010', '7011'),   -- Sales of goods           -> SALES OF GOODS
      ('3100', '311'),    -- Raw materials            -> RAW MATERIALS
      ('4456', '4421'),   -- VAT deductible           -> Vat deductible
      ('4457', '44217')   -- VAT collected            -> Vat on sales
    ) as v(oldc, newc)
  loop
    select id into oldid from public.accounts where company_id = co and code = 'ZZ-' || m.oldc;
    select id into newid from public.accounts where company_id = co and code = m.newc;
    if oldid is null or newid is null then
      raise notice 'skipped % -> % (old % new %)', m.oldc, m.newc, oldid, newid;
      continue;
    end if;
    update public.products set income_account_id  = newid where income_account_id  = oldid;
    update public.products set expense_account_id = newid where expense_account_id = oldid;
    update public.products set stock_account_id   = newid where stock_account_id   = oldid;
    update public.journals set default_account_id = newid where default_account_id = oldid;
    update public.taxes    set account_id         = newid where account_id         = oldid;
    update public.hr_salary_heads set account_id  = newid where account_id         = oldid;
    update public.cash_accounts set gl_account_id = newid where gl_account_id      = oldid;
    update public.invoice_lines set account_id    = newid where account_id         = oldid;
  end loop;

  -- the four pointers on the company itself
  update public.companies c set
    retained_earnings_account_id = (select id from public.accounts where company_id = co and code = '121'),
    current_earnings_account_id  = (select id from public.accounts where company_id = co and code = '130'),
    fx_gain_account_id           = (select id from public.accounts where company_id = co and code = '7751'),
    fx_loss_account_id           = (select id from public.accounts where company_id = co and code = '6751')
   where c.id = co;
end $$;

-- Anything still pointing at a parked account would break on delete, so this
-- refuses rather than silently orphaning.
do $$
declare n int;
begin
  select count(*) into n from public.products p
    join public.accounts a on a.id in (p.income_account_id, p.expense_account_id, p.stock_account_id)
   where a.company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and a.code like 'ZZ-%';
  if n > 0 then raise exception 'still % product reference(s) on parked accounts', n; end if;
end $$;

delete from public.accounts
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and code like 'ZZ-%';
