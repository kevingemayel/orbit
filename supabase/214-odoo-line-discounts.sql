-- 214: the discount Odoo held per line, which 212 dropped.
--
-- Odoo prices a line and then takes a percentage off it: the design phase on
-- S00021 is priced at 3,000 and charged at 1,800, which is 40 percent off. 212
-- brought over the price and the net subtotal but not the percentage between
-- them, so Orbit, which works a line out as quantity times price, showed 18,000
-- on a quotation whose total is 10,800.
--
-- The percentage is not matched by name here, it is read back out of the figures:
-- where a line's quantity times its price is not what the line is actually worth,
-- the difference IS the discount. Exact for every row Odoo discounted, and it
-- touches nothing where the two already agree.
do $disc$
declare
  v_co uuid := '183e96d4-afd9-4ca4-b311-2e03e0c36ffb';   -- Space Work S.A.R.L
  n_so int; n_po int; n_inv int;
begin
  update public.sale_order_lines l
     set discount = round((1 - l.price_subtotal / (l.quantity * l.unit_price)) * 100, 4)
   from public.sale_orders o
   where o.id = l.order_id and o.company_id = v_co
     and l.quantity * l.unit_price <> 0
     and abs(l.quantity * l.unit_price - l.price_subtotal) > 0.005
     and coalesce(l.discount, 0) = 0;
  get diagnostics n_so = row_count;

  update public.purchase_order_lines l
     set discount = round((1 - l.price_subtotal / (l.quantity * l.unit_price)) * 100, 4)
   from public.purchase_orders o
   where o.id = l.order_id and o.company_id = v_co
     and l.quantity * l.unit_price <> 0
     and abs(l.quantity * l.unit_price - l.price_subtotal) > 0.005
     and coalesce(l.discount, 0) = 0;
  get diagnostics n_po = row_count;

  update public.invoice_lines l
     set discount = round((1 - l.price_subtotal / (l.quantity * l.unit_price)) * 100, 4)
   from public.invoices i
   where i.id = l.invoice_id and i.company_id = v_co
     and l.quantity * l.unit_price <> 0
     and abs(l.quantity * l.unit_price - l.price_subtotal) > 0.005
     and coalesce(l.discount, 0) = 0;
  get diagnostics n_inv = row_count;

  raise notice 'discounts read back: % sale order, % purchase order, % invoice line(s)', n_so, n_po, n_inv;
end $disc$;

-- every document should now multiply out to its own header
select o.number,
       o.amount_untaxed as header,
       round(sum(l.quantity * l.unit_price * (1 - coalesce(l.discount,0)/100)), 2) as lines_work_out_to
from public.sale_orders o join public.sale_order_lines l on l.order_id = o.id
where o.company_id = '183e96d4-afd9-4ca4-b311-2e03e0c36ffb'
group by o.number, o.amount_untaxed
having abs(round(sum(l.quantity * l.unit_price * (1 - coalesce(l.discount,0)/100)), 2) - o.amount_untaxed) > 0.01;
