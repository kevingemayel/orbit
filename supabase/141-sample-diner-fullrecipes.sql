-- ============================================================================
-- 141-sample-diner-fullrecipes.sql  -  a recipe for every item on the menu.
--
-- SAMPLE DATA. Quantities are invented but plausible for the portion.
--
-- Written as a BASE per family plus the ingredients that make each item itself,
-- rather than 600 hand-typed lines. A burger is a bun, a protein, salad and a
-- sauce; what makes a Cuban a Cuban is the extras. That keeps it accurate,
-- readable, and short enough to check by eye.
-- Safe to re-run.
-- ============================================================================

delete from public.bom_lines where company_id='aa510000-0000-4000-8000-0000000000c0';
delete from public.boms where company_id='aa510000-0000-4000-8000-0000000000c0';

-- A recipe shell for every sellable item.
insert into public.boms (company_id, name, product_id, output_qty, yield_percent, station)
select 'aa510000-0000-4000-8000-0000000000c0', p.name, p.id, 1, 100, p.station
  from public.products p
 where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.is_sellable and p.is_active;

-- ---------------------------------------------------------------------------
-- BASE by family: what every item of that shape carries.
-- ---------------------------------------------------------------------------
insert into public.bom_lines (company_id, bom_id, product_id, name, quantity, unit, waste_percent, sequence)
select 'aa510000-0000-4000-8000-0000000000c0', b.id, ing.id, ing.name, x.qty, ing.uom, x.waste, x.seq
from public.boms b
join public.products mp on mp.id = b.product_id
cross join lateral (
  select * from (values
    -- beef burgers (non-Angus)
    ('burger','Burger bun',1.0,3,10), ('burger','Beef patty 150g',1.0,2,20),
    ('burger','Lettuce',0.025,12,30), ('burger','Tomato',0.03,10,40),
    ('burger','Onion',0.015,8,50),    ('burger','Mayonnaise',0.02,4,60),
    ('burger','Takeaway box',1.0,1,900),
    -- angus
    ('angus','Brioche bun',1.0,3,10), ('angus','Angus patty 180g',1.0,2,20),
    ('angus','Lettuce',0.03,12,30),   ('angus','Tomato',0.035,10,40),
    ('angus','Mayonnaise',0.02,4,60), ('angus','Takeaway box',1.0,1,900),
    -- chicken burgers
    ('chkburger','Burger bun',1.0,3,10), ('chkburger','Chicken breast',0.19,6,20),
    ('chkburger','Lettuce',0.025,12,30), ('chkburger','Tomato',0.03,10,40),
    ('chkburger','Mayonnaise',0.02,4,60), ('chkburger','Takeaway box',1.0,1,900),
    -- sandwiches
    ('sandwich','Sub roll',1.0,3,10),  ('sandwich','Lettuce',0.03,12,30),
    ('sandwich','Tomato',0.03,10,40),  ('sandwich','Mayonnaise',0.025,4,60),
    ('sandwich','Takeaway box',1.0,1,900),
    -- salads
    ('salad','Lettuce',0.14,14,10),    ('salad','Tomato',0.05,10,20),
    ('salad','Cucumber',0.04,8,30),    ('salad','Takeaway box',1.0,1,900),
    -- kale salads
    ('kale','Kale',0.13,12,10),        ('kale','Tomato',0.04,10,20),
    ('kale','Takeaway box',1.0,1,900),
    -- pasta
    ('pasta','Pasta',0.16,3,10),       ('pasta','Parmesan',0.02,2,40),
    ('pasta','Fresh milk',0.08,3,50),  ('pasta','Takeaway box',1.0,1,900),
    -- platters
    ('platter','Potato',0.24,18,30),   ('platter','Frying oil',0.02,0,40),
    ('platter','Takeaway box',1.0,1,900),
    -- fried starters
    ('fried','Frying oil',0.025,0,60), ('fried','Takeaway box',1.0,1,900),
    ('fried','Sauce cup',1.0,1,910),
    -- desserts
    ('dessert','Takeaway box',1.0,1,900),
    -- drinks
    ('drink','Paper cup',1.0,1,900)
  ) as t(fam, ing, qty, waste, seq)
  where t.fam = case
    when mp.name in ('Classic Burger','Route 66 Burger','Diner-Mite Burger','Swiss Truffle Burger',
                     'B.B.B. Beef Burger','Cuban Burger','Evergreen Burger','Cheese n Cheese Burger',
                     'Mad Dawg','Cheese-at-Heart','Fit n Burger','Kids Beef Burger Combo') then 'burger'
    when mp.name like 'Angus%' then 'angus'
    when mp.name in ('Chicken Burger','Mighty Chicken Burger','B.B.B. Chicken Burger','Grain Chicken Burger',
                     'Vegan Burger','Vegan Mushroom Burger','Kids Chicken Burger Combo') then 'chkburger'
    when mp.name in ('Roadside Crab','Chicken Slider','Chicken Sandwich','Shrimp Guacamole','Smoky Chicken',
                     'Philly Chicken','Philly Steak','Ranch Chicken Avocado','Crispy Shrimp Avocado',
                     'Low in Smoke','Wonder Chicken','Low-Cal Tuna','Salmon Hero') then 'sandwich'
    when mp.name in ('Kale Chicken Wasabi','Kale Shrimp Wasabi','Kale Salmon Bowl','Freekale Salad') then 'kale'
    when mp.name like '%Salad%' or mp.name in ('Classic Caesar','Chicken Caesar','Field Greens Avocado',
                     'Tunaoa Salad','Asian Crab Noodles','Sweet n Chili Shrimp') then 'salad'
    when mp.name like '%Pasta%' then 'pasta'
    when mp.name in ('Grilled Chicken Platter','Casual Steak','Breaded Chicken Platter','Steak n Fries',
                     'Truffle Chicken Boursin','Grilled Salmon Bowl','Light Grilled Chicken','Light Fish') then 'platter'
    when mp.name in ('Ranch Chicken Rolls','Mozzarella Sticks','Super Sampler','Chicken Strips','Buffalo Wings',
                     'BBQ Wings','Skin-on Fries','Curly Fries','Potato Dippers','Buffalo Chicken Strips',
                     'BBQ Chicken Strips','Fries n Cheddar','Potato Dippers n Cheddar','Crispy Dynamite Chicken',
                     'Crispy Dynamite Shrimp','Kids Chicken Tenders Combo') then 'fried'
    when mp.station = 'pastry' then 'dessert'
    when mp.station = 'bar' or mp.station = 'barista' then 'drink'
    else 'none' end
) x
join public.products ing on ing.company_id='aa510000-0000-4000-8000-0000000000c0' and ing.name = x.ing
where b.company_id='aa510000-0000-4000-8000-0000000000c0';

-- ---------------------------------------------------------------------------
-- What makes each item itself.
-- ---------------------------------------------------------------------------
insert into public.bom_lines (company_id, bom_id, product_id, name, quantity, unit, waste_percent, sequence)
select 'aa510000-0000-4000-8000-0000000000c0', b.id, ing.id, ing.name, v.qty, ing.uom, v.waste, v.seq
from (values
  -- burgers
  ('Route 66 Burger','Cheddar slice',1.0,1,110), ('Route 66 Burger','Bacon rasher',2.0,2,120), ('Route 66 Burger','BBQ sauce',0.03,3,130),
  ('Diner-Mite Burger','Cheddar slice',1.0,1,110), ('Diner-Mite Burger','Jalapeno',0.02,8,120), ('Diner-Mite Burger','Cheddar sauce',0.04,3,130),
  ('Swiss Truffle Burger','Swiss slice',1.0,1,110), ('Swiss Truffle Burger','Mushroom',0.07,15,120), ('Swiss Truffle Burger','Truffle oil',0.004,0,130),
  ('B.B.B. Beef Burger','Bacon rasher',2.0,2,110), ('B.B.B. Beef Burger','Cheddar slice',1.0,1,120), ('B.B.B. Beef Burger','BBQ sauce',0.03,3,130),
  ('Cuban Burger','Smoked turkey',0.05,4,110), ('Cuban Burger','Swiss slice',1.0,1,120), ('Cuban Burger','Pickles',0.02,3,130), ('Cuban Burger','Honey mustard',0.02,3,140),
  ('Evergreen Burger','Rocket',0.03,10,110), ('Evergreen Burger','Avocado',0.5,6,120),
  ('Cheese n Cheese Burger','Cheddar slice',2.0,1,110), ('Cheese n Cheese Burger','Cheddar sauce',0.05,3,120),
  ('Cheese-at-Heart','Cheddar slice',2.0,1,110), ('Cheese-at-Heart','Cream cheese',0.03,3,120), ('Cheese-at-Heart','Breadcrumbs',0.02,4,130),
  ('Mad Dawg','Cheddar sauce',0.03,3,110), ('Mad Dawg','Onion',0.02,8,120),
  ('Fit n Burger','Rocket',0.03,10,110),
  ('B.B.B. Chicken Burger','Bacon rasher',2.0,2,110), ('B.B.B. Chicken Burger','Cheddar slice',1.0,1,120), ('B.B.B. Chicken Burger','BBQ sauce',0.03,3,130),
  ('Mighty Chicken Burger','Cheddar slice',1.0,1,110), ('Mighty Chicken Burger','Breadcrumbs',0.04,5,120), ('Mighty Chicken Burger','Ranch dressing',0.03,3,130),
  ('Grain Chicken Burger','Freekeh',0.04,4,110),
  ('Vegan Burger','Vegan patty',1.0,2,110), ('Vegan Mushroom Burger','Vegan patty',1.0,2,110), ('Vegan Mushroom Burger','Mushroom',0.08,15,120),
  -- angus extras mirror their beef namesakes
  ('Angus Route 66','Cheddar slice',1.0,1,110), ('Angus Route 66','Bacon rasher',2.0,2,120), ('Angus Route 66','BBQ sauce',0.03,3,130),
  ('Angus Diner-Mite','Cheddar slice',1.0,1,110), ('Angus Diner-Mite','Jalapeno',0.02,8,120), ('Angus Diner-Mite','Cheddar sauce',0.04,3,130),
  ('Angus Cuban','Smoked turkey',0.05,4,110), ('Angus Cuban','Swiss slice',1.0,1,120), ('Angus Cuban','Pickles',0.02,3,130),
  ('Angus Swiss Truffle','Swiss slice',1.0,1,110), ('Angus Swiss Truffle','Mushroom',0.07,15,120), ('Angus Swiss Truffle','Truffle oil',0.004,0,130),
  ('Angus B.B.B.','Bacon rasher',2.0,2,110), ('Angus B.B.B.','Cheddar slice',1.0,1,120), ('Angus B.B.B.','BBQ sauce',0.03,3,130),
  ('Angus Cheese n Cheese','Cheddar slice',2.0,1,110), ('Angus Cheese n Cheese','Cheddar sauce',0.05,3,120),
  -- sandwiches
  ('Roadside Crab','Crab stick',0.12,5,110), ('Chicken Slider','Chicken breast',0.09,6,110), ('Chicken Slider','Slider bun',1.0,3,15),
  ('Chicken Sandwich','Chicken breast',0.18,6,110),
  ('Shrimp Guacamole','Shrimp',0.13,7,110), ('Shrimp Guacamole','Guacamole',0.05,4,120),
  ('Smoky Chicken','Chicken breast',0.18,6,110), ('Smoky Chicken','BBQ sauce',0.03,3,120),
  ('Philly Chicken','Chicken breast',0.19,6,110), ('Philly Chicken','Swiss slice',1.0,1,120), ('Philly Chicken','Mushroom',0.06,15,130), ('Philly Chicken','Onion',0.04,8,140),
  ('Philly Steak','Sirloin steak',0.17,7,110), ('Philly Steak','Swiss slice',1.0,1,120), ('Philly Steak','Mushroom',0.06,15,130), ('Philly Steak','Onion',0.04,8,140),
  ('Ranch Chicken Avocado','Chicken breast',0.17,6,110), ('Ranch Chicken Avocado','Avocado',0.5,6,120), ('Ranch Chicken Avocado','Ranch dressing',0.03,3,130),
  ('Crispy Shrimp Avocado','Shrimp',0.13,7,110), ('Crispy Shrimp Avocado','Avocado',0.5,6,120), ('Crispy Shrimp Avocado','Breadcrumbs',0.04,5,130),
  ('Low in Smoke','Smoked turkey',0.09,4,110), ('Wonder Chicken','Chicken breast',0.16,6,110),
  ('Low-Cal Tuna','Tuna',0.10,3,110), ('Salmon Hero','Salmon fillet',0.13,5,110),
  -- salads
  ('Crab Slab Salad','Crab stick',0.12,5,110), ('Crab Slab Salad','Thousand Island',0.04,3,120),
  ('Tex Mex Salad','Corn',0.05,4,110), ('Tex Mex Salad','Nacho chips',0.04,4,120), ('Tex Mex Salad','Cheddar sauce',0.04,3,130),
  ('Baby Mozzarella n Chicken','Baby mozzarella',0.07,3,110), ('Baby Mozzarella n Chicken','Chicken breast',0.15,6,120),
  ('Pasta n Cheese Salad','Pasta',0.10,3,110), ('Pasta n Cheese Salad','Parmesan',0.02,2,120),
  ('Field Greens Avocado','Avocado',1.0,6,110), ('Field Greens Avocado','Rocket',0.05,10,120),
  ('Vegan Quinoa Salad','Quinoa',0.09,3,110), ('Vegan Quinoa Salad','Avocado',0.5,6,120),
  ('Classic Caesar','Caesar dressing',0.05,3,110), ('Classic Caesar','Parmesan',0.02,2,120), ('Classic Caesar','Flour',0.03,5,130),
  ('Chicken Caesar','Caesar dressing',0.05,3,110), ('Chicken Caesar','Parmesan',0.02,2,120), ('Chicken Caesar','Chicken breast',0.16,6,130),
  ('Classic Chef Salad','Smoked turkey',0.06,4,110), ('Classic Chef Salad','Cheddar slice',2.0,1,120), ('Classic Chef Salad','Egg',1.0,2,130),
  ('Chicken Avocado Salad','Chicken breast',0.16,6,110), ('Chicken Avocado Salad','Avocado',1.0,6,120),
  ('Kale Chicken Wasabi','Chicken breast',0.16,6,110), ('Kale Chicken Wasabi','Wasabi dressing',0.04,3,120),
  ('Kale Shrimp Wasabi','Shrimp',0.13,7,110), ('Kale Shrimp Wasabi','Wasabi dressing',0.04,3,120),
  ('Kale Salmon Bowl','Salmon fillet',0.15,5,110), ('Kale Salmon Bowl','Quinoa',0.06,3,120),
  ('Freekale Salad','Freekeh',0.08,4,110),
  ('Asian Crab Noodles','Crab stick',0.11,5,110), ('Asian Crab Noodles','Egg noodles',0.12,4,120), ('Asian Crab Noodles','Teriyaki sauce',0.03,3,130),
  ('Sweet n Chili Shrimp','Shrimp',0.13,7,110), ('Sweet n Chili Shrimp','Sweet chili sauce',0.04,3,120),
  ('Salmon Beat Salad','Salmon fillet',0.15,5,110), ('Salmon Beat Salad','Rocket',0.05,10,120),
  ('Super Quinoa Salad','Quinoa',0.10,3,110), ('Tunaoa Salad','Tuna',0.10,3,110), ('Tunaoa Salad','Quinoa',0.06,3,120),
  -- pasta
  ('Four Cheese Pasta','Cheddar sauce',0.06,3,110), ('Four Cheese Pasta','Baby mozzarella',0.04,3,120), ('Four Cheese Pasta','Boursin cheese',0.03,3,130),
  ('Chicken Pasta','Chicken breast',0.16,6,110), ('Chicken Pasta','Cheddar sauce',0.05,3,120),
  ('Shrimp Pasta','Shrimp',0.13,7,110), ('Shrimp Pasta','Cheddar sauce',0.05,3,120),
  ('Vegan Pasta','Mushroom',0.08,15,110), ('Vegan Pasta','Tomato',0.06,10,120),
  ('Junior Four Cheese Pasta','Pasta',0.10,3,10), ('Junior Four Cheese Pasta','Cheddar sauce',0.04,3,20), ('Junior Four Cheese Pasta','Takeaway box',1.0,1,900),
  -- platters
  ('Grilled Chicken Platter','Chicken breast',0.24,6,110), ('Light Grilled Chicken','Chicken breast',0.22,6,110),
  ('Breaded Chicken Platter','Chicken breast',0.22,6,110), ('Breaded Chicken Platter','Breadcrumbs',0.05,5,120),
  ('Casual Steak','Sirloin steak',0.24,7,110), ('Steak n Fries','Sirloin steak',0.26,7,110),
  ('Truffle Chicken Boursin','Chicken breast',0.22,6,110), ('Truffle Chicken Boursin','Boursin cheese',0.05,3,120), ('Truffle Chicken Boursin','Truffle oil',0.004,0,130),
  ('Grilled Salmon Bowl','Salmon fillet',0.18,5,110), ('Grilled Salmon Bowl','Quinoa',0.07,3,120),
  ('Light Fish','Salmon fillet',0.17,5,110),
  -- starters
  ('Ranch Chicken Rolls','Chicken breast',0.10,6,110), ('Ranch Chicken Rolls','Tortilla wrap',2.0,3,120), ('Ranch Chicken Rolls','Ranch dressing',0.03,3,130),
  ('Mozzarella Sticks','Mozzarella stick',5.0,2,110),
  ('Super Sampler','Mozzarella stick',2.0,2,110), ('Super Sampler','Chicken tender',2.0,3,120), ('Super Sampler','Chicken wing',4.0,3,130), ('Super Sampler','Potato',0.20,18,140),
  ('Veggie Soup','Tomato',0.10,10,10), ('Veggie Soup','Onion',0.05,8,20), ('Veggie Soup','Potato',0.08,18,30), ('Veggie Soup','Paper cup',1.0,1,900),
  ('Chicken Strips','Chicken tender',5.0,3,110), ('Buffalo Chicken Strips','Chicken tender',5.0,3,110), ('Buffalo Chicken Strips','Buffalo sauce',0.04,3,120),
  ('BBQ Chicken Strips','Chicken tender',5.0,3,110), ('BBQ Chicken Strips','BBQ sauce',0.04,3,120),
  ('Buffalo Wings','Chicken wing',8.0,3,110), ('Buffalo Wings','Buffalo sauce',0.05,3,120),
  ('BBQ Wings','Chicken wing',8.0,3,110), ('BBQ Wings','BBQ sauce',0.05,3,120),
  ('Skin-on Fries','Potato',0.28,18,110), ('Curly Fries','Potato',0.28,20,110), ('Curly Fries','Flour',0.02,5,120),
  ('Potato Dippers','Potato',0.30,18,110),
  ('Fries n Cheddar','Potato',0.28,18,110), ('Fries n Cheddar','Cheddar sauce',0.06,3,120),
  ('Potato Dippers n Cheddar','Potato',0.30,18,110), ('Potato Dippers n Cheddar','Cheddar sauce',0.06,3,120),
  ('Crispy Dynamite Chicken','Chicken tender',4.0,3,110), ('Crispy Dynamite Chicken','Sweet chili sauce',0.04,3,120),
  ('Crispy Dynamite Shrimp','Shrimp',0.14,7,110), ('Crispy Dynamite Shrimp','Sweet chili sauce',0.04,3,120),
  ('Classic Nachos','Nacho chips',0.10,4,10), ('Classic Nachos','Cheddar sauce',0.07,3,20), ('Classic Nachos','Jalapeno',0.02,8,30), ('Classic Nachos','Takeaway box',1.0,1,900),
  ('Chicken Tacos','Tortilla wrap',2.0,3,10), ('Chicken Tacos','Chicken breast',0.12,6,20), ('Chicken Tacos','Guacamole',0.03,4,30), ('Chicken Tacos','Takeaway box',1.0,1,900),
  ('Vegan Tacos','Tortilla wrap',2.0,3,10), ('Vegan Tacos','Mushroom',0.09,15,20), ('Vegan Tacos','Guacamole',0.03,4,30), ('Vegan Tacos','Takeaway box',1.0,1,900),
  ('Kids Chicken Tenders Combo','Chicken tender',3.0,3,110), ('Kids Chicken Tenders Combo','Potato',0.16,18,120),
  ('Kids Beef Burger Combo','Potato',0.16,18,110), ('Kids Chicken Burger Combo','Potato',0.16,18,110),
  -- desserts
  ('Grand Lazy Cake','Lazy cake base',0.13,5,10), ('Grand Lazy Cake','Chocolate sauce',0.03,3,20),
  ('Oreo Cheesecake','Cheesecake base',0.13,5,10), ('Oreo Cheesecake','Oreo biscuit',0.04,4,20),
  ('Oreo Lover','Oreo ice cream',0.16,5,10), ('Oreo Lover','Oreo biscuit',0.05,4,20), ('Oreo Lover','Whipped cream',0.03,4,30),
  ('Lotus Madness','Lotus ice cream',0.16,5,10), ('Lotus Madness','Lotus biscuit',0.05,4,20), ('Lotus Madness','Salted caramel sauce',0.03,3,30),
  ('Choco Tacos','Choco taco shell',2.0,3,10), ('Choco Tacos','Vanilla ice cream',0.10,5,20), ('Choco Tacos','Chocolate sauce',0.03,3,30),
  ('Apple Crisp','Apple crisp mix',0.14,5,10), ('Apple Crisp','Vanilla ice cream',0.08,5,20),
  ('Roadster Sundae','Vanilla ice cream',0.15,5,10), ('Roadster Sundae','Chocolate sauce',0.03,3,20), ('Roadster Sundae','Whipped cream',0.03,4,30),
  ('Banana O Rum','Banana',0.18,10,10), ('Banana O Rum','Vanilla ice cream',0.12,5,20), ('Banana O Rum','Rum essence',0.005,0,30),
  ('Cheesecake Sundae Explosion','Cheesecake base',0.10,5,10), ('Cheesecake Sundae Explosion','Vanilla ice cream',0.12,5,20), ('Cheesecake Sundae Explosion','Salted caramel sauce',0.03,3,30),
  ('Brownie Temptation','Brownie base',0.12,5,10), ('Brownie Temptation','Vanilla ice cream',0.10,5,20), ('Brownie Temptation','Chocolate sauce',0.03,3,30),
  ('Marbled Mud Pie','Chocolate ice cream',0.16,5,10), ('Marbled Mud Pie','Chocolate sauce',0.04,3,20),
  ('Fun-sized Lotus Mud Pie','Lotus ice cream',0.09,5,10), ('Fun-sized Lotus Mud Pie','Lotus biscuit',0.03,4,20),
  ('Fun-sized Oreo Mud Pie','Oreo ice cream',0.09,5,10), ('Fun-sized Oreo Mud Pie','Oreo biscuit',0.03,4,20),
  ('Vegan Brownie','Brownie base',0.12,5,10),
  -- drinks
  ('Old Time Milkshake','Vanilla ice cream',0.18,5,10), ('Old Time Milkshake','Fresh milk',0.10,3,20),
  ('Iced Tea','Iced tea syrup',0.06,2,10), ('Soft Drink','Cola syrup',0.06,2,10),
  ('Sparkling Water','Sparkling water 330ml',1.0,1,10), ('Mineral Water','Mineral water 500ml',1.0,1,10),
  ('Fresh Orange Juice','Orange',0.45,8,10), ('Fresh Lemonade','Lemon',0.20,8,10), ('Fresh Lemonade','Lemonade syrup',0.04,2,20),
  ('Red Bull','Red Bull can',1.0,1,10), ('Local Beer','Local beer',1.0,1,10), ('Imported Beer','Imported beer',1.0,1,10),
  ('Coffee','Coffee beans',0.020,4,10)
) as v(item, ing_name, qty, waste, seq)
join public.products mp on mp.company_id='aa510000-0000-4000-8000-0000000000c0' and mp.name = v.item
join public.boms b on b.product_id = mp.id
join public.products ing on ing.company_id='aa510000-0000-4000-8000-0000000000c0' and ing.name = v.ing_name
where not exists (select 1 from public.bom_lines x where x.bom_id = b.id and x.product_id = ing.id);

-- Cost the whole menu from its recipe.
update public.products p
   set cost_price = public.plate_cost(p.id)
 where p.company_id='aa510000-0000-4000-8000-0000000000c0'
   and p.is_sellable and p.is_active
   and exists (select 1 from public.boms b where b.product_id = p.id);
