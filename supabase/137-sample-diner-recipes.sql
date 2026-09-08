-- ============================================================================
-- 137-sample-diner-recipes.sql  -  recipes, modifiers, menus and channel prices
-- for the sample diner. SAMPLE DATA, invented for demonstration.
--
-- The recipes carry real waste and yield, because without them plate cost is a
-- guess and the cost-variance report has nothing honest to compare against.
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Recipes. One BOM per sellable item; a couple use a sub-recipe so the nesting
-- is exercised rather than only claimed.
-- ---------------------------------------------------------------------------
do $$
declare
  co uuid := 'aa510000-0000-4000-8000-0000000000c0';
  r record; b uuid; pid uuid;
begin
  for r in
    select * from (values
      -- item,                 component,          qty,    waste%
      ('Classic Burger',       'Beef patty 150g',  1.0,    2),
      ('Classic Burger',       'Burger bun',       1.0,    3),
      ('Classic Burger',       'Lettuce',          0.02,   12),
      ('Classic Burger',       'Tomato',           0.03,   10),
      ('Classic Burger',       'Onion',            0.015,  8),
      ('Classic Burger',       'Mayonnaise',       0.015,  4),
      ('Classic Burger',       'Ketchup',          0.015,  4),
      ('Cheeseburger',         'Beef patty 150g',  1.0,    2),
      ('Cheeseburger',         'Burger bun',       1.0,    3),
      ('Cheeseburger',         'Cheddar slice',    1.0,    1),
      ('Cheeseburger',         'Lettuce',          0.02,   12),
      ('Cheeseburger',         'Tomato',           0.03,   10),
      ('Cheeseburger',         'Ketchup',          0.02,   4),
      ('Mushroom Swiss Burger','Beef patty 150g',  1.0,    2),
      ('Mushroom Swiss Burger','Burger bun',       1.0,    3),
      ('Mushroom Swiss Burger','Swiss slice',      1.0,    1),
      ('Mushroom Swiss Burger','Mushroom',         0.06,   15),
      ('Mushroom Swiss Burger','Mayonnaise',       0.02,   4),
      ('Chicken Burger',       'Chicken breast',   0.16,   6),
      ('Chicken Burger',       'Burger bun',       1.0,    3),
      ('Chicken Burger',       'Lettuce',          0.02,   12),
      ('Chicken Burger',       'Mayonnaise',       0.02,   4),
      ('Veggie Burger',        'Burger bun',       1.0,    3),
      ('Veggie Burger',        'Mushroom',         0.08,   15),
      ('Veggie Burger',        'Lettuce',          0.03,   12),
      ('Veggie Burger',        'Tomato',           0.04,   10),
      ('Chicken Sub',          'Chicken breast',   0.15,   6),
      ('Chicken Sub',          'Burger bun',       1.0,    3),
      ('Chicken Sub',          'Lettuce',          0.03,   12),
      ('Chicken Sub',          'Mayonnaise',       0.02,   4),
      ('Fries',                'Potato',           0.22,   18),
      ('Fries',                'Frying oil',       0.02,   0),
      ('Curly Fries',          'Potato',           0.22,   20),
      ('Curly Fries',          'Frying oil',       0.025,  0),
      ('Curly Fries',          'Flour',            0.02,   5),
      ('Onion Rings',          'Onion',            0.14,   22),
      ('Onion Rings',          'Flour',            0.04,   6),
      ('Onion Rings',          'Frying oil',       0.025,  0),
      ('Caesar Salad',         'Lettuce',          0.14,   14),
      ('Caesar Salad',         'Caesar dressing',  0.04,   3),
      ('Caesar Salad',         'Parmesan',         0.015,  2),
      ('Garden Salad',         'Lettuce',          0.12,   14),
      ('Garden Salad',         'Tomato',           0.06,   10),
      ('Garden Salad',         'Onion',            0.02,   8),
      ('Grilled Chicken Salad','Chicken breast',   0.14,   6),
      ('Grilled Chicken Salad','Lettuce',          0.12,   14),
      ('Grilled Chicken Salad','Tomato',           0.05,   10),
      ('Pancakes',             'Flour',            0.11,   4),
      ('Pancakes',             'Egg',              2.0,    2),
      ('Pancakes',             'Fresh milk',       0.15,   3),
      ('Omelette',             'Egg',              3.0,    2),
      ('Omelette',             'Cheddar slice',    1.0,    1),
      ('Omelette',             'Tomato',           0.03,   10),
      ('Halloumi Sandwich',    'Halloumi',         0.09,   4),
      ('Halloumi Sandwich',    'Burger bun',       1.0,    3),
      ('Halloumi Sandwich',    'Tomato',           0.03,   10),
      ('Soft Drink',           'Cola syrup',       0.05,   2),
      ('Soft Drink',           'Paper cup',        1.0,    1),
      ('Fresh Orange Juice',   'Orange',           0.42,   8),
      ('Fresh Orange Juice',   'Paper cup',        1.0,    1),
      ('Milkshake',            'Ice cream base',   0.16,   5),
      ('Milkshake',            'Fresh milk',       0.09,   3),
      ('Milkshake',            'Paper cup',        1.0,    1),
      ('Coffee',               'Coffee beans',     0.018,  4),
      ('Coffee',               'Paper cup',        1.0,    1),
      ('Brownie',              'Chocolate brownie base', 0.11, 6),
      ('Cheesecake',           'Cheesecake base',  0.13,   6)
    ) as v(item, comp, qty, waste)
  loop
    select id into pid from public.products where company_id = co and name = r.item limit 1;
    if pid is null then continue; end if;
    select id into b from public.boms where company_id = co and product_id = pid limit 1;
    if b is null then
      insert into public.boms (company_id, name, product_id, output_qty, yield_percent, station)
      values (co, r.item, pid, 1, 100, (select station from public.products where id = pid))
      returning id into b;
    end if;
    if not exists (select 1 from public.bom_lines bl join public.products p on p.id = bl.product_id
                    where bl.bom_id = b and p.name = r.comp) then
      insert into public.bom_lines (company_id, bom_id, product_id, name, quantity, unit, waste_percent, sequence)
      select co, b, p.id, p.name, r.qty, p.uom, r.waste,
             coalesce((select max(sequence) from public.bom_lines where bom_id = b), 0) + 10
        from public.products p where p.company_id = co and p.name = r.comp;
    end if;
  end loop;
end $$;

-- Cost the whole menu from its recipe, the same way the app does.
update public.products p
   set cost_price = public.plate_cost(p.id)
 where p.company_id = 'aa510000-0000-4000-8000-0000000000c0'
   and p.is_sellable
   and exists (select 1 from public.boms b where b.product_id = p.id);

-- ---------------------------------------------------------------------------
-- Modifiers. The point of these is that they move COST as well as price, and
-- name the ingredient they consume, so theoretical usage stays honest.
-- ---------------------------------------------------------------------------
insert into public.modifier_groups (company_id, code, name, is_required, min_select, max_select, sort)
values
  ('aa510000-0000-4000-8000-0000000000c0','doneness','How would you like it cooked',true,1,1,10),
  ('aa510000-0000-4000-8000-0000000000c0','addons','Add something',false,0,4,20),
  ('aa510000-0000-4000-8000-0000000000c0','side','Choose a side',true,1,1,30),
  ('aa510000-0000-4000-8000-0000000000c0','drinksize','Size',true,1,1,40)
on conflict (company_id, code) do nothing;

do $$
declare co uuid := 'aa510000-0000-4000-8000-0000000000c0'; g uuid; r record;
begin
  for r in select * from (values
    ('doneness','Medium rare',0,null::text,null::numeric,true),
    ('doneness','Medium',0,null,null,false),
    ('doneness','Well done',0,null,null,false),
    ('addons','Extra cheese',1.00,'Cheddar slice',1,false),
    ('addons','Bacon',1.75,'Bacon rasher',2,false),
    ('addons','Extra patty',3.50,'Beef patty 150g',1,false),
    ('addons','Avocado',1.50,'Avocado',0.5,false),
    ('side','Fries',0,'Potato',0.22,true),
    ('side','Curly fries',1.00,'Potato',0.22,false),
    ('side','Side salad',0.50,'Lettuce',0.1,false),
    ('drinksize','Regular',0,null,null,true),
    ('drinksize','Large',0.75,'Paper cup',0.4,false)
  ) as v(grp, nm, price, comp, qty, dflt)
  loop
    select id into g from public.modifier_groups where company_id = co and code = r.grp;
    if g is null then continue; end if;
    if not exists (select 1 from public.modifiers where group_id = g and name = r.nm) then
      insert into public.modifiers (company_id, group_id, name, price_delta, component_product_id, component_qty, is_default, sort)
      select co, g, r.nm, r.price,
             (select id from public.products where company_id = co and name = r.comp),
             r.qty, r.dflt,
             coalesce((select max(sort) from public.modifiers where group_id = g), 0) + 10;
    end if;
  end loop;
end $$;

-- Attach the groups to the items that actually ask the question.
do $$
declare co uuid := 'aa510000-0000-4000-8000-0000000000c0';
begin
  insert into public.product_modifier_groups (company_id, product_id, group_id, sort)
  select co, p.id, g.id, g.sort
    from public.products p
    join public.modifier_groups g on g.company_id = co
   where p.company_id = co and p.is_sellable
     and (
       (g.code = 'doneness'  and p.name in ('Classic Burger','Cheeseburger','Mushroom Swiss Burger')) or
       (g.code = 'addons'    and p.name like '%Burger%') or
       (g.code = 'side'      and p.name in ('Classic Burger','Cheeseburger','Mushroom Swiss Burger','Chicken Burger','Veggie Burger','Chicken Sub')) or
       (g.code = 'drinksize' and p.name in ('Soft Drink','Fresh Orange Juice','Milkshake','Coffee'))
     )
   on conflict (product_id, group_id) do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- Menus, day-parted. Breakfast retires itself at 11:30.
-- ---------------------------------------------------------------------------
insert into public.menus (id, company_id, name, code, days_of_week, start_time, end_time, sort)
values
  ('aa510000-0000-4000-8000-00000000ee01','aa510000-0000-4000-8000-0000000000c0','Breakfast','breakfast','{0,1,2,3,4,5,6}','07:00','11:30',10),
  ('aa510000-0000-4000-8000-00000000ee02','aa510000-0000-4000-8000-0000000000c0','All day','allday','{0,1,2,3,4,5,6}','11:00','23:30',20)
on conflict (id) do nothing;

insert into public.menu_items (company_id, menu_id, product_id, sort)
select 'aa510000-0000-4000-8000-0000000000c0','aa510000-0000-4000-8000-00000000ee01', p.id, 10
  from public.products p where p.company_id='aa510000-0000-4000-8000-0000000000c0'
   and p.name in ('Pancakes','Omelette','Halloumi Sandwich','Coffee','Fresh Orange Juice','Water')
on conflict (menu_id, product_id) do nothing;

insert into public.menu_items (company_id, menu_id, product_id, sort)
select 'aa510000-0000-4000-8000-0000000000c0','aa510000-0000-4000-8000-00000000ee02', p.id, 10
  from public.products p where p.company_id='aa510000-0000-4000-8000-0000000000c0'
   and p.is_sellable and p.name not in ('Pancakes','Omelette')
on conflict (menu_id, product_id) do nothing;

-- ---------------------------------------------------------------------------
-- Channel pricing, effective dated. The aggregator carries its markup, which is
-- what lets the payout reconciliation mean something later.
-- ---------------------------------------------------------------------------
insert into public.product_prices (company_id, product_id, channel_id, price, currency_code, valid_from, note)
select 'aa510000-0000-4000-8000-0000000000c0', p.id, c.id,
       round(p.list_price * (1 + c.markup_percent / 100.0), 2), 'USD', date '2026-08-01',
       case when c.markup_percent > 0 then 'Aggregator markup to absorb commission' else 'Opening price' end
  from public.products p
  cross join public.sales_channels c
 where p.company_id = 'aa510000-0000-4000-8000-0000000000c0' and p.is_sellable
   and c.company_id = 'aa510000-0000-4000-8000-0000000000c0'
   and not exists (select 1 from public.product_prices x where x.product_id = p.id and x.channel_id = c.id);
