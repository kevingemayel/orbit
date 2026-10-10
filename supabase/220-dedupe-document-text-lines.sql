-- 220: the same note twice on one invoice.
--
-- 212 brought Odoo's invoice notes over with their line breaks flattened; 219
-- brought the two it had missed over with the breaks intact, and its "is it
-- already there" test compared the text character for character. So
-- INV/2025/00009 ended up carrying the same three window references twice, once
-- as one run-on line and once as three.
--
-- This removes a heading or a note that repeats another one on the same document
-- once their spacing is normalised, and keeps the one that reads properly: the
-- one with the line breaks, and failing that the one entered first. A heading or
-- a note carries no money, so nothing here touches a total or the ledger - and
-- the same comparison is now what 219 uses, so a replay cannot do it again.
with dupes as (
  select l.id,
         row_number() over (
           partition by l.invoice_id, l.line_type, regexp_replace(lower(l.name), '[[:space:]]+', ' ', 'g')
           order by (case when l.name like '%' || chr(10) || '%' then 0 else 1 end), l.sequence, l.id
         ) as rn
  from public.invoice_lines l
  where coalesce(l.line_type, 'item') <> 'item'
)
delete from public.invoice_lines l
 using dupes d
 where d.id = l.id and d.rn > 1;

-- the same thing can happen on an order, so the same rule runs there
with dupes as (
  select l.id,
         row_number() over (
           partition by l.order_id, l.line_type, regexp_replace(lower(l.name), '[[:space:]]+', ' ', 'g')
           order by (case when l.name like '%' || chr(10) || '%' then 0 else 1 end), l.sequence, l.id
         ) as rn
  from public.sale_order_lines l
  where coalesce(l.line_type, 'item') <> 'item'
)
delete from public.sale_order_lines l
 using dupes d
 where d.id = l.id and d.rn > 1;

with dupes as (
  select l.id,
         row_number() over (
           partition by l.order_id, l.line_type, regexp_replace(lower(l.name), '[[:space:]]+', ' ', 'g')
           order by (case when l.name like '%' || chr(10) || '%' then 0 else 1 end), l.sequence, l.id
         ) as rn
  from public.purchase_order_lines l
  where coalesce(l.line_type, 'item') <> 'item'
)
delete from public.purchase_order_lines l
 using dupes d
 where d.id = l.id and d.rn > 1;

select i.number, l.sequence, l.line_type, left(replace(l.name, chr(10), ' / '), 70) as text
from public.invoice_lines l join public.invoices i on i.id = l.invoice_id
where coalesce(l.line_type, 'item') <> 'item'
order by i.number, l.sequence;
