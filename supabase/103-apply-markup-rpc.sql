-- ============================================================================
-- 103-apply-markup-rpc.sql  -  Recompute every product's sale price from its
-- cost using a company-level markup %. Called from Company Profile > Tax &
-- accounting > "Apply to product prices". SECURITY DEFINER but guarded by the
-- existing can_write_company() check so a user can only touch their own company.
-- Safe to re-run.
-- ============================================================================
create or replace function public.apply_catalog_markup(p_company uuid, p_pct numeric)
returns integer language plpgsql security definer set search_path = public as $fn$
declare n integer;
begin
  if not public.can_write_company(p_company) then
    raise exception 'not authorized for this company';
  end if;
  update public.products
     set list_price = round(cost_price * (1 + p_pct / 100.0), 2), updated_at = now()
   where company_id = p_company and cost_price > 0;
  get diagnostics n = row_count;
  return n;
end $fn$;

grant execute on function public.apply_catalog_markup(uuid, numeric) to authenticated;
