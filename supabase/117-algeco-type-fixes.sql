-- ============================================================================
-- 117-algeco-type-fixes.sql
--
-- Merging the classification into Type (116) exposed 13 aluminium items sitting
-- under Steel & Metal. Dolphin used one family called METAL for both aluminium
-- and steel sheet, so the original mapping could not tell them apart; the spec
-- material can. The Aluminium branch had no home for sheet or hollow sections
-- either, so add those first, then move every item to where its material says.
--
-- org 2ffdf0eb-e29b-48c3-8e72-f56b4620586d, company a12b6b6c-e821-4b7e-8c64-2504c2c807e1
-- Safe to re-run.
-- ============================================================================

-- Aluminium sheet + hollow sections (the Steel branch already had both).
insert into public.classification_nodes (org_id, tree, parent_id, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','type', p.id, c.name, c.code, c.sort from (values
  ('ALU','Aluminium Sheet','ALU-SHT',13),('ALU','Hollow Sections','ALU-HS',14)
) c(pcode,name,code,sort)
join public.classification_nodes p on p.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and p.tree='type' and p.code=c.pcode
where not exists (select 1 from public.classification_nodes n where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type' and n.code=c.code);

insert into public.classification_nodes (org_id, tree, parent_id, name, code, sort)
select '2ffdf0eb-e29b-48c3-8e72-f56b4620586d','type', p.id, c.name, c.code, c.sort from (values
  ('ALU-HS','RHS','ALU-HS-RHS',141),('ALU-HS','SHS','ALU-HS-SHS',142)
) c(pcode,name,code,sort)
join public.classification_nodes p on p.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and p.tree='type' and p.code=c.pcode
where not exists (select 1 from public.classification_nodes n where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type' and n.code=c.code);

-- Move the aluminium items out of the Steel & Metal branch. The walk up to the
-- root has to cover two levels: an item sitting at MET-HS-RHS is three deep.
update public.products p set type_node_id = n.id
from public.classification_nodes n
where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type'
  and p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
  and p.spec->>'material' ilike 'alumin%'
  and exists (
    select 1 from public.classification_nodes cur
    left join public.classification_nodes p1 on p1.id = cur.parent_id
    left join public.classification_nodes p2 on p2.id = p1.parent_id
    where cur.id = p.type_node_id and coalesce(p2.code, p1.code, cur.code) = 'MET')
  and n.code = case
    when p.name ilike 'SHS%' then 'ALU-HS-SHS'
    when p.name ilike 'RHS%' then 'ALU-HS-RHS'
    when p.material_form = 'sheet' then 'ALU-SHT'
    else 'ALU-PRF' end;

-- Two stragglers the name gives away: a galvanized sheet filed as a hollow
-- section, and a bare stainless entry.
update public.products p set type_node_id = n.id
from public.classification_nodes n
where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type' and n.code='MET-SHT-GAL'
  and p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and p.name ilike 'galvanized steel sheet%';

update public.products p set type_node_id = n.id
from public.classification_nodes n
where n.org_id='2ffdf0eb-e29b-48c3-8e72-f56b4620586d' and n.tree='type' and n.code='MET-SS'
  and p.company_id='a12b6b6c-e821-4b7e-8c64-2504c2c807e1' and p.name = 'Staineless';
