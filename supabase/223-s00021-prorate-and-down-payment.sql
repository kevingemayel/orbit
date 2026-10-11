-- 223: Francois Eid's quotation, as the deal actually closed.
--
-- Kevin: "francois confirmed the last quotation do prorate for all values for
-- the quotation to become 1000$ , invoice it and all and mark a 1500$ on the
-- invoice". The figure is 10,000: S00021 was quoted at 10,800, the invoice
-- already raised against it is 10,000, and the gap was bridged in Odoo by a
-- line called "Discount" of -800 stuck on the end of the invoice. Prorating is
-- what he asked for instead, so the reduction is spread across the seven scope
-- lines rather than dangling at the bottom.
--
--   quoted 10,800 (18,000 of scope less 40 percent)
--   agreed 10,000, which is 0.925926 of it
--   so every line keeps its published price and its discount moves from 40 to
--   about 44.44 percent; the cent of rounding is carried by the largest line
--
-- Then the deal is recorded the way it happened: the quotation is confirmed and
-- fully invoiced, and the 1,500 Francois already paid on signature shows ON the
-- invoice, so it asks for the 8,500 he still owes.
--
-- Why the 1,500 is a line on the invoice and not a payment against it: the
-- down payment was taken in Odoo as a sales receipt (INV/2026/00002), which has
-- already credited 1,500 of revenue and banked 1,500 of cash. Registering it a
-- second time as a payment would show 3,000 of cash collected on a 10,000 job
-- and leave revenue at 11,500. As a deduction line the books read correctly:
--
--   revenue   1,500 (the receipt) + 8,500 (this invoice) = 10,000
--   cash      1,500 collected
--   owed      8,500, which is what the invoice now asks for

-- @chunk
-- the seven scope lines, prorated to the agreed 10,000
do $t$
declare v_order uuid;
begin
  select o.id into v_order from public.sale_orders o
   where o.number = 'S00021'
     and o.company_id = (select id from public.companies where name = 'Space Work S.A.R.L');
  if v_order is null then raise exception 'S00021 is not in this database'; end if;

  update public.sale_order_lines l set discount = v.disc, price_subtotal = v.net
  from (values
    (10, 44.4443::numeric, 1666.67::numeric),   -- 3,000 curtain wall
    (20, 44.4444, 1388.89),                     -- 2,500 external cladding
    (30, 44.4444, 1388.89),                     -- 2,500 entrances
    (40, 44.4444, 1388.89),                     -- 2,500 vertical louvers
    (50, 44.4444, 1388.89),                     -- 2,500 residential windows
    (60, 44.4444, 1000.00),                     -- 1,800 balustrades
    (70, 44.4447, 1777.77)                      -- 3,200 technical specification, carries the rounding
  ) as v(seq, disc, net)
  where l.order_id = v_order and l.sequence = v.seq and l.line_type = 'item';

  -- the down payment was a line with no quantity and a price of -1,500, which
  -- printed as a row worth 0.00. It is what it says it is: a note under the
  -- Down Payments heading, in no total.
  update public.sale_order_lines l
     set line_type = 'note',
         name = 'Down payment of USD 1,500.00 received on signature, receipt INV/2026/00002.',
         quantity = 0, unit_price = 0, discount = 0, price_subtotal = 0, product_id = null
   where l.order_id = v_order and l.sequence = 90;

  update public.sale_orders o
     set amount_untaxed = 10000, amount_tax = 0, amount_total = 10000,
         state = 'sale'                      -- Francois confirmed it
   where o.id = v_order;

  -- every line is covered by the invoice already raised against this order
  update public.sale_order_lines l set qty_invoiced = l.quantity
   where l.order_id = v_order and l.line_type = 'item';
end $t$;

-- @chunk
-- the milestones in the terms are 25 percent each, so they follow the total
update public.sale_orders
   set narration = replace(narration, '| 25% | 2,700', '| 25% | 2,500')
 where number = 'S00021'
   and company_id = (select id from public.companies where name = 'Space Work S.A.R.L');

update public.invoices
   set narration = replace(narration, '| 25% | 2,700', '| 25% | 2,500')
 where number = 'INV/2026/00003'
   and company_id = (select id from public.companies where name = 'Space Work S.A.R.L');

-- @chunk
-- the invoice: the same prorated lines, less the down payment already received
do $t$
declare
  v_co uuid; v_inv uuid; v_order uuid; e public.journal_entries; inv public.invoices; settled numeric;
begin
  select id into v_co from public.companies where name = 'Space Work S.A.R.L';
  select o.id into v_order from public.sale_orders o where o.number = 'S00021' and o.company_id = v_co;
  select * into inv from public.invoices where number = 'INV/2026/00003' and company_id = v_co;
  if inv.id is null then raise exception 'INV/2026/00003 is not in this database'; end if;
  v_inv := inv.id;
  select * into e from public.journal_entries where id = inv.journal_entry_id;

  -- the posted version is kept, exactly as Edit keeps it
  settled := round(coalesce(inv.amount_total, 0) - coalesce(inv.amount_residual, inv.amount_total, 0), 2);
  insert into public.document_revisions (company_id, doc_type, doc_id, doc_number, reason, snapshot)
  values (v_co, 'invoice', inv.id, inv.number,
    'Prorated to the agreed 10,000 and the 1,500 down payment shown on the invoice',
    jsonb_build_object(
      'invoice', to_jsonb(inv),
      'partner', (select p.name from public.partners p where p.id = inv.partner_id),
      'settled', settled,
      'lines', coalesce((select jsonb_agg(to_jsonb(il) order by il.sequence, il.id)
                           from public.invoice_lines il where il.invoice_id = inv.id), '[]'::jsonb),
      'entry', case when e.id is null then null else to_jsonb(e) end,
      'entry_lines', coalesce((select jsonb_agg(to_jsonb(jl) order by jl.id)
                                 from public.journal_lines jl where jl.entry_id = e.id), '[]'::jsonb)));

  -- back to draft through the reopen path the guards expect
  if e.id is not null and e.state = 'posted' then
    perform set_config('orbit.reopen_entry', e.id::text, true);
    update public.journal_entries set state = 'draft', posted_at = null where id = e.id;
    perform set_config('orbit.reopen_entry', '', true);
  end if;
  if e.id is not null then delete from public.journal_lines where entry_id = e.id; end if;
  perform set_config('orbit.reopen_invoice', v_inv::text, true);
  update public.invoices set state = 'draft' where id = v_inv;
  perform set_config('orbit.reopen_invoice', '', true);

  -- the invoice says what the order says
  delete from public.invoice_lines where invoice_id = v_inv;
  insert into public.invoice_lines (company_id, invoice_id, sequence, line_type, product_id, name,
                                    quantity, unit_price, discount, price_subtotal)
  select v_co, v_inv, l.sequence, l.line_type, l.product_id, l.name,
         l.quantity, l.unit_price, l.discount, l.price_subtotal
    from public.sale_order_lines l
   where l.order_id = v_order
   order by l.sequence;

  insert into public.invoice_lines (company_id, invoice_id, sequence, line_type, name,
                                    quantity, unit_price, discount, price_subtotal)
  values (v_co, v_inv, 100, 'item',
          'Less down payment received on signature, receipt INV/2026/00002',
          1, -1500, 0, -1500);

  update public.invoices set amount_untaxed = 8500, amount_tax = 0, amount_total = 8500,
                             amount_residual = 8500
   where id = v_inv;

  perform public.post_invoice(v_inv);
end $t$;

-- @chunk
select 'order' as what, o.number as doc, o.state as state,
       o.amount_total::text as total, '' as residual
from public.sale_orders o
where o.number = 'S00021' and o.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
union all
select 'order lines', count(*)::text, string_agg(distinct l.line_type, ', '),
       sum(l.price_subtotal)::text, ''
from public.sale_order_lines l
where l.order_id = (select id from public.sale_orders where number = 'S00021'
   and company_id = (select id from public.companies where name = 'Space Work S.A.R.L'))
union all
select 'invoice', i.number, i.state, i.amount_total::text, i.amount_residual::text
from public.invoices i
where i.number in ('INV/2026/00002', 'INV/2026/00003')
  and i.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
union all
select 'ledger ' || a.code, a.name, '', sum(jl.debit)::text, sum(jl.credit)::text
from public.journal_lines jl
join public.accounts a on a.id = jl.account_id
join public.journal_entries e on e.id = jl.entry_id
where e.id in (select journal_entry_id from public.invoices
               where number in ('INV/2026/00002', 'INV/2026/00003')
                 and company_id = (select id from public.companies where name = 'Space Work S.A.R.L'))
group by a.code, a.name
order by 1, 2;
