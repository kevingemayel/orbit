-- ============================================================================
-- 155c-algeco-coa-tidy.sql  -  three names that would be indistinguishable in a
-- dropdown, and one wrong root type.
-- ============================================================================

-- The class 7 root took income_other from the branch rule; it is income.
update public.accounts set type_code = 'income'
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and code = '7';

-- 332 is a heading I created; 331 already carried this exact name. 332 holds
-- ALGECO's own Inventory and Other purchases, so name it for what is under it.
update public.accounts set name = 'PRODUCTS IN PROCESS - INVENTORY AND PURCHASES'
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and code = '332';

-- 776 is a heading I created; 779 already carried this name in the file.
-- 776 holds the write-back of provisions for risks and charges.
update public.accounts set name = 'WRITE BACK OF PROVISIONS FOR RISKS AND CHARGES - GROUP'
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and code = '776';

-- 4428 and 4429 are both "Vat on advances" in ALGECO's own file. The usual
-- split under a VAT heading is received versus paid. ASSUMPTION, flagged to be
-- confirmed: if it is wrong, the two names swap and nothing else changes.
update public.accounts set name = 'Vat on advances received'
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and code = '4428';
update public.accounts set name = 'Vat on advances paid'
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and code = '4429';
