-- ============================================================================
-- 175-definer-function-grants.sql  -  no full-rights function is left open to
-- a caller who has not signed in, unless it is a public endpoint by design.
--
-- A sweep of every SECURITY DEFINER function the anonymous role could execute
-- (102 of them) after the backup_build finding. Functions that are public on
-- purpose keep their grant: the booking page, careers, event registration and
-- RSVP, approve-by-email, the website renderer and forms, the REST API gateway
-- (checks its own key), the scheduled jobs (check a shared secret), the portal
-- (checks the signed-in email) and the helpers row-level policies call. The
-- rest were open for no reason, and some of them mattered:
--   * webhook_fire sent a correctly signed event to any company's webhook
--     endpoints with whatever payload the caller supplied: a forged event the
--     receiving system would trust. Only its triggers call it.
--   * sample_refresh_book and sample_refresh_service delete today's bookings
--     and the open till orders of the company passed in: any company. They are
--     for the sample diner and are run by hand.
--   * run_orbit_automations writes reminders for every company; pg_cron runs it.
--   * post_entry, post_invoice, register_payment, reconcile_bank_line,
--     fx_revalue and setup_company skip their permission check when there is
--     no signed-in user, so an anonymous caller passed it.
--   * theoretical_usage and appt_next_file_no read any company's data with no
--     membership check; plate_cost, price_of, explode_recipe, royalty_due and
--     order_balance return any product's cost, price or recipe.
-- ============================================================================

-- only the database's own jobs and triggers
do $g$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f'
              and p.proname in ('webhook_fire', 'sample_refresh_book', 'sample_refresh_service', 'run_orbit_automations') loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $g$;

-- signed-in users only
do $g$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f'
              and p.proname in ('post_entry', 'post_invoice', 'register_payment', 'reconcile_bank_line', 'fx_revalue', 'setup_company',
                                'theoretical_usage', 'plate_cost', 'price_of', 'explode_recipe', 'royalty_due', 'order_balance',
                                'appt_next_file_no', 'member_role_row', '_is_last_owner', 'company_account', 'je_next_number') loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $g$;

-- and the two that read a whole company answer only for the caller's companies
create or replace function public.theoretical_usage(p_company uuid, p_from date, p_to date, p_store uuid default null::uuid)
 returns table(product_id uuid, product_name text, qty numeric, unit_cost numeric, value numeric)
 language sql
 stable security definer
 set search_path to 'public'
as $function$ with sold as ( select l.product_id as sold_product, sum(l.qty) as sold_qty from public.pos_order_lines l join public.pos_orders o on o.id = l.order_id where o.company_id = p_company and p_company in (select public.my_company_ids()) and coalesce(o.status,'') <> 'cancelled' and o.created_at >= p_from::timestamptz and o.created_at < (p_to + 1)::timestamptz and (p_store is null or o.store_id = p_store) and l.product_id is not null group by l.product_id ), exploded as ( select e.pid, e.qty * s.sold_qty as qty from sold s cross join lateral public.explode_recipe(s.sold_product, 1) e ) select x.pid, p.name, round(sum(x.qty), 4), round(coalesce(p.cost_price, 0), 4), round(sum(x.qty) * coalesce(p.cost_price, 0), 2) from exploded x join public.products p on p.id = x.pid group by x.pid, p.name, p.cost_price order by 5 desc; $function$;

create or replace function public.appt_next_file_no(p_company uuid, p_prefix text default 'F'::text)
 returns text
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(p_prefix, 'F') || '-' ||
         lpad((coalesce(max(nullif(regexp_replace(f.file_no, '^.*[^0-9]', '', 'g'), '')::int), 0) + 1)::text, 4, '0')
    from public.appt_files f
   where f.company_id = p_company
     and p_company in (select public.my_company_ids())
     and f.file_no is not null
     and f.file_no ~ ('^' || coalesce(p_prefix, 'F') || '-[0-9]+$');
$function$;

-- create or replace keeps grants, but say it plainly for these two
revoke all on function public.theoretical_usage(uuid, date, date, uuid) from public, anon;
revoke all on function public.appt_next_file_no(uuid, text) from public, anon;
grant execute on function public.theoretical_usage(uuid, date, date, uuid) to authenticated, service_role;
grant execute on function public.appt_next_file_no(uuid, text) to authenticated, service_role;
