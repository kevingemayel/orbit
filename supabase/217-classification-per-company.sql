-- 217: a product tree belongs to ONE company, not to the whole group.
--
-- classification_nodes was keyed on org_id, so every company in an organisation
-- saw every other company's product tree. Space Work opened its product screens
-- and found ALGECO's 1,811 brands, series and models in the Family and Type
-- pickers: 49 aluminium and glass brands that mean nothing to a facade
-- consultancy, and a catalogue ALGECO has no reason to show anyone else. One
-- company's catalogue structure is its own, in the same way its products are.
--
-- Three parts: a company_id on the node, a backfill that works out whose tree
-- each node is, and policies that read and write by company instead of by org.
--
-- The backfill is deliberate about not guessing. It takes, in order:
--   1. the company whose products or project items already point at the node
--   2. the company its nearest parent ended up with (a tree is one company's)
--   3. the company any child ended up with (walking the other way)
--   4. the only company in the org, where the org has exactly one
--   5. the company named below, for a tree nothing at all points at
-- Step 5 exists for exactly one case in this database: the Spacework Group
-- trees. Every one of those 1,811 nodes was loaded for ALGECO - migration 111
-- and 116 built the brand tree against that org id, 208 finished it from
-- ALGECO's own Dolphin catalogue - and no Space Work product has ever used one.
-- Nothing is deleted: ALGECO keeps its whole tree, and the other companies in
-- the group stop seeing it.
alter table public.classification_nodes
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

do $cls$
declare
  n_ref int; n_down int; n_up int; n_solo int; n_named int; n_left int; pass int;
begin
  -- 1. whoever already points at the node owns it
  update public.classification_nodes n set company_id = x.cid
  from (
    select node_id, cid from (
      select node_id, cid, row_number() over (partition by node_id order by count(*) desc, cid) as rn
      from (
        select p.family_node_id as node_id, p.company_id as cid from public.products p where p.family_node_id is not null
        union all
        select p.type_node_id,   p.company_id from public.products p where p.type_node_id is not null
        union all
        select i.family_node_id, i.company_id from public.project_items i where i.family_node_id is not null
        union all
        select i.type_node_id,   i.company_id from public.project_items i where i.type_node_id is not null
      ) u group by node_id, cid
    ) r where rn = 1
  ) x
  where x.node_id = n.id and n.company_id is null;
  get diagnostics n_ref = row_count;

  -- 2. down the tree from a node that now has an owner
  n_down := 0;
  for pass in 1..40 loop
    update public.classification_nodes c set company_id = p.company_id
    from public.classification_nodes p
    where p.id = c.parent_id and c.company_id is null and p.company_id is not null;
    exit when not found;
    n_down := n_down + 1;
  end loop;

  -- 3. up the tree from a child that has one
  n_up := 0;
  for pass in 1..40 loop
    update public.classification_nodes p set company_id = k.company_id
    from (select parent_id, min(company_id::text)::uuid as company_id
            from public.classification_nodes
           where parent_id is not null and company_id is not null
           group by parent_id) k
    where k.parent_id = p.id and p.company_id is null;
    exit when not found;
    n_up := n_up + 1;
  end loop;

  -- 4. an org with exactly one company has no ambiguity
  update public.classification_nodes n set company_id = s.cid
  from (select c.org_id, min(c.id::text)::uuid as cid
          from public.companies c group by c.org_id having count(*) = 1) s
  where s.org_id = n.org_id and n.company_id is null;
  get diagnostics n_solo = row_count;

  -- 5. the tree this install built for one named company
  update public.classification_nodes n set company_id = c.id
  from public.companies c
  where c.name = 'ALGECO S.A.R.L'
    and n.org_id = c.org_id
    and n.company_id is null;
  get diagnostics n_named = row_count;

  select count(*) into n_left from public.classification_nodes where company_id is null;
  raise notice 'nodes claimed: % by a product, % passes down, % passes up, % by a single-company org, % by name; % still unclaimed',
    n_ref, n_down, n_up, n_solo, n_named, n_left;
  if n_left > 0 then
    raise exception '% node(s) have no company. Nothing was changed: work out whose they are first, because a node with no company disappears from every screen once the policies below are company-scoped.', n_left;
  end if;
end $cls$;

alter table public.classification_nodes alter column company_id set not null;
create index if not exists classification_nodes_company_tree_idx
  on public.classification_nodes (company_id, tree, parent_id);

-- a child always belongs to the same company as its parent
create or replace function public.classification_node_same_company() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare pc uuid;
begin
  if new.parent_id is not null then
    select company_id into pc from public.classification_nodes where id = new.parent_id;
    if pc is not null and pc <> new.company_id then
      raise exception 'A classification node sits under a parent from another company. A tree belongs to one company.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_classification_same_company on public.classification_nodes;
create trigger trg_classification_same_company
  before insert or update on public.classification_nodes
  for each row execute function public.classification_node_same_company();

-- read and write by company, the same as products
drop policy if exists cn_r on public.classification_nodes;
drop policy if exists cn_w on public.classification_nodes;
create policy cn_r on public.classification_nodes for select to authenticated
  using (company_id in (select public.my_company_ids()));
create policy cn_w on public.classification_nodes for all to authenticated
  using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- and the same role gates product_categories has, so a limited member cannot
-- rewrite the catalogue (the shape 191 generates, under its own names, so a
-- regeneration replaces these instead of doubling them)
drop policy if exists rg_ins on public.classification_nodes;
drop policy if exists rg_upd on public.classification_nodes;
drop policy if exists rg_del on public.classification_nodes;
create policy rg_ins on public.classification_nodes as restrictive for insert to authenticated
  with check (public.can_write_app(company_id, '{inventory,purchase,sales,kitchen}'::text[]));
create policy rg_upd on public.classification_nodes as restrictive for update to authenticated
  using (public.can_write_app(company_id, '{inventory,purchase,sales,kitchen}'::text[]))
  with check (public.can_write_app(company_id, '{inventory,purchase,sales,kitchen}'::text[]));
create policy rg_del on public.classification_nodes as restrictive for delete to authenticated
  using (public.can_manage_app(company_id, '{inventory,purchase,sales,kitchen}'::text[]));

select c.name as company, n.tree, count(*) as nodes
from public.classification_nodes n join public.companies c on c.id = n.company_id
group by 1, 2 order by 1, 2;
