-- ============================================================================
-- 140-sample-diner-fullmenu.sql  -  the real menu structure, properly.
--
-- SAMPLE DATA. The item names follow the chain's published menu so the example
-- is recognisable to someone who knows it; every cost, price and quantity is
-- invented for demonstration and none of it came from that business.
--
-- The first pass had 22 items, which was not a menu, it was a sketch. This is
-- the actual shape: eleven sections, appetizers through kids and drinks, with
-- the ingredient list that a kitchen making all of it would really carry.
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Ingredients. Costs are Lebanese wholesale, per stock unit.
-- ---------------------------------------------------------------------------
insert into public.products (company_id, name, type, uom, cost_price, list_price, item_type, is_sellable, track_lots, shelf_life_days)
select 'aa510000-0000-4000-8000-0000000000c0', v.n, 'product', v.u, v.c, 0, 'raw', false, v.lot, v.sl
from (values
  -- proteins
  ('Beef patty 150g','each',2.00,true,3), ('Angus patty 180g','each',3.60,true,3),
  ('Chicken breast','kg',8.50,true,3),    ('Chicken tender','each',0.55,true,3),
  ('Chicken wing','each',0.42,true,3),    ('Shrimp','kg',16.00,true,2),
  ('Crab stick','kg',9.00,true,5),        ('Salmon fillet','kg',22.00,true,2),
  ('Tuna','kg',11.00,false,180),          ('Sirloin steak','kg',18.00,true,3),
  ('Bacon rasher','each',0.55,true,7),    ('Smoked turkey','kg',12.00,true,7),
  ('Vegan patty','each',2.40,false,60),
  -- dairy
  ('Cheddar slice','each',0.30,false,30), ('Swiss slice','each',0.40,false,30),
  ('Mozzarella stick','each',0.48,false,60), ('Baby mozzarella','kg',12.00,true,14),
  ('Boursin cheese','kg',16.00,true,21),  ('Parmesan','kg',20.00,false,60),
  ('Cream cheese','kg',7.50,true,21),     ('Butter','kg',8.00,false,60),
  ('Fresh milk','L',1.70,true,5),         ('Vanilla ice cream','L',5.20,false,90),
  ('Chocolate ice cream','L',5.40,false,90), ('Lotus ice cream','L',6.20,false,90),
  ('Oreo ice cream','L',6.20,false,90),   ('Whipped cream','L',6.00,true,14),
  -- produce
  ('Lettuce','kg',2.50,false,5),          ('Kale','kg',4.20,false,5),
  ('Rocket','kg',5.00,false,4),           ('Tomato','kg',2.80,false,7),
  ('Onion','kg',1.40,false,30),           ('Red onion','kg',1.80,false,30),
  ('Pickles','kg',3.20,false,120),        ('Avocado','each',1.80,false,5),
  ('Mushroom','kg',6.50,false,5),         ('Potato','kg',1.20,false,30),
  ('Sweet potato','kg',1.90,false,30),    ('Corn','kg',2.40,false,180),
  ('Cucumber','kg',1.60,false,7),         ('Lemon','kg',1.90,false,14),
  ('Orange','kg',2.20,false,14),          ('Banana','kg',1.70,false,7),
  ('Jalapeno','kg',4.00,false,14),        ('Garlic','kg',3.50,false,60),
  ('Coriander','kg',5.50,false,4),
  -- dry goods
  ('Burger bun','each',0.40,false,5),     ('Brioche bun','each',0.55,false,5),
  ('Slider bun','each',0.24,false,5),     ('Sub roll','each',0.50,false,4),
  ('Tortilla wrap','each',0.30,false,30), ('Nacho chips','kg',5.00,false,120),
  ('Pasta','kg',2.20,false,365),          ('Egg noodles','kg',3.00,false,365),
  ('Quinoa','kg',7.00,false,365),         ('Freekeh','kg',4.50,false,365),
  ('Flour','kg',1.20,false,180),          ('Breadcrumbs','kg',2.60,false,180),
  ('Egg','each',0.25,false,21),
  -- sauces and oils
  ('Frying oil','L',3.20,false,90),       ('Mayonnaise','kg',4.50,false,60),
  ('Ketchup','kg',3.20,false,90),         ('BBQ sauce','kg',5.20,false,120),
  ('Buffalo sauce','kg',6.00,false,120),  ('Ranch dressing','L',6.50,false,45),
  ('Thousand Island','L',6.00,false,45),  ('Honey mustard','L',6.80,false,45),
  ('Caesar dressing','L',7.00,false,45),  ('Teriyaki sauce','L',6.40,false,180),
  ('Peanut sauce','L',8.50,false,180),    ('Wasabi dressing','L',9.00,false,90),
  ('Truffle oil','L',48.00,false,365),    ('Guacamole','kg',9.50,true,3),
  ('Cheddar sauce','kg',6.20,false,60),   ('Sweet chili sauce','L',5.00,false,180),
  -- sweet
  ('Oreo biscuit','kg',9.00,false,180),   ('Lotus biscuit','kg',10.50,false,180),
  ('Chocolate sauce','kg',6.50,false,180),('Salted caramel sauce','kg',7.50,false,180),
  ('Brownie base','kg',9.00,false,30),    ('Cheesecake base','kg',10.50,false,20),
  ('Lazy cake base','kg',8.50,false,30),  ('Apple crisp mix','kg',7.00,false,60),
  ('Choco taco shell','each',0.70,false,120), ('Rum essence','L',14.00,false,365),
  -- drinks
  ('Cola syrup','L',5.50,false,180),      ('Lemonade syrup','L',4.80,false,180),
  ('Iced tea syrup','L',4.60,false,180),  ('Sparkling water 330ml','each',0.60,false,365),
  ('Mineral water 500ml','each',0.22,false,365), ('Red Bull can','each',1.35,false,365),
  ('Local beer','each',1.20,false,180),   ('Imported beer','each',1.90,false,180),
  ('Coffee beans','kg',24.00,true,90),
  -- packaging
  ('Takeaway box','each',0.22,false,null),('Paper cup','each',0.14,false,null),
  ('Delivery bag','each',0.18,false,null),('Sauce cup','each',0.05,false,null),
  ('Cutlery pack','each',0.11,false,null)
) as v(n,u,c,lot,sl)
where not exists (select 1 from public.products p where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.name = v.n);

-- ---------------------------------------------------------------------------
-- The menu. Section is carried in `station` for routing and in the category
-- tree for the menu screens.
-- ---------------------------------------------------------------------------
insert into public.products (company_id, name, type, uom, cost_price, list_price, item_type, is_sellable, station, prep_minutes, allergens)
select 'aa510000-0000-4000-8000-0000000000c0', v.n, 'product', 'each', 0, v.p, 'stock', true, v.st, v.pm, v.al
from (values
  -- LET'S GET STARTED
  ('Ranch Chicken Rolls',        7.50,'kitchen', 7, array['gluten','dairy']),
  ('Mozzarella Sticks',          7.00,'kitchen', 6, array['gluten','dairy']),
  ('Super Sampler',             14.50,'kitchen',10, array['gluten','dairy']),
  ('Veggie Soup',                5.50,'kitchen', 4, array[]::text[]),
  ('Chicken Strips',             8.50,'kitchen', 7, array['gluten']),
  ('Buffalo Wings',              9.00,'kitchen', 9, array[]::text[]),
  ('BBQ Wings',                  9.00,'kitchen', 9, array[]::text[]),
  ('Skin-on Fries',              4.00,'kitchen', 4, array[]::text[]),
  ('Curly Fries',                4.75,'kitchen', 4, array['gluten']),
  ('Potato Dippers',             4.50,'kitchen', 4, array[]::text[]),
  ('Classic Nachos',             8.00,'kitchen', 5, array['dairy']),
  ('Buffalo Chicken Strips',     9.50,'kitchen', 8, array['gluten']),
  ('BBQ Chicken Strips',         9.50,'kitchen', 8, array['gluten']),
  ('Fries n Cheddar',            5.75,'kitchen', 5, array['dairy']),
  ('Potato Dippers n Cheddar',   6.25,'kitchen', 5, array['dairy']),
  ('Crispy Dynamite Chicken',   10.00,'kitchen', 8, array['gluten']),
  ('Crispy Dynamite Shrimp',    13.00,'kitchen', 8, array['gluten','shellfish']),
  ('Chicken Tacos',              9.50,'kitchen', 7, array['gluten']),
  ('Vegan Tacos',                8.50,'kitchen', 6, array['gluten']),
  -- UP FOR A SALAD
  ('Crab Slab Salad',           12.50,'kitchen', 6, array['shellfish']),
  ('Tex Mex Salad',             11.50,'kitchen', 6, array['dairy']),
  ('Baby Mozzarella n Chicken', 13.00,'kitchen', 6, array['dairy']),
  ('Pasta n Cheese Salad',      11.00,'kitchen', 6, array['gluten','dairy']),
  ('Field Greens Avocado',      10.50,'kitchen', 5, array[]::text[]),
  ('Vegan Quinoa Salad',        10.00,'kitchen', 5, array[]::text[]),
  ('Classic Caesar',             9.00,'kitchen', 5, array['dairy','egg']),
  ('Chicken Caesar',            12.00,'kitchen', 6, array['dairy','egg']),
  ('Classic Chef Salad',        11.50,'kitchen', 6, array['dairy']),
  ('Chicken Avocado Salad',     13.00,'kitchen', 6, array[]::text[]),
  ('Kale Chicken Wasabi',       13.50,'kitchen', 6, array[]::text[]),
  ('Kale Shrimp Wasabi',        15.50,'kitchen', 7, array['shellfish']),
  ('Freekale Salad',            11.00,'kitchen', 6, array['gluten']),
  ('Asian Crab Noodles',        13.00,'kitchen', 7, array['gluten','shellfish']),
  ('Sweet n Chili Shrimp',      15.00,'kitchen', 7, array['shellfish']),
  ('Kale Salmon Bowl',          17.00,'kitchen', 8, array['fish']),
  -- SANDWICHES
  ('Roadside Crab',             12.50,'kitchen', 7, array['gluten','shellfish']),
  ('Chicken Slider',             8.00,'kitchen', 6, array['gluten']),
  ('Chicken Sandwich',          11.00,'kitchen', 7, array['gluten']),
  ('Shrimp Guacamole',          14.50,'kitchen', 8, array['gluten','shellfish']),
  ('Smoky Chicken',             11.50,'kitchen', 7, array['gluten']),
  ('Philly Chicken',            12.50,'kitchen', 8, array['gluten','dairy']),
  ('Philly Steak',              15.50,'kitchen', 9, array['gluten','dairy']),
  ('Ranch Chicken Avocado',     13.00,'kitchen', 7, array['gluten','dairy']),
  ('Crispy Shrimp Avocado',     15.00,'kitchen', 8, array['gluten','shellfish']),
  -- BURGERS
  ('Classic Burger',            11.00,'kitchen', 8, array['gluten']),
  ('Route 66 Burger',           13.50,'kitchen', 9, array['gluten','dairy']),
  ('Diner-Mite Burger',         13.00,'kitchen', 9, array['gluten','dairy']),
  ('Swiss Truffle Burger',      15.00,'kitchen', 9, array['gluten','dairy']),
  ('B.B.B. Beef Burger',        14.00,'kitchen', 9, array['gluten','dairy']),
  ('B.B.B. Chicken Burger',     13.00,'kitchen', 9, array['gluten','dairy']),
  ('Cuban Burger',              14.50,'kitchen', 9, array['gluten','dairy']),
  ('Evergreen Burger',          12.50,'kitchen', 8, array['gluten']),
  ('Chicken Burger',            11.50,'kitchen', 8, array['gluten']),
  ('Mighty Chicken Burger',     13.50,'kitchen', 9, array['gluten','dairy']),
  ('Cheese n Cheese Burger',    13.00,'kitchen', 8, array['gluten','dairy']),
  ('Vegan Burger',              12.00,'kitchen', 8, array['gluten']),
  ('Vegan Mushroom Burger',     12.50,'kitchen', 8, array['gluten']),
  ('Mad Dawg',                   9.50,'kitchen', 6, array['gluten']),
  ('Cheese-at-Heart',           14.00,'kitchen', 9, array['gluten','dairy']),
  -- ANGUS
  ('Angus Classic',             16.00,'kitchen',10, array['gluten']),
  ('Angus Route 66',            18.50,'kitchen',11, array['gluten','dairy']),
  ('Angus Diner-Mite',          18.00,'kitchen',11, array['gluten','dairy']),
  ('Angus Cuban',               19.50,'kitchen',11, array['gluten','dairy']),
  ('Angus Swiss Truffle',       20.00,'kitchen',11, array['gluten','dairy']),
  ('Angus B.B.B.',              19.00,'kitchen',11, array['gluten','dairy']),
  ('Angus Cheese n Cheese',     18.00,'kitchen',10, array['gluten','dairy']),
  -- PLATTERS
  ('Grilled Chicken Platter',   15.00,'kitchen',12, array[]::text[]),
  ('Casual Steak',              22.00,'kitchen',14, array[]::text[]),
  ('Breaded Chicken Platter',   14.50,'kitchen',12, array['gluten']),
  ('Steak n Fries',             24.00,'kitchen',14, array[]::text[]),
  ('Truffle Chicken Boursin',   18.50,'kitchen',13, array['dairy']),
  ('Grilled Salmon Bowl',       21.00,'kitchen',13, array['fish']),
  -- PASTA
  ('Four Cheese Pasta',         13.00,'kitchen',10, array['gluten','dairy']),
  ('Chicken Pasta',             15.00,'kitchen',11, array['gluten','dairy']),
  ('Shrimp Pasta',              17.50,'kitchen',11, array['gluten','dairy','shellfish']),
  ('Vegan Pasta',               12.50,'kitchen',10, array['gluten']),
  -- GO LIGHT
  ('Salmon Beat Salad',         18.00,'kitchen', 8, array['fish']),
  ('Super Quinoa Salad',        11.50,'kitchen', 6, array[]::text[]),
  ('Tunaoa Salad',              12.50,'kitchen', 6, array['fish']),
  ('Low in Smoke',              11.00,'kitchen', 7, array['gluten']),
  ('Wonder Chicken',            11.50,'kitchen', 7, array['gluten']),
  ('Low-Cal Tuna',              10.50,'kitchen', 6, array['gluten','fish']),
  ('Salmon Hero',               16.00,'kitchen', 8, array['gluten','fish']),
  ('Fit n Burger',              12.00,'kitchen', 8, array['gluten']),
  ('Grain Chicken Burger',      12.50,'kitchen', 8, array['gluten']),
  ('Light Grilled Chicken',     14.00,'kitchen',11, array[]::text[]),
  ('Light Fish',                17.00,'kitchen',11, array['fish']),
  -- DESSERTS
  ('Grand Lazy Cake',            7.50,'pastry', 3, array['gluten','dairy']),
  ('Oreo Cheesecake',            8.00,'pastry', 3, array['gluten','dairy']),
  ('Oreo Lover',                 8.50,'pastry', 4, array['gluten','dairy']),
  ('Lotus Madness',              8.50,'pastry', 4, array['gluten','dairy']),
  ('Choco Tacos',                6.50,'pastry', 3, array['gluten','dairy']),
  ('Apple Crisp',                7.00,'pastry', 4, array['gluten','dairy']),
  ('Roadster Sundae',            6.50,'pastry', 3, array['dairy']),
  ('Banana O Rum',               7.50,'pastry', 4, array['dairy']),
  ('Cheesecake Sundae Explosion',9.00,'pastry', 5, array['gluten','dairy']),
  ('Brownie Temptation',         8.00,'pastry', 4, array['gluten','dairy']),
  ('Marbled Mud Pie',            8.50,'pastry', 3, array['gluten','dairy']),
  ('Fun-sized Lotus Mud Pie',    5.50,'pastry', 2, array['gluten','dairy']),
  ('Fun-sized Oreo Mud Pie',     5.50,'pastry', 2, array['gluten','dairy']),
  ('Vegan Brownie',              7.00,'pastry', 3, array['gluten']),
  -- KIDS
  ('Kids Beef Burger Combo',     9.00,'kitchen', 7, array['gluten']),
  ('Kids Chicken Burger Combo',  9.00,'kitchen', 7, array['gluten']),
  ('Kids Chicken Tenders Combo', 9.00,'kitchen', 7, array['gluten']),
  ('Junior Four Cheese Pasta',   8.00,'kitchen', 8, array['gluten','dairy']),
  -- DRINKS
  ('Old Time Milkshake',         6.50,'bar',     4, array['dairy']),
  ('Iced Tea',                   3.50,'bar',     2, array[]::text[]),
  ('Soft Drink',                 2.75,'bar',     1, array[]::text[]),
  ('Sparkling Water',            2.50,'bar',     1, array[]::text[]),
  ('Mineral Water',              1.25,'bar',     1, array[]::text[]),
  ('Fresh Orange Juice',         5.00,'bar',     3, array[]::text[]),
  ('Fresh Lemonade',             4.50,'bar',     3, array[]::text[]),
  ('Red Bull',                   4.00,'bar',     1, array[]::text[]),
  ('Local Beer',                 4.50,'bar',     1, array['gluten']),
  ('Imported Beer',              6.00,'bar',     1, array['gluten']),
  ('Coffee',                     3.25,'barista', 3, array[]::text[])
) as v(n,p,st,pm,al)
where not exists (select 1 from public.products p where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.name = v.n);

-- Retire the placeholders from the first pass that are not on the real menu.
update public.products set is_active = false, is_sellable = false
 where company_id='aa510000-0000-4000-8000-0000000000c0'
   and name in ('Cheeseburger','Mushroom Swiss Burger','Veggie Burger','Chicken Sub','Fries',
                'Onion Rings','Caesar Salad','Garden Salad','Grilled Chicken Salad','Pancakes',
                'Omelette','Halloumi Sandwich','Milkshake','Water','Brownie','Cheesecake');
