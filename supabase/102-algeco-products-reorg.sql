-- ============================================================================
-- 102-algeco-products-reorg.sql
-- Reorganize the ALGECO S.A.R.L product catalog (281 items). STRUCTURAL only:
-- builds a category tree, assigns every product to a category, regenerates
-- unique SKUs, mints valid internal EAN-13 barcodes, normalizes UoM/family,
-- and maps VAT + GL accounts. It does NOT invent prices or costs (those are
-- genuinely missing source data and are handled separately with the owner).
-- Company-scoped to ALGECO. Safe to re-run (idempotent).
-- ============================================================================

-- 0) EAN-13 check-digit helper. Internal barcodes use GS1 restricted-circulation
--    prefix 20 (in-store / own-use), so they never collide with real GTINs.
create or replace function public.ean13_check(p text) returns text language sql immutable as $fn$
  select ((10 - ((
        (substr(p,1,1))::int + (substr(p,3,1))::int + (substr(p,5,1))::int + (substr(p,7,1))::int + (substr(p,9,1))::int + (substr(p,11,1))::int
      + 3*((substr(p,2,1))::int + (substr(p,4,1))::int + (substr(p,6,1))::int + (substr(p,8,1))::int + (substr(p,10,1))::int + (substr(p,12,1))::int)
    ) % 10)) % 10)::text
$fn$;

-- 1) COGS / purchases expense account for products (create if missing).
insert into public.accounts (company_id, code, name, type_code, is_active)
select 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1','6010','Purchases of raw materials & goods','expense',true
where not exists (select 1 from public.accounts a where a.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and a.code='6010');

-- 2) Category tree. 8 parents.
insert into public.product_categories (company_id, name)
select 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1', v.name
from (values ('Aluminium'),('Steel & Metal'),('Composite & Cladding'),('Sealants & Adhesives'),
             ('Gaskets & Rubber'),('Hardware & Accessories'),('Electrical'),('Tools & Consumables')) v(name)
where not exists (select 1 from public.product_categories pc
                  where pc.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and pc.name=v.name and pc.parent_id is null);

-- 2b) Child categories under their parent.
insert into public.product_categories (company_id, name, parent_id)
select 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1', ch.name, p.id
from (values
  ('Aluminium Profiles','Aluminium'),
  ('Sheet Metal','Steel & Metal'),
  ('Steel Sheet','Steel & Metal'),
  ('Stainless Steel','Steel & Metal'),
  ('Hollow Sections','Steel & Metal'),
  ('Composite Panels','Composite & Cladding'),
  ('Wood Panels','Composite & Cladding'),
  ('Sealants','Sealants & Adhesives'),
  ('Structural Sealants','Sealants & Adhesives'),
  ('Adhesives','Sealants & Adhesives'),
  ('Membranes','Sealants & Adhesives'),
  ('Gaskets','Gaskets & Rubber'),
  ('EPDM Rubber','Gaskets & Rubber'),
  ('Door Accessories','Hardware & Accessories'),
  ('Door Handles','Hardware & Accessories'),
  ('Window Accessories','Hardware & Accessories'),
  ('Fly Screen','Hardware & Accessories'),
  ('Fixings & Plugs','Hardware & Accessories'),
  ('General Accessories','Hardware & Accessories'),
  ('Contactors','Electrical'),
  ('Power Tools','Tools & Consumables'),
  ('Welding','Tools & Consumables'),
  ('Saw Blades','Tools & Consumables')
) ch(name,parent)
join public.product_categories p on p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and p.name=ch.parent and p.parent_id is null
where not exists (select 1 from public.product_categories x
                  where x.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and x.name=ch.name);

-- 3) Assign category_id from the original family value (before we normalize family text).
update public.products p set category_id = c.id
from (values
  ('Aluminium Profiles','Aluminium Profiles'),
  ('METAL','Sheet Metal'),
  ('Steel','Steel Sheet'),
  ('Stainless steel','Stainless Steel'),
  ('Profiles','Hollow Sections'),
  ('Composite Panels','Composite Panels'),
  ('Wood','Wood Panels'),
  ('Sealant','Sealants'),
  ('Structural Sealent','Structural Sealants'),
  ('Adhesive','Adhesives'),
  ('MEMBRANE','Membranes'),
  ('Gaskets','Gaskets'),
  ('Black','EPDM Rubber'),
  ('Door Accesory','Door Accessories'),
  ('Door Handle','Door Handles'),
  ('Window Acc','Window Accessories'),
  ('Fly Screen Corner','Fly Screen'),
  ('Nylon Plug','Fixings & Plugs'),
  ('Accessories','General Accessories'),
  ('Zaybak','General Accessories'),
  ('Contacteur','Contactors'),
  ('Power Tools','Power Tools'),
  ('Welding Material','Welding'),
  ('Shafrit Menshar','Saw Blades')
) m(fam, child)
join public.product_categories c on c.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and c.name=m.child
where p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and p.family=m.fam;

-- 4) Normalize UoM to a controlled lowercase vocabulary.
update public.products set uom = case lower(trim(uom))
    when '2/pcs' then 'pcs'
    else lower(trim(uom)) end
where company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1';

-- 5) Normalize family text (fix ALL-CAPS + typos) now that categories are assigned.
update public.products set family = case family
    when 'METAL' then 'Metal'
    when 'MEMBRANE' then 'Membrane'
    when 'Structural Sealent' then 'Structural Sealant'
    when 'Door Accesory' then 'Door Accessory'
    when 'Stainless steel' then 'Stainless Steel'
    when 'Window Acc' then 'Window Accessories'
    else family end
where company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1';

-- 6) Map VAT, GL accounts, and flags for every product.
update public.products set
    sale_tax_id     = '3cb7eea4-a0e8-457a-86aa-870f41b2b445',      -- VAT 11% (sale)
    purchase_tax_id = 'ca6196c5-7456-4a41-8dbc-81d318ed16c3',      -- VAT 11% (purchase)
    income_account_id  = '3d6f022c-1819-49e1-977a-2c9dd2a57aeb',   -- 7010 Sales of goods
    stock_account_id   = 'd1dd3aff-8833-4500-b443-b785b2522df4',   -- 3100 Raw materials
    expense_account_id = (select id from public.accounts where company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and code='6010'),
    imported = true,
    is_active = true,
    updated_at = now()
where company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1';

-- 7) Regenerate unique SKUs (category prefix + sequence) and internal EAN-13 barcodes.
with ranked as (
  select p.id,
    coalesce(par.name, ch.name) parent_name,
    row_number() over (partition by coalesce(par.id, ch.id) order by p.family, p.name, p.id) rn,
    row_number() over (order by p.family, p.name, p.id) grn
  from public.products p
  left join public.product_categories ch on ch.id = p.category_id
  left join public.product_categories par on par.id = ch.parent_id
  where p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
),
coded as (
  select id,
    case parent_name
      when 'Aluminium' then 'ALU'
      when 'Steel & Metal' then 'MET'
      when 'Composite & Cladding' then 'CMP'
      when 'Sealants & Adhesives' then 'SEA'
      when 'Gaskets & Rubber' then 'GKT'
      when 'Hardware & Accessories' then 'HWA'
      when 'Electrical' then 'ELE'
      when 'Tools & Consumables' then 'TLS'
      else 'GEN' end || '-' || lpad(rn::text, 4, '0') as code,
    ('20' || lpad(grn::text, 10, '0')) as base12
  from ranked
)
update public.products p set
    default_code = coded.code,
    barcode = coded.base12 || public.ean13_check(coded.base12)
from coded where coded.id = p.id;
