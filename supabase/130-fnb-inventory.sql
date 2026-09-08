-- ============================================================================
-- 130-fnb-inventory.sql  -  F&B spec Section 5: inventory & stock control.
--
-- Reuses what Orbit already has: stock_moves, stock_locations, warehouses,
-- stock_lots, reordering_rules, production_runs, uoms. What is added is what an
-- F&B operation needs and a general ERP does not have:
--
--   * waste with reason codes and photo evidence (the single biggest
--     unexplained cost line in a coffee shop)
--   * counts that can be blind, with variance approval
--   * inter-branch transfer as a request -> dispatch -> receipt flow, so the
--     discrepancy is visible instead of silently absorbed
--   * THEORETICAL vs ACTUAL: what the recipes say should have been used against
--     what the count says actually went. This is the number the whole section
--     exists to produce, and it only works because migration 128 made recipes,
--     yield, waste and modifiers real.
--   * the 86 flag, per store, propagating to menus
--   * green coffee lots, roast batches and grinder calibration
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Waste
-- ---------------------------------------------------------------------------
create table if not exists public.waste_reasons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  -- staff meal and training are a cost of doing business; spoilage is a loss.
  -- Keeping them apart is what makes the waste report actionable.
  is_controllable boolean not null default true,
  sort int not null default 10,
  is_active boolean not null default true,
  unique (company_id, code)
);

create table if not exists public.waste_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  reason_id uuid references public.waste_reasons(id) on delete set null,
  qty numeric not null default 0,
  uom text,
  unit_cost numeric,
  total_cost numeric,
  waste_date date not null default current_date,
  shift text,
  recorded_by text,
  note text,
  photo_media_id uuid,
  stock_move_id uuid references public.stock_moves(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_waste_store on public.waste_entries (company_id, store_id, waste_date desc);

-- ---------------------------------------------------------------------------
-- Counts
-- ---------------------------------------------------------------------------
create table if not exists public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  location_id uuid references public.stock_locations(id) on delete set null,
  reference text,
  count_type text not null default 'full',      -- full | cycle | spot
  count_date date not null default current_date,
  -- blind means the counter cannot see the expected figure, which is the only
  -- way a count is worth anything
  is_blind boolean not null default true,
  status text not null default 'draft',         -- draft | counting | review | approved | posted | cancelled
  counted_by text, approved_by text, approved_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_counts_store on public.stock_counts (company_id, store_id, count_date desc);

create table if not exists public.stock_count_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  count_id uuid not null references public.stock_counts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  lot_id uuid references public.stock_lots(id) on delete set null,
  expected_qty numeric,
  counted_qty numeric,
  uom text,
  unit_cost numeric,
  variance_qty numeric generated always as (coalesce(counted_qty,0) - coalesce(expected_qty,0)) stored,
  note text
);
create index if not exists idx_countlines on public.stock_count_lines (count_id);

-- ---------------------------------------------------------------------------
-- Inter-branch transfers
-- ---------------------------------------------------------------------------
create table if not exists public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text,
  from_store_id uuid references public.stores(id) on delete set null,
  to_store_id uuid references public.stores(id) on delete set null,
  status text not null default 'requested',   -- requested | approved | dispatched | received | cancelled
  requested_by text, approved_by text, dispatched_by text, received_by text,
  requested_at timestamptz not null default now(),
  dispatched_at timestamptz, received_at timestamptz,
  note text
);
create index if not exists idx_transfers on public.stock_transfers (company_id, status, requested_at desc);

create table if not exists public.stock_transfer_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty_requested numeric not null default 0,
  qty_dispatched numeric,
  qty_received numeric,
  uom text,
  unit_cost numeric,
  -- what went missing between the two doors, which is the whole point
  discrepancy_qty numeric generated always as (coalesce(qty_dispatched,0) - coalesce(qty_received,0)) stored,
  note text
);
create index if not exists idx_transferlines on public.stock_transfer_lines (transfer_id);

-- ---------------------------------------------------------------------------
-- Availability (the 86 flag), per store
-- ---------------------------------------------------------------------------
create table if not exists public.store_item_availability (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  is_available boolean not null default true,
  reason text,
  until_date date,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique (store_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Lots: FEFO needs the lot on the movement, not just a lot table
-- ---------------------------------------------------------------------------
alter table public.stock_moves add column if not exists lot_id uuid references public.stock_lots(id) on delete set null;
alter table public.stock_lots add column if not exists received_on date;
alter table public.stock_lots add column if not exists best_before date;
alter table public.stock_lots add column if not exists supplier_id uuid references public.partners(id) on delete set null;
alter table public.stock_lots add column if not exists qty_on_hand numeric;
alter table public.products add column if not exists track_lots boolean not null default false;
alter table public.products add column if not exists shelf_life_days int;

-- ---------------------------------------------------------------------------
-- Coffee: green lots, roast batches, blends, grinder calibration
-- ---------------------------------------------------------------------------
create table if not exists public.green_lots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lot_code text not null,
  product_id uuid references public.products(id) on delete set null,
  supplier_id uuid references public.partners(id) on delete set null,
  origin text, farm text, region text, varietal text,
  process text,                     -- washed | natural | honey | anaerobic
  harvest_year int,
  altitude_m numeric,
  moisture_pct numeric,
  screen_size text,
  cupping_score numeric,
  certifications text[] not null default '{}',
  qty_kg numeric, qty_remaining_kg numeric,
  cost_per_kg numeric,
  arrival_date date,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, lot_code)
);

create table if not exists public.roast_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  batch_code text,
  green_lot_id uuid references public.green_lots(id) on delete set null,
  output_product_id uuid references public.products(id) on delete set null,
  roast_date date not null default current_date,
  roaster text,
  profile_name text,
  green_kg numeric not null default 0,
  roasted_kg numeric not null default 0,
  -- roast loss is the number a roaster lives by; computed, never typed
  loss_pct numeric generated always as (
    case when coalesce(green_kg,0) > 0
         then round(((coalesce(green_kg,0) - coalesce(roasted_kg,0)) / green_kg) * 100, 2)
         else null end) stored,
  charge_temp numeric, drop_temp numeric, development_min numeric,
  qc_notes text, cupping_score numeric,
  stock_move_id uuid references public.stock_moves(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_roast on public.roast_batches (company_id, roast_date desc);

create table if not exists public.grinder_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  equipment_id uuid,
  log_date date not null default current_date,
  shift text,
  product_id uuid references public.products(id) on delete set null,
  grind_setting text,
  dose_g numeric, yield_g numeric, time_sec numeric,
  temp_c numeric,
  ratio numeric generated always as (case when coalesce(dose_g,0) > 0 then round(coalesce(yield_g,0) / dose_g, 2) else null end) stored,
  tasted_by text, verdict text, note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_grinder on public.grinder_logs (company_id, store_id, log_date desc);

-- ---------------------------------------------------------------------------
-- Theoretical usage: what the recipes say a period's sales should have consumed.
-- Actual comes from the counts. The difference, priced, is the variance report.
--
-- Uses plate_cost's sibling logic but returns QUANTITY per ingredient, walking
-- sub-recipes the same way so a cold brew's beans are attributed correctly.
-- ---------------------------------------------------------------------------
create or replace function public.theoretical_usage(
  p_company uuid, p_from date, p_to date, p_store uuid default null)
returns table(product_id uuid, product_name text, qty numeric, unit_cost numeric, value numeric)
language sql stable security definer set search_path = public as $fn$
  with sold as (
    select l.product_id as sold_product, sum(l.qty) as sold_qty
      from public.pos_order_lines l
      join public.pos_orders o on o.id = l.order_id
     where o.company_id = p_company
       and coalesce(o.status,'') <> 'cancelled'
       and o.created_at >= p_from::timestamptz
       and o.created_at < (p_to + 1)::timestamptz
       and (p_store is null or o.store_id = p_store)
       and l.product_id is not null
     group by l.product_id
  ),
  exploded as (
    select e.pid, e.qty * s.sold_qty as qty
      from sold s
      cross join lateral public.explode_recipe(s.sold_product, 1) e
  )
  select x.pid, p.name,
         round(sum(x.qty), 4),
         round(coalesce(p.cost_price, 0), 4),
         round(sum(x.qty) * coalesce(p.cost_price, 0), 2)
    from exploded x
    join public.products p on p.id = x.pid
   group by x.pid, p.name, p.cost_price
   order by 5 desc;
$fn$;

-- One unit of a sellable item, exploded into the raw ingredients it consumes,
-- honouring per-line waste and batch yield exactly as plate_cost does.
create or replace function public.explode_recipe(p_product uuid, p_qty numeric, p_depth int default 0)
returns table(pid uuid, qty numeric)
language plpgsql stable security definer set search_path = public as $$
declare b record; l record; factor numeric;
begin
  if p_depth > 10 then return; end if;
  select id, coalesce(output_qty,1) as output_qty, coalesce(yield_percent,100) as yield_percent
    into b from public.boms where product_id = p_product limit 1;

  if b.id is null then
    return query select p_product, p_qty;   -- a leaf: it IS the ingredient
    return;
  end if;

  factor := p_qty / nullif(b.output_qty, 0) / nullif(b.yield_percent / 100.0, 0);
  for l in select bl.product_id, coalesce(bl.quantity,0) as quantity, coalesce(bl.waste_percent,0) as waste_percent
             from public.bom_lines bl where bl.bom_id = b.id and bl.product_id is not null
  loop
    return query
      select e.pid, e.qty
        from public.explode_recipe(l.product_id, l.quantity * (1 + l.waste_percent/100.0) * factor, p_depth + 1) e;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed the waste reasons every kitchen uses
-- ---------------------------------------------------------------------------
insert into public.waste_reasons (company_id, code, name, is_controllable, sort)
select c.id, v.code, v.name, v.ctrl, v.sort from public.companies c
cross join (values
  ('spoilage','Spoiled / expired',true,10),
  ('breakage','Broken / dropped',true,20),
  ('staff_meal','Staff meal',false,30),
  ('training','Training / calibration',false,40),
  ('complaint','Customer complaint',true,50),
  ('overproduction','Over-production',true,60),
  ('quality','Failed quality check',true,70)
) as v(code,name,ctrl,sort)
on conflict (company_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['waste_reasons','waste_entries','stock_counts','stock_count_lines',
                           'stock_transfers','stock_transfer_lines','store_item_availability',
                           'green_lots','roast_batches','grinder_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))', t || '_rw', t);
  end loop;
end $$;
