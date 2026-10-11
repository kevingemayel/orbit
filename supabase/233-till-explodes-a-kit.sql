-- 233: selling a kit at the till takes out the parts, not the kit.
--
-- A kit is a product made of other products: a gift box, a meal deal, a starter
-- set. Delivering one from a sales order already draws down its components, but
-- the till did not: it moved the kit itself, which is not a thing anybody holds
-- in stock, so the components stayed on the shelf for ever and the kit went
-- negative.
--
-- The till posting now asks the same question the delivery note asks: does this
-- product have components? If it does, the components move, at the kit's
-- quantity times each component's own. If it does not, the product moves as
-- before. The cost that posts follows the same split, so the cost of sales is
-- what the parts cost, not what a kit record happens to say.
create or replace function public.pos_stock_lines(p_batch_ids uuid[])
returns table (product_id uuid, qty numeric, store_id uuid, cost numeric, uom text)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  with sold as (
    select ol.product_id, sum(ol.qty) as qty, (array_agg(o.store_id))[1] as store_id
      from public.pos_order_lines ol
      join public.pos_orders o on o.id = ol.order_id
     where o.id = any(p_batch_ids)
     group by ol.product_id
  ),
  -- a kit disappears and its components take its place
  exploded as (
    select k.component_product_id as product_id, s.qty * coalesce(k.qty, 1) as qty, s.store_id
      from sold s join public.product_kit_components k on k.kit_product_id = s.product_id
    union all
    select s.product_id, s.qty, s.store_id
      from sold s
     where not exists (select 1 from public.product_kit_components k where k.kit_product_id = s.product_id)
  )
  select e.product_id, sum(e.qty) as qty, (array_agg(e.store_id))[1] as store_id,
         max(p.cost_price) as cost, max(p.uom) as uom
    from exploded e
    join public.products p on p.id = e.product_id
   where p.type in ('storable', 'consumable')
   group by e.product_id
  having sum(e.qty) > 0;
$fn$;

grant execute on function public.pos_stock_lines(uuid[]) to authenticated;

select 'pos_stock_lines ready' as done;
