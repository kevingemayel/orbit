-- ============================================================================
-- 179-receipts.sql  -  a goods receipt is a document you can find and edit.
--
-- A receipt (stock_pickings) was saved with no number and no link to the
-- purchase order it received, and its stock moves did not say which order line
-- they filled. So there was no list of receipts, and nothing to correct one
-- from. Now:
--   1. every receipt, return and internal receipt is numbered on insert
--      (REC/00001, RET/00001, INT/00001, per company), and the existing ones
--      are numbered in the order they were made;
--   2. a receipt keeps the purchase order it came from (po_id), filled in for
--      the existing ones from their source document;
--   3. a stock move keeps the purchase order line it received (po_line_id),
--      so an edit can put the order's received quantity right.
-- ============================================================================

alter table public.stock_moves add column if not exists po_line_id uuid references public.purchase_order_lines(id) on delete set null;
create index if not exists stock_moves_picking_idx on public.stock_moves (picking_id);
create index if not exists stock_pickings_company_idx on public.stock_pickings (company_id, created_at desc);
create index if not exists stock_pickings_po_idx on public.stock_pickings (po_id);

create or replace function public.stock_picking_number() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare pfx text; n int;
begin
  if new.number is not null and btrim(new.number) <> '' then return new; end if;
  pfx := case new.type when 'return' then 'RET/' when 'internal' then 'INT/' else 'REC/' end;
  -- two receipts saved at the same moment must not take the same number
  perform pg_advisory_xact_lock(hashtext(new.company_id::text || pfx));
  select coalesce(max((substring(p.number from '(\d+)$'))::int), 0) + 1 into n
    from public.stock_pickings p where p.company_id = new.company_id and p.number like pfx || '%';
  new.number := pfx || lpad(n::text, 5, '0');
  return new;
end $fn$;
revoke all on function public.stock_picking_number() from public, anon;

drop trigger if exists trg_stock_picking_number on public.stock_pickings;
create trigger trg_stock_picking_number before insert on public.stock_pickings
  for each row execute function public.stock_picking_number();

-- number the receipts already made, oldest first
with x as (
  select id, case type when 'return' then 'RET/' when 'internal' then 'INT/' else 'REC/' end as pfx,
         row_number() over (partition by company_id, case type when 'return' then 'RET/' when 'internal' then 'INT/' else 'REC/' end order by created_at, id) as rn
    from public.stock_pickings where number is null or btrim(number) = ''
)
update public.stock_pickings p set number = x.pfx || lpad(x.rn::text, 5, '0') from x where p.id = x.id;

-- link the existing receipts to the purchase order named as their source document
update public.stock_pickings p set po_id = o.id
  from public.purchase_orders o
 where p.po_id is null and o.company_id = p.company_id and o.number = p.origin;
