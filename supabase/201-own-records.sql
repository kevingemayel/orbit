-- 201: "Own records" means it in the database, not only on screen.
--
-- A role set to Own records was filtered in the app (ownRow in the list engine), so the
-- rows still came back over the API. This closes that: on the tables that record who a
-- record belongs to, a person whose role is Own records for that app reads and changes
-- only their own rows. A record with nobody on it stays visible, because unassigned work
-- has to be picked up by somebody.
--
-- The level is asked once per statement, not once per row: my_own_only takes no column
-- from the row, so Postgres evaluates it a single time. A role is "own only" when every
-- membership that can reach the app is at Own records; full access and platform writers
-- are never own only.
-- Safe to re-run.

create or replace function public.my_own_only(p_mod text) returns boolean
  language sql stable security definer set search_path = public as $fn$
  select case when public.is_platform_writer() then false else coalesce((
    select bool_and(x.lvl = 'O') from (
      select (select public.perm_level(r.permissions, p_mod)
                from public.roles r
               where r.slug = m.role and (r.org_id = m.org_id or r.org_id is null)
               order by (r.org_id is not null) desc limit 1) as lvl,
             (select coalesce(r.full_access, false)
                from public.roles r
               where r.slug = m.role and (r.org_id = m.org_id or r.org_id is null)
               order by (r.org_id is not null) desc limit 1) as fa
        from public.org_members m
       where m.user_id = auth.uid()
         and coalesce(m.status, 'active') = 'active'
         and (m.expires_at is null or m.expires_at > now())
    ) x
    where x.lvl is not null and x.lvl <> '-' and not x.fa
  ), false) end
$fn$;
revoke all on function public.my_own_only(text) from public, anon;
grant execute on function public.my_own_only(text) to authenticated, service_role;

-- the employee records that are this person, for the tables that key on an employee
create or replace function public.my_employee_ids() returns uuid[]
  language sql stable security definer set search_path = public as $fn$
  select coalesce(array_agg(e.id), '{}'::uuid[]) from public.hr_employees e where e.user_id = auth.uid()
$fn$;
revoke all on function public.my_employee_ids() from public, anon;
grant execute on function public.my_employee_ids() to authenticated, service_role;

do $mig$
declare
  m record;
  c text;
begin
  for m in
    select * from (values
      ('sale_orders',       'sales',     '(user_id = auth.uid() or user_id is null)'),
      ('crm_leads',         'crm',       '(user_id = auth.uid() or user_id is null)'),
      ('crm_activities',    'crm',       '(created_by = auth.uid() or created_by is null)'),
      ('projects',          'projects',  '(user_id = auth.uid() or user_id is null)'),
      ('payments',          'accounting','(created_by = auth.uid() or created_by is null)'),
      ('appt_appointments', 'appoint',   '(created_by = auth.uid() or created_by is null or staff_id = any(public.my_employee_ids()))'),
      ('hr_expenses',       'employees', '(employee_id = any(public.my_employee_ids()) or employee_id is null)'),
      ('timesheets',        'employees', '(user_id = auth.uid() or employee_id = any(public.my_employee_ids()) or (user_id is null and employee_id is null))'),
      ('service_tickets',   'service',   '(assigned_to = auth.uid() or assigned_to is null)')
    ) as t(tbl, app, mine)
  loop
    if to_regclass('public.' || m.tbl) is null then
      raise notice '201: %, not in this database, skipped', m.tbl;
      continue;
    end if;
    c := '(not public.my_own_only(' || quote_literal(m.app) || ') or ' || m.mine || ')';
    execute format('drop policy if exists rg_own_s on public.%I', m.tbl);
    execute format('drop policy if exists rg_own_u on public.%I', m.tbl);
    execute format('drop policy if exists rg_own_d on public.%I', m.tbl);
    execute format('create policy rg_own_s on public.%I as restrictive for select using %s', m.tbl, c);
    execute format('create policy rg_own_u on public.%I as restrictive for update using %s with check %s', m.tbl, c, c);
    execute format('create policy rg_own_d on public.%I as restrictive for delete using %s', m.tbl, c);
  end loop;
end $mig$;

-- an invoice belongs to sales or to purchase depending on which way it faces
drop policy if exists rg_own_s on public.invoices;
drop policy if exists rg_own_u on public.invoices;
drop policy if exists rg_own_d on public.invoices;
create policy rg_own_s on public.invoices as restrictive for select
  using ((case when move_type like 'out%' then not public.my_own_only('sales')
               when move_type like 'in%'  then not public.my_own_only('purchase')
               else true end)
         or created_by = auth.uid() or created_by is null);
create policy rg_own_u on public.invoices as restrictive for update
  using ((case when move_type like 'out%' then not public.my_own_only('sales')
               when move_type like 'in%'  then not public.my_own_only('purchase')
               else true end)
         or created_by = auth.uid() or created_by is null)
  with check ((case when move_type like 'out%' then not public.my_own_only('sales')
                    when move_type like 'in%'  then not public.my_own_only('purchase')
                    else true end)
         or created_by = auth.uid() or created_by is null);
create policy rg_own_d on public.invoices as restrictive for delete
  using ((case when move_type like 'out%' then not public.my_own_only('sales')
               when move_type like 'in%'  then not public.my_own_only('purchase')
               else true end)
         or created_by = auth.uid() or created_by is null);
