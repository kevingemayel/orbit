-- ============================================================================
-- 111-algeco-classification.sql  -  Build the Family and Type classification
-- trees (3 levels each) for ALGECO's org and tag all 281 products, so the next
-- procurement officer picks from a standardized menu instead of free text.
-- org 2ffdf0eb-e29b-48c3-8e72-f56b4620586d, company a12b6b6c-...  Safe to re-run.
-- ============================================================================

-- ---- FAMILY tree (what the material is) ------------------------------------
-- L1
insert into public.classification_nodes (org_id, tree, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','family', v.name, v.code, v.sort from (values
  ('Aluminium','ALU',10),('Steel & Metal','MET',20),('Sealants & Adhesives','SEA',30),
  ('Gaskets & Rubber','GKT',40),('Wood & Panels','WD',50),('Hardware & Accessories','HW',60),
  ('Electrical','ELE',70),('Tools & Consumables','TLS',80)
) v(name,code,sort)
where not exists (select 1 from public.classification_nodes n where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='family' and n.code=v.code);
-- L2
insert into public.classification_nodes (org_id, tree, parent_id, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','family', p.id, c.name, c.code, c.sort from (values
  ('ALU','Aluminium Profiles','ALU-PRF',11),('ALU','Composite Panels','ALU-CMP',12),
  ('MET','Sheet Metal','MET-SHT',21),('MET','Steel Sheet','MET-STL',22),('MET','Stainless Steel','MET-SS',23),('MET','Hollow Sections','MET-HS',24),
  ('SEA','Silicone Sealant','SEA-SIL',31),('SEA','Structural Sealant','SEA-STR',32),('SEA','Adhesive','SEA-ADH',33),('SEA','Membrane','SEA-MEM',34),
  ('GKT','EPDM Gasket','GKT-EPD',41),('GKT','EPDM Rubber','GKT-RUB',42),
  ('WD','Wood Panel','WD-PNL',51),
  ('HW','Door Accessories','HW-DOR',61),('HW','Window Accessories','HW-WIN',62),('HW','Fixings & Plugs','HW-FIX',63),('HW','General Accessories','HW-GEN',64),
  ('ELE','Contactors','ELE-CNT',71),('ELE','Actuators','ELE-ACT',72),
  ('TLS','Power Tools','TLS-PWR',81),('TLS','Welding','TLS-WLD',82),('TLS','Blades','TLS-BLD',83)
) c(pcode,name,code,sort)
join public.classification_nodes p on p.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and p.tree='family' and p.code=c.pcode
where not exists (select 1 from public.classification_nodes n where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='family' and n.code=c.code);
-- L3 (sub-subfamily refinements for the biggest families)
insert into public.classification_nodes (org_id, tree, parent_id, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','family', p.id, c.name, c.code, c.sort from (values
  ('ALU-PRF','Glazing Bead','ALU-PRF-GB',101),('ALU-PRF','Frame','ALU-PRF-FR',102),('ALU-PRF','Parclose / Architrave','ALU-PRF-PC',103),('ALU-PRF','Mullion / Transom','ALU-PRF-MT',104),('ALU-PRF','Accessory Profile','ALU-PRF-AC',105),
  ('MET-HS','RHS','MET-HS-RHS',241),('MET-HS','SHS','MET-HS-SHS',242),
  ('MET-SHT','Galvanized','MET-SHT-GAL',211),('MET-SHT','Coated / Painted','MET-SHT-COAT',212),
  ('SEA-MEM','Waterproofing','SEA-MEM-WP',341),('SEA-MEM','Vapour','SEA-MEM-VAP',342)
) c(pcode,name,code,sort)
join public.classification_nodes p on p.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and p.tree='family' and p.code=c.pcode
where not exists (select 1 from public.classification_nodes n where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='family' and n.code=c.code);

-- ---- TYPE tree (the physical form) -----------------------------------------
-- L1
insert into public.classification_nodes (org_id, tree, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','type', v.name, v.code, v.sort from (values
  ('Profile / Bar','BAR',10),('Sheet / Plate','SHT',20),('Liquid','LIQ',30),
  ('Gasket / Seal','GKT',40),('Component / Accessory','CMP',50),('Tool / Consumable','TL',60)
) v(name,code,sort)
where not exists (select 1 from public.classification_nodes n where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type' and n.code=v.code);
-- L2
insert into public.classification_nodes (org_id, tree, parent_id, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','type', p.id, c.name, c.code, c.sort from (values
  ('BAR','Extrusion','BAR-EXT',11),('BAR','Hollow Section','BAR-HS',12),
  ('SHT','Metal Sheet','SHT-MET',21),('SHT','Panel','SHT-PNL',22),('SHT','Membrane','SHT-MEM',23),
  ('LIQ','Sealant','LIQ-SEA',31),('LIQ','Adhesive','LIQ-ADH',32),
  ('CMP','Hardware','CMP-HW',51),('CMP','Electrical','CMP-ELE',52),('CMP','Fixing','CMP-FIX',53),
  ('TL','Power Tool','TL-PWR',61),('TL','Welding','TL-WLD',62),('TL','Blade','TL-BLD',63)
) c(pcode,name,code,sort)
join public.classification_nodes p on p.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and p.tree='type' and p.code=c.pcode
where not exists (select 1 from public.classification_nodes n where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type' and n.code=c.code);

-- ---- Tag all products: family_node_id (by family -> L2 leaf) ---------------
update public.products p set family_node_id = n.id
from (values
  ('Aluminium Profiles','ALU-PRF'),('Composite Panels','ALU-CMP'),
  ('Metal','MET-SHT'),('METAL','MET-SHT'),('Steel','MET-STL'),('Stainless Steel','MET-SS'),('Stainless steel','MET-SS'),('Profiles','MET-HS'),
  ('Sealant','SEA-SIL'),('Structural Sealant','SEA-STR'),('Structural Sealent','SEA-STR'),('Adhesive','SEA-ADH'),('Membrane','SEA-MEM'),('MEMBRANE','SEA-MEM'),
  ('Gaskets','GKT-EPD'),('Black','GKT-RUB'),
  ('Wood','WD-PNL'),
  ('Door Accessory','HW-DOR'),('Door Accesory','HW-DOR'),('Door Handle','HW-DOR'),('Window Accessories','HW-WIN'),('Window Acc','HW-WIN'),('Fly Screen Corner','HW-WIN'),('Nylon Plug','HW-FIX'),('Accessories','HW-GEN'),('Zaybak','HW-GEN'),
  ('Contacteur','ELE-CNT'),
  ('Power Tools','TLS-PWR'),('Welding Material','TLS-WLD'),('Shafrit Menshar','TLS-BLD')
) m(fam,code)
join public.classification_nodes n on n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='family' and n.code=m.code
where p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and p.family=m.fam;

-- ---- Tag all products: type_node_id (by material_form, generic by family) --
update public.products p set type_node_id = n.id
from public.classification_nodes n
where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type'
  and p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
  and n.code = case
    when p.material_form='bar' and p.family='Profiles' then 'BAR-HS'
    when p.material_form='bar' then 'BAR-EXT'
    when p.material_form='sheet' and p.family in ('Composite Panels','Wood') then 'SHT-PNL'
    when p.material_form='sheet' and p.family in ('Membrane','MEMBRANE') then 'SHT-MEM'
    when p.material_form='sheet' then 'SHT-MET'
    when p.material_form='liquid' and p.family='Adhesive' then 'LIQ-ADH'
    when p.material_form='liquid' then 'LIQ-SEA'
    when p.family in ('Gaskets','Black') then 'GKT'
    when p.family='Contacteur' then 'CMP-ELE'
    when p.family='Power Tools' then 'TL-PWR'
    when p.family='Welding Material' then 'TL-WLD'
    when p.family='Shafrit Menshar' then 'TL-BLD'
    when p.family='Nylon Plug' then 'CMP-FIX'
    when p.family in ('Door Accessory','Door Accesory','Door Handle','Window Accessories','Window Acc','Fly Screen Corner','Accessories','Zaybak') then 'CMP-HW'
    else 'CMP' end;
