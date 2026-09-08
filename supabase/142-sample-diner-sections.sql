-- ============================================================================
-- 142-sample-diner-sections.sql  -  the menu sections as real categories.
--
-- SAMPLE DATA. Sections match the printed menu, which makes the Menu screens
-- read the way the owner's own menu reads, and gives the month generator a
-- clean way to build a plausible order (a main from Burgers, a side from
-- Starters, a drink from Drinks) instead of a long hand-kept name list.
-- Safe to re-run.
-- ============================================================================

insert into public.product_categories (company_id, name)
select 'aa510000-0000-4000-8000-0000000000c0', v.n
  from (values ('Lets get started'),('Salads'),('Sandwiches'),('Burgers'),('Angus'),
               ('Platters'),('Pasta'),('Go Light'),('Desserts'),('Kids'),('Drinks'),
               ('Ingredients')) as v(n)
 where not exists (select 1 from public.product_categories c
                    where c.company_id='aa510000-0000-4000-8000-0000000000c0' and c.name = v.n);

do $$
declare co uuid := 'aa510000-0000-4000-8000-0000000000c0';
begin
  update public.products p set category_id = c.id
    from public.product_categories c
   where c.company_id = co and p.company_id = co and c.name = 'Ingredients'
     and p.item_type = 'raw';

  update public.products p set category_id = c.id
    from public.product_categories c
   where c.company_id = co and p.company_id = co and p.is_sellable and p.is_active
     and c.name = case
       when p.name in ('Ranch Chicken Rolls','Mozzarella Sticks','Super Sampler','Veggie Soup','Chicken Strips',
                       'Buffalo Wings','BBQ Wings','Skin-on Fries','Curly Fries','Potato Dippers','Classic Nachos',
                       'Buffalo Chicken Strips','BBQ Chicken Strips','Fries n Cheddar','Potato Dippers n Cheddar',
                       'Crispy Dynamite Chicken','Crispy Dynamite Shrimp','Chicken Tacos','Vegan Tacos') then 'Lets get started'
       when p.name in ('Crab Slab Salad','Tex Mex Salad','Baby Mozzarella n Chicken','Pasta n Cheese Salad',
                       'Field Greens Avocado','Vegan Quinoa Salad','Classic Caesar','Chicken Caesar',
                       'Classic Chef Salad','Chicken Avocado Salad','Kale Chicken Wasabi','Kale Shrimp Wasabi',
                       'Freekale Salad','Asian Crab Noodles','Sweet n Chili Shrimp','Kale Salmon Bowl') then 'Salads'
       when p.name in ('Roadside Crab','Chicken Slider','Chicken Sandwich','Shrimp Guacamole','Smoky Chicken',
                       'Philly Chicken','Philly Steak','Ranch Chicken Avocado','Crispy Shrimp Avocado') then 'Sandwiches'
       when p.name like 'Angus%' then 'Angus'
       when p.name in ('Classic Burger','Route 66 Burger','Diner-Mite Burger','Swiss Truffle Burger',
                       'B.B.B. Beef Burger','B.B.B. Chicken Burger','Cuban Burger','Evergreen Burger',
                       'Chicken Burger','Mighty Chicken Burger','Cheese n Cheese Burger','Vegan Burger',
                       'Vegan Mushroom Burger','Mad Dawg','Cheese-at-Heart') then 'Burgers'
       when p.name in ('Grilled Chicken Platter','Casual Steak','Breaded Chicken Platter','Steak n Fries',
                       'Truffle Chicken Boursin','Grilled Salmon Bowl') then 'Platters'
       when p.name like '%Pasta%' and p.name <> 'Pasta n Cheese Salad' then 'Pasta'
       when p.name in ('Salmon Beat Salad','Super Quinoa Salad','Tunaoa Salad','Low in Smoke','Wonder Chicken',
                       'Low-Cal Tuna','Salmon Hero','Fit n Burger','Grain Chicken Burger','Light Grilled Chicken',
                       'Light Fish') then 'Go Light'
       when p.station = 'pastry' then 'Desserts'
       when p.name like 'Kids%' or p.name = 'Junior Four Cheese Pasta' then 'Kids'
       when p.station in ('bar','barista') then 'Drinks'
       else 'Burgers' end;
end $$;

-- Refresh the menus against the real menu, and put everything on the all-day
-- menu since this chain does not run a separate breakfast service.
delete from public.menu_items where company_id='aa510000-0000-4000-8000-0000000000c0';
delete from public.menus where company_id='aa510000-0000-4000-8000-0000000000c0';

insert into public.menus (id, company_id, name, code, days_of_week, start_time, end_time, sort)
values
  ('aa510000-0000-4000-8000-00000000ee02','aa510000-0000-4000-8000-0000000000c0','All day','allday','{0,1,2,3,4,5,6}','11:00','23:59',10),
  ('aa510000-0000-4000-8000-00000000ee03','aa510000-0000-4000-8000-0000000000c0','Late night','late','{4,5,6}','23:00','02:00',20)
on conflict (id) do nothing;

insert into public.menu_items (company_id, menu_id, product_id, sort)
select 'aa510000-0000-4000-8000-0000000000c0','aa510000-0000-4000-8000-00000000ee02', p.id, 10
  from public.products p
 where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.is_sellable and p.is_active
on conflict (menu_id, product_id) do nothing;

-- The late menu is the quick half of the kitchen only.
insert into public.menu_items (company_id, menu_id, product_id, sort)
select 'aa510000-0000-4000-8000-0000000000c0','aa510000-0000-4000-8000-00000000ee03', p.id, 10
  from public.products p
  join public.product_categories c on c.id = p.category_id
 where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.is_sellable and p.is_active
   and c.name in ('Burgers','Lets get started','Drinks','Desserts')
on conflict (menu_id, product_id) do nothing;

-- Channel prices for every live item, effective from the start of the month.
delete from public.product_prices where company_id='aa510000-0000-4000-8000-0000000000c0';
insert into public.product_prices (company_id, product_id, channel_id, price, currency_code, valid_from, note)
select 'aa510000-0000-4000-8000-0000000000c0', p.id, c.id,
       round(p.list_price * (1 + c.markup_percent / 100.0), 2), 'USD', date '2026-08-01',
       case when c.markup_percent > 0 then 'Aggregator markup to absorb commission' else 'Opening price' end
  from public.products p
  cross join public.sales_channels c
 where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.is_sellable and p.is_active
   and c.company_id='aa510000-0000-4000-8000-0000000000c0';

-- Modifier groups now attach to the real families.
delete from public.product_modifier_groups where company_id='aa510000-0000-4000-8000-0000000000c0';
insert into public.product_modifier_groups (company_id, product_id, group_id, sort)
select 'aa510000-0000-4000-8000-0000000000c0', p.id, g.id, g.sort
  from public.products p
  join public.product_categories pc on pc.id = p.category_id
  join public.modifier_groups g on g.company_id='aa510000-0000-4000-8000-0000000000c0'
 where p.company_id='aa510000-0000-4000-8000-0000000000c0' and p.is_sellable and p.is_active
   and (
     (g.code = 'doneness'  and pc.name in ('Burgers','Angus') and p.name not like '%Chicken%' and p.name not like 'Vegan%') or
     (g.code = 'addons'    and pc.name in ('Burgers','Angus','Sandwiches')) or
     (g.code = 'side'      and pc.name in ('Burgers','Angus','Sandwiches','Platters')) or
     (g.code = 'drinksize' and pc.name = 'Drinks')
   )
on conflict (product_id, group_id) do nothing;
