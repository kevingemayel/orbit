-- ============================================================================
--  Spacework ERP  -  CLASSIFICATION TREES  (run AFTER 01-45)
--  Two managed 3-level trees per org: a Family tree (Family > Subfamily >
--  Sub-subfamily) and a Type tree (Type > Subtype > Sub-subtype). Each node has a
--  short code. A product picks a leaf in each tree; its item code is built from
--  the node codes + a running number (editable), and it also stores the supplier's
--  own code (searchable). This replaces the free-text classification fields.
-- ============================================================================
create table if not exists public.classification_nodes (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.orgs(id) on delete cascade,
  tree      text not null,                       -- 'family' | 'type'
  parent_id uuid references public.classification_nodes(id) on delete cascade,
  name      text not null,
  code      text default '',                     -- short segment, e.g. AL / EXT / MUL
  sort      int default 10,
  created_at timestamptz default now()
);
create index if not exists idx_classnodes on public.classification_nodes(org_id, tree, parent_id, sort);
alter table public.classification_nodes enable row level security;
drop policy if exists cn_r on public.classification_nodes;
create policy cn_r on public.classification_nodes for select using (org_id in (select public.my_orgs()));
drop policy if exists cn_w on public.classification_nodes;
create policy cn_w on public.classification_nodes for all using (org_id in (select public.my_orgs())) with check (org_id in (select public.my_orgs()));

alter table public.products add column if not exists family_node_id uuid references public.classification_nodes(id) on delete set null;
alter table public.products add column if not exists type_node_id   uuid references public.classification_nodes(id) on delete set null;
alter table public.products add column if not exists supplier_code  text;
create index if not exists idx_products_famnode on public.products(family_node_id);
create index if not exists idx_products_suppcode on public.products(company_id, supplier_code);

select 'classification ready' as done;
