-- 215: split tax out of the two purchase order totals.
--
-- 210 had only Odoo's amount_total for a purchase order and put it in both the
-- untaxed and the total field, because the August export carried no lines. The
-- lines are here now (212), and they show the difference is tax: P00005 is 96.00
-- of goods against a 99.96 total, P00006 is 50.00 against 55.50. The untaxed
-- amount is taken from the lines and the tax is what is left over.
update public.purchase_orders o
   set amount_untaxed = x.lines_total,
       amount_tax = round(o.amount_total - x.lines_total, 2)
from (
  select l.order_id, round(sum(l.quantity * l.unit_price * (1 - coalesce(l.discount,0)/100)), 2) as lines_total
  from public.purchase_order_lines l group by l.order_id
) x
where x.order_id = o.id
  and o.company_id = '183e96d4-afd9-4ca4-b311-2e03e0c36ffb'
  and abs(o.amount_untaxed - x.lines_total) > 0.01;

select o.number, o.amount_untaxed, o.amount_tax, o.amount_total
from public.purchase_orders o
where o.company_id = '183e96d4-afd9-4ca4-b311-2e03e0c36ffb'
order by o.number;
