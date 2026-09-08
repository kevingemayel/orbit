-- ============================================================================
-- 128-menu-engineering.sql  -  F&B spec Section 1: Menu & product engineering.
--
-- Reuses Orbit's existing item master (products), recipes (boms/bom_lines) and
-- UOM table rather than building parallel structures. What is genuinely new:
--
--   * the MODIFIER ENGINE - size, milk, shots, syrup - where a modifier carries
--     a price delta, a cost delta AND a recipe impact (it consumes stock)
--   * SALES CHANNELS with their own menus and prices (dine-in, delivery,
--     aggregator with markup, wholesale...)
--   * EFFECTIVE-DATED prices, so a historical report reproduces exactly
--     (spec constraint 8)
--   * DAY-PARTED menus that activate themselves on a schedule
--   * recipe yield, prep loss and batch size, so plate cost is real
--
-- Money is numeric throughout, never float (spec constraint 7). Quantities go
-- through the existing uoms table (spec constraint 6).
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Item master extensions. The spec needs to tell a sellable item apart from a
-- raw material, a batch-prepped semi-finished good and packaging.
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists item_type text not null default 'stock';
  -- stock | raw | semi_finished | packaging | consumable | service | combo
alter table public.products add column if not exists station text;              -- barista | kitchen | bar | pastry
alter table public.products add column if not exists is_sellable boolean not null default true;
alter table public.products add column if not exists allergens text[] not null default '{}';
alter table public.products add column if not exists nutrition jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists lto_from date;              -- limited time offer window
alter table public.products add column if not exists lto_to date;
create index if not exists idx_products_item_type on public.products (company_id, item_type);

-- Recipe realism: a 2 kg sauce batch that loses 8% in prep does not cost the
-- same per portion as 2 kg of ingredients.
alter table public.boms add column if not exists yield_percent numeric not null default 100;
alter table public.boms add column if not exists batch_size numeric;
alter table public.boms add column if not exists batch_unit text;
alter table public.boms add column if not exists station text;
alter table public.boms add column if not exists prep_minutes numeric;
alter table public.bom_lines add column if not exists waste_percent numeric not null default 0;

-- ---------------------------------------------------------------------------
-- Sales channels
-- ---------------------------------------------------------------------------
create table if not exists public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  kind text not null default 'dine_in',   -- dine_in|takeaway|drive_thru|delivery|aggregator|catering|wholesale|retail
  -- an aggregator menu is usually the dine-in price plus a margin to absorb commission
  markup_percent numeric not null default 0,
  commission_percent numeric not null default 0,
  is_active boolean not null default true,
  sort int not null default 10,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);
create index if not exists idx_channels_company on public.sales_channels (company_id, is_active);

-- ---------------------------------------------------------------------------
-- Effective-dated pricing. A price is never edited in place: a new row
-- supersedes the old one from a date, so last year's report still reproduces.
-- channel_id null = the base price for every channel that has no override.
-- ---------------------------------------------------------------------------
create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  channel_id uuid references public.sales_channels(id) on delete cascade,
  price numeric not null,
  currency_code text,
  valid_from date not null default current_date,
  valid_to date,
  note text,
  created_at timestamptz not null default now(),
  created_by text
);
create index if not exists idx_pprice_lookup on public.product_prices (company_id, product_id, channel_id, valid_from desc);

-- The price of an item on a channel on a date. One shared resolver so POS,
-- reports and the simulator can never disagree (spec constraint 3).
create or replace function public.price_of(p_product uuid, p_channel uuid default null, p_date date default current_date)
returns numeric language sql stable security definer set search_path = public as $$
  with pick as (
    select price, (channel_id is not null)::int as specificity
      from public.product_prices
     where product_id = p_product
       and (channel_id = p_channel or channel_id is null)
       and valid_from <= p_date
       and (valid_to is null or valid_to >= p_date)
     order by specificity desc, valid_from desc
     limit 1
  )
  select coalesce((select price from pick), (select list_price from public.products where id = p_product));
$$;

-- ---------------------------------------------------------------------------
-- Modifier engine
--
-- A modifier is not just a price bump: "oat milk" costs money, changes the
-- plate cost, and consumes a different product from stock. All three are
-- modelled, which is what makes theoretical-vs-actual possible later.
-- ---------------------------------------------------------------------------
create table if not exists public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  is_required boolean not null default false,
  min_select int not null default 0,
  max_select int not null default 1,
  sort int not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists public.modifiers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric not null default 0,
  cost_delta numeric not null default 0,
  -- the recipe impact: what this modifier actually consumes
  component_product_id uuid references public.products(id) on delete set null,
  component_qty numeric,
  component_unit text,
  -- and what it REPLACES, so swapping dairy for oat removes the dairy cost
  replaces_product_id uuid references public.products(id) on delete set null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort int not null default 10,
  created_at timestamptz not null default now()
);
create index if not exists idx_modifiers_group on public.modifiers (group_id, is_active, sort);

create table if not exists public.product_modifier_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  sort int not null default 10,
  is_required boolean,          -- overrides the group default for this item
  min_select int,
  max_select int,
  unique (product_id, group_id)
);

-- ---------------------------------------------------------------------------
-- Menus: day-parting and versioning
-- ---------------------------------------------------------------------------
create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,
  channel_id uuid references public.sales_channels(id) on delete set null,
  -- day-part window; null times = all day
  days_of_week int[] not null default '{0,1,2,3,4,5,6}',   -- 0 = Sunday
  start_time time,
  end_time time,
  valid_from date,
  valid_to date,
  is_active boolean not null default true,
  sort int not null default 10,
  created_at timestamptz not null default now()
);
create index if not exists idx_menus_company on public.menus (company_id, is_active);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort int not null default 10,
  is_available boolean not null default true,     -- the 86 flag
  unique (menu_id, product_id)
);
create index if not exists idx_menuitems_menu on public.menu_items (menu_id, is_available);

-- ---------------------------------------------------------------------------
-- Plate cost: the single shared costing path (spec constraint 3).
-- Walks the recipe, applies waste per line and yield for the batch, and
-- recurses into sub-recipes so a cold-brew concentrate rolls into an iced latte.
-- ---------------------------------------------------------------------------
create or replace function public.plate_cost(p_product uuid, p_depth int default 0)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare
  b record; l record; total numeric := 0; unit_cost numeric;
begin
  if p_depth > 10 then return 0; end if;   -- recipes cannot loop, but be safe

  select id, coalesce(output_qty,1) as output_qty, coalesce(yield_percent,100) as yield_percent
    into b from public.boms where product_id = p_product limit 1;

  if b.id is null then
    return coalesce((select cost_price from public.products where id = p_product), 0);
  end if;

  for l in select bl.product_id, coalesce(bl.quantity,0) as quantity, coalesce(bl.waste_percent,0) as waste_percent
             from public.bom_lines bl where bl.bom_id = b.id
  loop
    if l.product_id is null then continue; end if;
    -- a component that has its own recipe costs what its recipe costs
    unit_cost := public.plate_cost(l.product_id, p_depth + 1);
    total := total + (l.quantity * (1 + l.waste_percent / 100.0) * unit_cost);
  end loop;

  -- spread the batch cost over what actually survives prep
  if b.yield_percent > 0 then total := total / (b.yield_percent / 100.0); end if;
  if b.output_qty > 0 then total := total / b.output_qty; end if;
  return round(total, 4);
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['sales_channels','product_prices','modifier_groups','modifiers','product_modifier_groups','menus','menu_items']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))', t || '_rw', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed the channels every F&B company starts with, for existing companies.
-- ---------------------------------------------------------------------------
insert into public.sales_channels (company_id, code, name, kind, sort)
select c.id, v.code, v.name, v.kind, v.sort
  from public.companies c
  cross join (values
    ('dine_in','Dine-in','dine_in',10),
    ('takeaway','Takeaway','takeaway',20),
    ('delivery','Delivery','delivery',30),
    ('aggregator','Aggregator','aggregator',40)
  ) as v(code,name,kind,sort)
on conflict (company_id, code) do nothing;
