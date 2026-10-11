-- 225: the scope under each line reads as a list, because it is one.
--
-- Odoo held each scope as one long sentence: "Curtain wall 1- Review system
-- concept 2- typical interfaces 3- glass type, silicone/VEC logic 4- drainage,
-- slab edge connection". On screen that is a cell of run-on text, and on the
-- printed quotation it is four lines of grey with no shape at all, which is a
-- poor way to show a customer what they are buying.
--
-- The words are untouched. A line break goes in front of each "1- ", "2- "
-- marker the author already wrote, so the scope prints as the list it was
-- written as. The print keeps the breaks (the description cell is pre-wrap),
-- and so does the form.
--
-- Scoped to this one quotation and the invoice raised from it: the same rule
-- applied blindly to every description in the database would be a guess.
update public.sale_order_lines l
   set name = regexp_replace(l.name, '[[:space:]]+([0-9]{1,2}-[[:space:]])', E'\n\\1', 'g')
 where l.line_type = 'item'
   and l.order_id = (select o.id from public.sale_orders o
                      where o.number = 'S00021'
                        and o.company_id = (select id from public.companies where name = 'Space Work S.A.R.L'));

update public.invoice_lines l
   set name = regexp_replace(l.name, '[[:space:]]+([0-9]{1,2}-[[:space:]])', E'\n\\1', 'g')
 where l.line_type = 'item'
   and l.invoice_id = (select i.id from public.invoices i
                        where i.number = 'INV/2026/00003'
                          and i.company_id = (select id from public.companies where name = 'Space Work S.A.R.L'));

select l.sequence, left(replace(l.name, chr(10), ' / '), 90) as reads_as
from public.sale_order_lines l
where l.order_id = (select o.id from public.sale_orders o
                     where o.number = 'S00021'
                       and o.company_id = (select id from public.companies where name = 'Space Work S.A.R.L'))
order by l.sequence;
