-- ============================================================================
--  Spacework ERP  -  OPERATIONS  (run AFTER 01-47)
--  Site & production layer:
--    * tools/equipment register  (who holds it, where, condition) + movement log
--    * per-project custom items   (glass/bars sized for one job) + remnants
--    * manufacturing runs         (what was consumed to produce a set)
--    * delivery notes             (stock + manufactured + custom, one place)
--  Everything is company-scoped and gated by the same helpers as the rest of the
--  ERP (my_company_ids / can_write_company), so no data ever crosses a tenant.
-- ============================================================================

-- ------------------------------------------------------------------ tools ----
create table if not exists public.tools (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  code          text,                       -- asset tag, encoded in the QR label
  category      text,
  brand         text,
  serial        text,
  status        text default 'in_stock',    -- in_stock | issued | repair | retired
  condition     text default 'good',        -- new | good | fair | poor | broken
  holder_type   text default 'none',        -- none | employee | foreman | partner
  holder_name   text,
  holder_partner_id uuid references public.partners(id) on delete set null,
  project_id    uuid references public.projects(id) on delete set null,
  location      text,                        -- site / warehouse / vehicle
  shelf_location text,                        -- bin / rack when in the warehouse
  purchase_date date,
  purchase_cost numeric,
  notes         text,
  created_by    uuid default auth.uid(),
  created_at    timestamptz default now()
);
create index if not exists idx_tools_co on public.tools(company_id, status);
create unique index if not exists idx_tools_code on public.tools(company_id, lower(code)) where code is not null and code <> '';
alter table public.tools enable row level security;
drop policy if exists tools_r on public.tools;
create policy tools_r on public.tools for select using (company_id in (select public.my_company_ids()));
drop policy if exists tools_w on public.tools;
create policy tools_w on public.tools for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

create table if not exists public.tool_movements (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  tool_id    uuid not null references public.tools(id) on delete cascade,
  at         timestamptz default now(),
  action     text not null,                 -- issued | returned | moved | condition | note
  to_name    text,
  location   text,
  condition  text,
  note       text,
  by_uid     uuid default auth.uid()
);
create index if not exists idx_toolmov on public.tool_movements(tool_id, at desc);
alter table public.tool_movements enable row level security;
drop policy if exists tmov_r on public.tool_movements;
create policy tmov_r on public.tool_movements for select using (org_id in (select public.my_orgs()));
drop policy if exists tmov_w on public.tool_movements;
create policy tmov_w on public.tool_movements for all using (org_id in (select public.my_orgs())) with check (org_id in (select public.my_orgs()));

-- ---------------------------------------------------- project custom items ---
create table if not exists public.project_items (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.orgs(id) on delete cascade,
  company_id     uuid not null references public.companies(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  name           text not null,
  material_form  text,                        -- bar | sheet | liquid | roll | other
  family_node_id uuid references public.classification_nodes(id) on delete set null,
  type_node_id   uuid references public.classification_nodes(id) on delete set null,
  spec           jsonb default '{}'::jsonb,   -- material/color/brand + dims + pricing
  dims           jsonb default '{}'::jsonb,   -- {w,h,thickness,length,diameter,unit}
  qty            numeric default 0,
  used_qty       numeric default 0,
  unit           text default 'pcs',
  is_remnant     boolean default false,       -- an offcut left over from a cut item
  source_item_id uuid references public.project_items(id) on delete set null,
  status         text default 'planned',      -- planned | ordered | in_stock | used | scrapped
  notes          text,
  created_by     uuid default auth.uid(),
  created_at     timestamptz default now()
);
create index if not exists idx_pitems on public.project_items(company_id, project_id, is_remnant);
alter table public.project_items enable row level security;
drop policy if exists pitems_r on public.project_items;
create policy pitems_r on public.project_items for select using (company_id in (select public.my_company_ids()));
drop policy if exists pitems_w on public.project_items;
create policy pitems_w on public.project_items for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- ----------------------------------------------------- manufacturing runs ----
create table if not exists public.production_runs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  ref           text,
  name          text not null,               -- what set is being produced
  output_product_id uuid references public.products(id) on delete set null,
  output_qty    numeric default 1,
  status        text default 'draft',         -- draft | in_progress | done | cancelled
  run_date      date default current_date,
  notes         text,
  created_by    uuid default auth.uid(),
  created_at    timestamptz default now()
);
create index if not exists idx_prun on public.production_runs(company_id, status);
alter table public.production_runs enable row level security;
drop policy if exists prun_r on public.production_runs;
create policy prun_r on public.production_runs for select using (company_id in (select public.my_company_ids()));
drop policy if exists prun_w on public.production_runs;
create policy prun_w on public.production_runs for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

create table if not exists public.production_consumption (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  run_id          uuid not null references public.production_runs(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  project_item_id uuid references public.project_items(id) on delete set null,
  description     text,
  qty             numeric default 0,
  unit            text default 'pcs',
  note            text
);
create index if not exists idx_pcons on public.production_consumption(run_id);
alter table public.production_consumption enable row level security;
drop policy if exists pcons_r on public.production_consumption;
create policy pcons_r on public.production_consumption for select using (org_id in (select public.my_orgs()));
drop policy if exists pcons_w on public.production_consumption;
create policy pcons_w on public.production_consumption for all using (org_id in (select public.my_orgs())) with check (org_id in (select public.my_orgs()));

-- ---------------------------------------------------------- delivery notes ---
create table if not exists public.delivery_notes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  number      text,
  partner_id  uuid references public.partners(id) on delete set null,
  project_id  uuid references public.projects(id) on delete set null,
  dn_date     date default current_date,
  status      text default 'draft',           -- draft | issued | delivered | cancelled
  ship_to     text,
  notes       text,
  created_by  uuid default auth.uid(),
  created_at  timestamptz default now()
);
create index if not exists idx_dn on public.delivery_notes(company_id, status);
alter table public.delivery_notes enable row level security;
drop policy if exists dn_r on public.delivery_notes;
create policy dn_r on public.delivery_notes for select using (company_id in (select public.my_company_ids()));
drop policy if exists dn_w on public.delivery_notes;
create policy dn_w on public.delivery_notes for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

create table if not exists public.delivery_note_lines (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.orgs(id) on delete cascade,
  note_id           uuid not null references public.delivery_notes(id) on delete cascade,
  source            text default 'stock',      -- stock | manufactured | custom
  product_id        uuid references public.products(id) on delete set null,
  project_item_id   uuid references public.project_items(id) on delete set null,
  production_run_id uuid references public.production_runs(id) on delete set null,
  description       text,
  qty               numeric default 0,
  unit              text default 'pcs'
);
create index if not exists idx_dnl on public.delivery_note_lines(note_id);
alter table public.delivery_note_lines enable row level security;
drop policy if exists dnl_r on public.delivery_note_lines;
create policy dnl_r on public.delivery_note_lines for select using (org_id in (select public.my_orgs()));
drop policy if exists dnl_w on public.delivery_note_lines;
create policy dnl_w on public.delivery_note_lines for all using (org_id in (select public.my_orgs())) with check (org_id in (select public.my_orgs()));

select 'operations ready' as done;
