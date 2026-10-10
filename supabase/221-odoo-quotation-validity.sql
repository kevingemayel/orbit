-- 221: the date each quotation stops standing.
--
-- Odoo keeps sale.order.validity_date, Orbit has the column and never filled
-- it, and the quotation form never showed it. It is now on the form as <b>Valid
-- until</b>, it prints on the quotation, and a date that has passed shows an
-- Expired badge while the order is still a quotation. So the real dates come
-- over with the terms they belong to: S00021 stood until 27 May 2026, S00002
-- until 6 January 2025.
--
-- Odoo's client_order_ref (the customer's own reference) is empty on all
-- sixteen, so there is nothing to bring across into Reference.
update public.sale_orders o set validity_date = v.d
from (values
  ('S00021', '2026-05-27'::date),
  ('S00020', '2026-03-09'),
  ('S00019', '2026-03-09'),
  ('S00018', '2026-02-26'),
  ('S00016', '2025-11-10'),
  ('S00015', '2025-11-10'),
  ('S00014', '2025-11-10'),
  ('S00013', '2025-11-10'),
  ('S00012', '2025-10-11'),
  ('S00011', '2025-08-19'),
  ('S00010', '2025-08-14'),
  ('S00009', '2025-07-20'),
  ('S00007', '2025-06-17'),
  ('S00006', '2025-03-08'),
  ('S00004', '2025-03-05'),
  ('S00002', '2025-01-06')
) as v(num, d)
where o.number = v.num
  and o.company_id = (select id from public.companies where name = 'Space Work S.A.R.L');

select o.number, o.date_order, o.validity_date, o.state,
       length(coalesce(o.narration, '')) as terms_chars
from public.sale_orders o
where o.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
order by o.number;
