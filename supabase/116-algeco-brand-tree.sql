-- ============================================================================
-- 116-algeco-brand-tree.sql
--
-- Kevin: the classification should all be merged into TYPE, and FAMILY should
-- hold brand / series / model instead (family Technal > Soleal > Fy or Gy).
--
-- So:
--   TYPE   = what the item IS   (Aluminium > Aluminium Profiles > Glazing Bead)
--            this is the old family tree, moved across and pushed to level 3.
--   FAMILY = who makes it       (Technal > Soleal > Fy 55)
--            a brand / series / model tree, built fresh from the product names.
--
-- The material FORM (bar / sheet / liquid) is not lost: it already lives in
-- products.material_form and is edited separately on the product screen, which
-- is why the old coarse type tree (Profile/Sheet/Liquid) can simply go.
--
-- org 2ffdf0eb-e29b-48c3-8e72-f56b4620586d, company a12b6b6c-e821-4b7e-8c64-2504c2c807e1
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Move the material classification into the Type tree.
--    Products are repointed FIRST so nothing is left dangling when the old
--    coarse type nodes are deleted.
-- ---------------------------------------------------------------------------
update public.products set type_node_id = family_node_id
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and family_node_id is not null;

delete from public.classification_nodes
 where org_id = '2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and tree = 'type';

update public.classification_nodes set tree = 'type'
 where org_id = '2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and tree = 'family';

-- ---------------------------------------------------------------------------
-- 2) Push Type down to level 3 where the product name says what it is.
--    Order matters: mullion beats frame (Mullion Vertical Main Frame is a
--    mullion), frame beats rail (Double Frame Rail is a frame).
-- ---------------------------------------------------------------------------
update public.products p set type_node_id = n.id
from public.classification_nodes par, public.classification_nodes n
where par.org_id = '2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and par.tree = 'type' and par.code = 'ALU-PRF'
  and n.parent_id = par.id
  and p.company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
  and p.type_node_id = par.id
  and n.code = case
    when p.name ilike '%glazing bead%' then 'ALU-PRF-GB'
    when p.name ilike '%parclose%' or p.name ilike '%architrave%' then 'ALU-PRF-PC'
    when p.name ilike '%mullion%' or p.name ilike '%transom%' then 'ALU-PRF-MT'
    when p.name ilike '%frame%' or p.name ilike '%sash%' or p.name ilike '%interlock%'
      or p.name ilike '%lock%' or p.name ilike '%hinge%' or p.name ilike '%bavette%' then 'ALU-PRF-FR'
    when p.name ilike '%cap%' or p.name ilike '%rail%' or p.name ilike '%profile%'
      or p.name ilike '%spigot%' or p.name ilike '%sppigot%' or p.name ilike '%pressure plate%'
      or p.name ilike '%intersection%' then 'ALU-PRF-MT'
    else 'ALU-PRF-AC' end;

update public.products p set type_node_id = n.id
from public.classification_nodes par, public.classification_nodes n
where par.org_id = '2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and par.tree = 'type' and par.code = 'MET-HS'
  and n.parent_id = par.id
  and p.company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
  and p.type_node_id = par.id
  and n.code = case when p.name ilike 'SHS%' then 'MET-HS-SHS' else 'MET-HS-RHS' end;

update public.products p set type_node_id = n.id
from public.classification_nodes par, public.classification_nodes n
where par.org_id = '2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and par.tree = 'type' and par.code = 'MET-SHT'
  and n.parent_id = par.id and n.code = 'MET-SHT-GAL'
  and p.company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
  and p.type_node_id = par.id
  and p.name ilike '%galvan%';

-- ---------------------------------------------------------------------------
-- 3) Build the FAMILY tree fresh as brand / series / model.
-- ---------------------------------------------------------------------------
delete from public.classification_nodes
 where org_id = '2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and tree = 'family';

-- L1 brands
insert into public.classification_nodes (org_id, tree, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','family', v.name, v.code, v.sort from (values
  ('Technal','TEC',10),('Soudal','SDL',20),('Dow / Dowsil','DOW',30),('Illbruck','ILB',40),
  ('Asmaco','ASM',50),('Den Braven','DBR',60),('Kerakoll','KER',70),('Tremco','TRM',80),
  ('Hightec','HTC',90),('Primo','PRM',100),('Silande','SLD',110),('TP','TP',120),
  ('Dynapro','DYN',130),('Baljian','BAL',140),('Aluwell','ALW',150),('Yaret','YAR',160),
  ('Schneider','SCH',170),('Marchalle','MAR',180),('Unbranded / generic','GEN',900)
) v(name,code,sort);

-- L2 series
insert into public.classification_nodes (org_id, tree, parent_id, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','family', p.id, c.name, c.code, c.sort from (values
  ('TEC','Soleal','TEC-SOL',11),('TEC','Lumeal','TEC-LUM',12),('TEC','MX (curtain wall)','TEC-MX',13),
  ('TEC','FX (hinged / casement)','TEC-FX',14),('TEC','GX (sliding)','TEC-GX',15),
  ('SDL','Silirub','SDL-SLR',21),('SDL','Soudaseal','SDL-SDS',22),('SDL','Acrylic','SDL-ACR',23),
  ('SDL','Fix','SDL-FIX',24),('SDL','General','SDL-GEN',25),
  ('DOW','Dowsil 813','DOW-813',31),('DOW','Dowsil 895','DOW-895',32),('DOW','Dual','DOW-DUAL',33),
  ('ILB','ME220','ILB-ME220',41),('ILB','OTO15','ILB-OTO',42),
  ('ASM','2650','ASM-2650',51),
  ('KER','Resycolle','KER-RES',71),
  ('TRM','TremGrip','TRM-GRP',81),
  ('HTC','Elastobond','HTC-ELB',91),
  ('PRM','Primo-Sil','PRM-SIL',101),
  ('SLD','MF899','SLD-MF899',111),
  ('TP','Homfix','TP-HOM',121),('TP','Neutral','TP-NEU',122)
) c(pcode,name,code,sort)
join public.classification_nodes p on p.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and p.tree='family' and p.code=c.pcode;

-- L3 models  (Kevin's example: Technal > Soleal > Fy 55)
insert into public.classification_nodes (org_id, tree, parent_id, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','family', p.id, c.name, c.code, c.sort from (values
  ('TEC-SOL','Fy 55','TEC-SOL-FY55',111),
  ('TEC-FX','FX (standard)','TEC-FX-STD',141),('TEC-FX','FXi (insulated)','TEC-FX-I',142),
  ('TEC-GX','GX (standard)','TEC-GX-STD',151),('TEC-GX','GXi (insulated)','TEC-GX-I',152),
  ('TEC-GX','GTi (lift and slide)','TEC-GX-T',153)
) c(pcode,name,code,sort)
join public.classification_nodes p on p.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and p.tree='family' and p.code=c.pcode;

-- ---------------------------------------------------------------------------
-- 4) Tag every product with its brand / series / model.
--    ilike is case-insensitive, so Fxi must be tested before FX and Gxi / GTi
--    before GX, or the shorter pattern would swallow them.
-- ---------------------------------------------------------------------------
update public.products p set family_node_id = n.id
from public.classification_nodes n
where n.org_id = '2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree = 'family'
  and p.company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
  and n.code = case
    when p.name ilike 'Technal Soleal%' then 'TEC-SOL-FY55'
    when p.name ilike 'Technal Lumeal%' then 'TEC-LUM'
    when p.name ilike 'Technal MX%' then 'TEC-MX'
    when p.name ilike 'Technal Fxi%' then 'TEC-FX-I'
    when p.name ilike 'Technal FX%' then 'TEC-FX-STD'
    when p.name ilike 'Technal Gxi%' then 'TEC-GX-I'
    when p.name ilike 'Technal GTi%' then 'TEC-GX-T'
    when p.name ilike 'Technal GX%' then 'TEC-GX-STD'
    when p.name ilike 'Technal%' then 'TEC'
    when p.name ilike '%Silirub%' then 'SDL-SLR'
    when p.name ilike '%Soudaseal%' or p.name ilike '%SoudalSeal%' then 'SDL-SDS'
    when p.name ilike 'Soudal Acrylic%' then 'SDL-ACR'
    when p.name ilike 'Soudal FIX%' then 'SDL-FIX'
    when p.name ilike 'Soudal%' then 'SDL-GEN'
    when p.name ilike '%Dowsil 813%' then 'DOW-813'
    when p.name ilike '%Dowsil 895%' then 'DOW-895'
    when p.name ilike 'DOWSIL Dual%' then 'DOW-DUAL'
    when p.name ilike 'DOW%' then 'DOW'
    when p.name ilike 'ILLBRUCK ME220%' then 'ILB-ME220'
    when p.name ilike 'ILLBRUCK OTO15%' then 'ILB-OTO'
    when p.name ilike 'ILLBRUCK%' then 'ILB'
    when p.name ilike 'Asmaco%' then 'ASM-2650'
    when p.name ilike 'Dan Braven%' then 'DBR'
    when p.name ilike 'Kerakoll%' then 'KER-RES'
    when p.name ilike 'Tremco%' then 'TRM-GRP'
    when p.name ilike 'Hightec%' then 'HTC-ELB'
    when p.name ilike 'Primo%' then 'PRM-SIL'
    when p.name ilike 'SILANDE%' then 'SLD-MF899'
    when p.name ilike 'TP TP Homfix%' then 'TP-HOM'
    when p.name ilike 'TP TP Neutral%' then 'TP-NEU'
    when p.name ilike 'TP %' then 'TP'
    when p.name ilike 'Dynapro%' then 'DYN'
    when p.name ilike 'Baljian%' then 'BAL'
    when p.name ilike 'Aluwell%' then 'ALW'
    when p.name ilike 'YARET%' then 'YAR'
    when p.name ilike 'Schneider%' then 'SCH'
    when p.name ilike '%Marchalle%' then 'MAR'
    else 'GEN' end;

-- ---------------------------------------------------------------------------
-- 5) The origin words in the names (Chinese, German, Hungary...) are an origin,
--    not a brand. Move them into products.origin_country, which was empty.
-- ---------------------------------------------------------------------------
update public.products set origin_country = case
    when name ilike 'Chinese%' then 'China'
    when name ilike 'German%' then 'Germany'
    when name ilike 'Hungary%' then 'Hungary'
    when name ilike 'Italian%' then 'Italy'
    when name ilike 'USA%' then 'United States'
    when name ilike 'European%' then 'Europe'
    when name ilike '%Lebanese%' then 'Lebanon'
    else origin_country end
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1';

-- ---------------------------------------------------------------------------
-- 6) products.family (free text) is left exactly as imported from Dolphin - it
--    is the only surviving record of the original material family and is no
--    longer shown anywhere, so nothing reads a stale value.
--    The free-text brand in spec IS dropped: the tree replaces it, and it was
--    the messy field (it mixed real brands with origins like German / Chinese).
-- ---------------------------------------------------------------------------
update public.products set spec = spec - 'brand'
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and spec ? 'brand';
