-- ============================================================================
--  Spacework ERP  -  Company Profile (single source of company info)  (AFTER 71)
--  All the company details a printed report needs live in one place now:
--    * companies.name / legal_name / tax_id / country / currency_code  (existing)
--    * companies.profile jsonb  ->  { address, city, phone, phone2, email,
--        website, social:{linkedin,instagram,facebook,x,youtube}, logo }
--    * companies.print_settings jsonb (from mig 70) gains a `template` key (1-5)
--      selecting one of five header/footer layouts used on every printout.
--  RLS on companies already applies. Fully additive.
-- ============================================================================

alter table public.companies add column if not exists profile jsonb;

select 'company profile ready' as done;
