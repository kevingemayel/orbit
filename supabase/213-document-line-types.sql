-- 213: a line on a document can be a heading or a note, not only an item.
--
-- A facade quotation is not a flat price list: it reads as "Tower Curtain Wall",
-- then the scope under it in words, then the next section. Orbit could only hold
-- priced items, so everything else had to go in the one note field at the bottom
-- or be left out. Odoo calls these line_section and line_note; this is the same
-- idea, on sale orders, purchase orders and invoices.
--
--   item    - what it has always been: product, quantity, price, tax
--   section - a heading that groups the lines under it
--   note    - free text under a line, printed with the document
--
-- A section or a note carries no quantity, price or tax and is left out of every
-- total, so nothing about existing documents changes: they are all items.
alter table public.sale_order_lines     add column if not exists line_type text not null default 'item';
alter table public.purchase_order_lines add column if not exists line_type text not null default 'item';
alter table public.invoice_lines        add column if not exists line_type text not null default 'item';

-- the discount column exists on sale and invoice lines but never did on purchase
-- lines, and the order form is one form for both
alter table public.purchase_order_lines add column if not exists discount numeric(7,4) default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sale_order_lines_line_type_chk') then
    alter table public.sale_order_lines add constraint sale_order_lines_line_type_chk check (line_type in ('item','section','note'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'purchase_order_lines_line_type_chk') then
    alter table public.purchase_order_lines add constraint purchase_order_lines_line_type_chk check (line_type in ('item','section','note'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoice_lines_line_type_chk') then
    alter table public.invoice_lines add constraint invoice_lines_line_type_chk check (line_type in ('item','section','note'));
  end if;
end $$;

select 'line types ready' as done;
