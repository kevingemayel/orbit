-- ============================================================================
-- 156-cost-basis.sql  -  where a cost price came from.
--
-- A cost of 0.00 and a cost somebody typed from memory look identical in the
-- product list, and both feed margin, plate cost and job cost as if they were
-- fact. This records the working behind every cost so an estimate is visibly
-- an estimate, and so a rate change can recompute every item that used it.
--
-- For an extruded profile the cost is not a price at all, it is arithmetic:
-- kilograms per metre (the extruder's own figure) x bar length x the alloy
-- rate. Store the two physical facts and the rate, and the cost follows.
-- ============================================================================

alter table public.products add column if not exists cost_source text;      -- purchase | purchase_avg | weight_model | manual
alter table public.products add column if not exists cost_basis text;       -- the working, in one line, shown in the app
alter table public.products add column if not exists cost_rate numeric;     -- the rate used (per kg, per litre, per unit)
alter table public.products add column if not exists kg_per_m numeric;      -- extruder's weight per linear metre
alter table public.products add column if not exists bar_length_mm numeric; -- stock length the cost is quoted for
alter table public.products add column if not exists cost_updated_at timestamptz;

comment on column public.products.cost_source is 'purchase = a real invoice or supplier line; purchase_avg = average of several; weight_model = kg/m x length x rate; manual = typed in';
comment on column public.products.cost_basis is 'One line of working, shown under the cost field so nobody has to guess where the number came from.';

-- Anything already carrying a cost from the supplier price list keeps it, and
-- is marked as such rather than being left ambiguous.
update public.products p
   set cost_source = 'purchase',
       cost_basis = 'From the supplier price list on this product.',
       cost_updated_at = coalesce(cost_updated_at, now())
 where coalesce(p.cost_price,0) > 0
   and p.cost_source is null
   and exists (select 1 from public.product_supplier_prices s where s.product_id = p.id and coalesce(s.price,0) > 0);

create index if not exists products_cost_source_idx on public.products (company_id, cost_source);

-- Recompute every weight-derived cost from one rate. The point of storing the
-- physics separately: when the metal rate moves, one number changes and the
-- whole catalogue follows, instead of 112 people-hours of retyping.
--
-- security invoker on purpose - the caller's own row-level permissions apply,
-- so this cannot reach a company the user could not already write to. A real
-- purchase price or a typed one is never overwritten.
create or replace function public.recost_by_weight(p_company uuid, p_rate numeric, p_family text default null)
returns integer
language plpgsql
security invoker
set search_path = public
as $fn$
declare n integer;
begin
  if p_rate is null or p_rate <= 0 then raise exception 'a rate per kg is required'; end if;
  update public.products p
     set cost_price = round(p.kg_per_m * (coalesce(p.bar_length_mm, 1000) / 1000.0) * p_rate, 4),
         cost_rate = p_rate,
         cost_source = 'weight_model',
         cost_basis = 'Estimated from weight: ' || round(p.kg_per_m, 4) || ' kg/m x ' ||
                      round(coalesce(p.bar_length_mm, 1000) / 1000.0, 2) || ' m at ' || round(p_rate, 2) ||
                      ' per kg. Recalculated ' || to_char(now(), 'DD Mon YYYY') || '.',
         cost_updated_at = now()
   where p.company_id = p_company
     and p.kg_per_m is not null and p.kg_per_m > 0
     and (p_family is null or p.family = p_family)
     and coalesce(p.cost_source, 'weight_model') = 'weight_model';
  get diagnostics n = row_count;
  return n;
end $fn$;
