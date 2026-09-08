-- ============================================================================
-- 136-sample-diner.sql  -  a worked example company for the Kitchen app.
--
-- IMPORTANT: this is SAMPLE DATA. The company is named after a well known
-- Lebanese diner chain because it makes the example legible, but every figure
-- here is invented for demonstration. Nothing in it came from that business and
-- none of it should ever be read as their real trading. The company, its legal
-- name and its notes all say so.
--
-- What it demonstrates: two branches, a real menu with recipes and modifiers
-- that change cost as well as price, channel pricing with an aggregator markup,
-- a full month of trading with believable daypart and weekday/weekend shape,
-- and the operational records that make the reports say something - waste, a
-- stock count, HACCP temperature rounds, an aggregator payout that does not
-- match, loyalty members and guest feedback.
--
-- Part 1: master data. Part 2 (137) generates the month.
-- Safe to re-run.
-- ============================================================================

-- Fixed ids so the whole seed is re-runnable and teardown is exact.
-- Company aa51...c0, branches aa51...b1 (Jbeil) and aa51...b2 (Jounieh).
insert into public.stores (id, company_id, code, name, store_type, ownership, city, country,
                           opened_on, seats, area_sqm, has_delivery, has_drive_thru,
                           service_types, target_food_cost_pct, target_labour_pct, is_active)
values
  ('aa510000-0000-4000-8000-0000000000b1','aa510000-0000-4000-8000-0000000000c0','JBL','Jbeil','outlet','coco','Jbeil','Lebanon',
   '2019-06-15', 68, 210, true, false, array['dine_in','takeaway','delivery'], 30, 26, true),
  ('aa510000-0000-4000-8000-0000000000b2','aa510000-0000-4000-8000-0000000000c0','JNH','Jounieh','outlet','coco','Jounieh','Lebanon',
   '2016-03-01', 96, 320, true, true, array['dine_in','takeaway','delivery','drive_thru'], 30, 26, true)
on conflict (id) do nothing;

-- Channels. The aggregator carries a markup to absorb its commission, and the
-- commission itself is recorded separately so the payout can be checked.
insert into public.sales_channels (company_id, code, name, kind, markup_percent, commission_percent, sort)
values
  ('aa510000-0000-4000-8000-0000000000c0','dine_in','Dine-in','dine_in',0,0,10),
  ('aa510000-0000-4000-8000-0000000000c0','takeaway','Takeaway','takeaway',0,0,20),
  ('aa510000-0000-4000-8000-0000000000c0','delivery','Own delivery','delivery',0,0,30),
  ('aa510000-0000-4000-8000-0000000000c0','aggregator','Toters / Talabat','aggregator',18,25,40)
on conflict (company_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- Ingredients. Costs are per the stock unit and are what every margin figure
-- in the app is computed from, so they are deliberately plausible.
-- ---------------------------------------------------------------------------
insert into public.products (company_id, name, type, uom, cost_price, list_price, item_type, is_sellable, track_lots, shelf_life_days)
select 'aa510000-0000-4000-8000-0000000000c0', v.n, 'product', v.u, v.c, 0, 'raw', false, v.lot, v.sl
from (values
  ('Beef patty 150g','each',1.35,true,3),
  ('Chicken breast','kg',6.80,true,3),
  ('Burger bun','each',0.28,false,5),
  ('Cheddar slice','each',0.22,false,30),
  ('Swiss slice','each',0.30,false,30),
  ('Bacon rasher','each',0.45,true,7),
  ('Lettuce','kg',1.90,false,5),
  ('Tomato','kg',2.20,false,7),
  ('Onion','kg',1.10,false,30),
  ('Mushroom','kg',4.50,false,5),
  ('Potato','kg',0.85,false,30),
  ('Frying oil','L',2.40,false,90),
  ('Mayonnaise','kg',3.10,false,60),
  ('Ketchup','kg',2.30,false,90),
  ('Egg','each',0.18,false,21),
  ('Flour','kg',0.95,false,180),
  ('Fresh milk','L',1.25,true,5),
  ('Ice cream base','L',3.40,false,60),
  ('Coffee beans','kg',18.00,true,90),
  ('Cola syrup','L',3.80,false,180),
  ('Orange','kg',1.60,false,14),
  ('Halloumi','kg',9.50,true,21),
  ('Avocado','each',1.20,false,5),
  ('Caesar dressing','L',5.20,false,45),
  ('Parmesan','kg',14.00,false,60),
  ('Chocolate brownie base','kg',6.40,false,30),
  ('Cheesecake base','kg',7.20,false,20),
  ('Takeaway box','each',0.16,false,null),
  ('Paper cup','each',0.09,false,null)
) as v(n,u,c,lot,sl)
where not exists (select 1 from public.products p where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.name = v.n);

-- ---------------------------------------------------------------------------
-- The menu itself.
-- ---------------------------------------------------------------------------
insert into public.products (company_id, name, type, uom, cost_price, list_price, item_type, is_sellable, station, prep_minutes, allergens)
select 'aa510000-0000-4000-8000-0000000000c0', v.n, 'product', 'each', 0, v.p, 'stock', true, v.st, v.pm, v.al
from (values
  ('Classic Burger',        9.50,'kitchen', 8, array['gluten']),
  ('Cheeseburger',         10.50,'kitchen', 8, array['gluten','dairy']),
  ('Mushroom Swiss Burger',12.00,'kitchen', 9, array['gluten','dairy']),
  ('Chicken Burger',       10.00,'kitchen', 9, array['gluten']),
  ('Veggie Burger',         9.00,'kitchen', 8, array['gluten']),
  ('Chicken Sub',          10.50,'kitchen', 7, array['gluten']),
  ('Fries',                 3.50,'kitchen', 4, array[]::text[]),
  ('Curly Fries',           4.50,'kitchen', 4, array['gluten']),
  ('Onion Rings',           4.50,'kitchen', 5, array['gluten']),
  ('Caesar Salad',          8.50,'kitchen', 5, array['dairy','egg']),
  ('Garden Salad',          6.50,'kitchen', 4, array[]::text[]),
  ('Grilled Chicken Salad',11.00,'kitchen', 7, array[]::text[]),
  ('Pancakes',              7.50,'kitchen', 7, array['gluten','dairy','egg']),
  ('Omelette',              7.00,'kitchen', 6, array['egg']),
  ('Halloumi Sandwich',     6.50,'kitchen', 5, array['gluten','dairy']),
  ('Soft Drink',            2.50,'bar',     1, array[]::text[]),
  ('Fresh Orange Juice',    4.50,'bar',     3, array[]::text[]),
  ('Milkshake',             5.50,'bar',     4, array['dairy']),
  ('Coffee',                3.00,'barista', 3, array[]::text[]),
  ('Water',                 1.00,'bar',     1, array[]::text[]),
  ('Brownie',               5.00,'pastry',  3, array['gluten','dairy','egg']),
  ('Cheesecake',            6.00,'pastry',  3, array['gluten','dairy'])
) as v(n,p,st,pm,al)
where not exists (select 1 from public.products p where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.name = v.n);
