-- ============================================================================
-- 168-company-scope.sql  -  a member limited to some companies sees those
-- companies and nothing else.
--
-- A member was given ALGECO CAMEROON only and could see every company in the
-- organisation, could edit any of them, could read every attachment in the
-- organisation, and could have widened his own access by editing his own
-- membership row. Four rules keyed on the organisation where they should
-- have keyed on the company:
--
--   companies      read: any member of the org.   Now: the companies you were given.
--                  write: any org admin.            Now: create and delete as an
--                  unscoped admin; edit what you can write.
--   media          read and write: any member of the org. Now: the company's.
--   files          the storage bucket was org-wide. Now a file whose media row
--                  belongs to a company you were not given is invisible.
--   child tables   delivery note lines, production consumption and tool
--                  movements were org-wide. Now they follow their parent.
--
-- And "org admin" never asked whether the admin was limited to some
-- companies. An admin limited to one company is that company's admin, not
-- the organisation's: members, invites, the organisation itself and its
-- consolidation are for unscoped admins. Shared reference data (currencies,
-- rates, analytic accounts) stays open to an admin of any company, because a
-- company needs its rates.
--
-- One more: the partner scope was read from the profile's active company
-- without checking the person was allowed that company. It is checked now.
-- ============================================================================

-- ---- who is an org admin ----------------------------------------------------
create or replace function public.is_org_admin(oid uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.is_platform_admin()
      or exists (select 1 from public.org_members
                 where org_id = oid and user_id = auth.uid()
                   and coalesce(status,'active') = 'active'
                   and role in ('owner','admin','accountant')
                   and (company_ids is null or array_length(company_ids,1) is null));
$$;

-- an admin of any company in the org: enough for the org's shared reference data
create or replace function public.is_org_writer(oid uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.is_platform_writer()
      or exists (select 1 from public.org_members
                 where org_id = oid and user_id = auth.uid()
                   and coalesce(status,'active') = 'active'
                   and role in ('owner','admin','accountant'));
$$;
grant execute on function public.is_org_writer(uuid) to authenticated;

-- managing the team is an organisation act: never for a member limited to some companies
create or replace function public.can_manage_team(p_org uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.is_platform_writer()
      or (coalesce((select (r.full_access or r.can_manage_roles) from public.member_role_row(p_org, auth.uid()) r), false)
          and exists (select 1 from public.org_members m
                       where m.org_id = p_org and m.user_id = auth.uid()
                         and coalesce(m.status,'active') = 'active'
                         and (m.company_ids is null or array_length(m.company_ids,1) is null)));
$$;

-- the partner scope is the active company and its group, but only where the person is allowed
create or replace function public.my_partner_scope()
returns setof uuid language sql stable security definer set search_path to 'public' as $$
  with recursive up as (
    select c.id, c.parent_company_id from public.companies c where c.id = (select active_company_id from public.profiles where id = auth.uid())
    union
    select c2.id, c2.parent_company_id from public.companies c2 join up on c2.id = up.parent_company_id
  ),
  down as (
    select c.id from public.companies c where c.id = (select active_company_id from public.profiles where id = auth.uid())
    union
    select c3.id from public.companies c3 join down on c3.parent_company_id = down.id
  )
  select s.id from (select id from up union select id from down) s
   where s.id in (select public.my_company_ids());
$$;

-- a file is visible unless its media row belongs to a company the person was not given.
-- SECURITY DEFINER so the check sees every media row, not only the ones RLS shows.
create or replace function public.media_visible(p_path text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select not exists (select 1 from public.media m
                      where m.path = p_path and m.company_id is not null
                        and m.company_id not in (select public.my_company_ids()));
$$;
grant execute on function public.media_visible(text) to authenticated;

-- ---- shared reference data: an admin of any company may keep it ------------
drop policy if exists currencies_w on public.currencies;
create policy currencies_w on public.currencies for all using (public.is_org_writer(org_id)) with check (public.is_org_writer(org_id));
drop policy if exists currency_rates_w on public.currency_rates;
create policy currency_rates_w on public.currency_rates for all using (public.is_org_writer(org_id)) with check (public.is_org_writer(org_id));
drop policy if exists analytic_accounts_w on public.analytic_accounts;
create policy analytic_accounts_w on public.analytic_accounts for all using (public.is_org_writer(org_id)) with check (public.is_org_writer(org_id));

-- ---- companies: read what you were given, edit what you may write ----------
drop policy if exists co_read on public.companies;
create policy co_read on public.companies for select using (id in (select public.my_company_ids()));
drop policy if exists co_write on public.companies;
drop policy if exists co_insert on public.companies;
create policy co_insert on public.companies for insert with check (public.is_org_admin(org_id));
drop policy if exists co_update on public.companies;
create policy co_update on public.companies for update
  using (public.can_write_company(id))
  with check (public.can_write_company(id) and org_id in (select public.my_orgs()));
drop policy if exists co_delete on public.companies;
create policy co_delete on public.companies for delete using (public.is_org_admin(org_id));

-- ---- attachments: the row and the file follow the company ------------------
drop policy if exists media_r on public.media;
create policy media_r on public.media for select
  using (company_id in (select public.my_company_ids()) or (company_id is null and org_id in (select public.my_orgs())));
drop policy if exists media_w on public.media;
create policy media_w on public.media for all
  using (company_id in (select public.my_company_ids()) or (company_id is null and org_id in (select public.my_orgs())))
  with check (company_id in (select public.my_company_ids()) or (company_id is null and org_id in (select public.my_orgs())));

drop policy if exists att_read on storage.objects;
create policy att_read on storage.objects for select
  using (bucket_id = 'attachments' and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) and public.media_visible(name));
drop policy if exists att_update on storage.objects;
create policy att_update on storage.objects for update
  using (bucket_id = 'attachments' and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) and public.media_visible(name))
  with check (bucket_id = 'attachments' and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) and public.media_visible(name));
drop policy if exists att_delete on storage.objects;
create policy att_delete on storage.objects for delete
  using (bucket_id = 'attachments' and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) and public.media_visible(name));

-- ---- child rows follow their parent -----------------------------------------
drop policy if exists dnl_r on public.delivery_note_lines;
create policy dnl_r on public.delivery_note_lines for select
  using (exists (select 1 from public.delivery_notes n where n.id = note_id and n.company_id in (select public.my_company_ids())));
drop policy if exists dnl_w on public.delivery_note_lines;
create policy dnl_w on public.delivery_note_lines for all
  using (exists (select 1 from public.delivery_notes n where n.id = note_id and public.can_write_company(n.company_id)))
  with check (exists (select 1 from public.delivery_notes n where n.id = note_id and public.can_write_company(n.company_id)));

drop policy if exists pcons_r on public.production_consumption;
create policy pcons_r on public.production_consumption for select
  using (exists (select 1 from public.production_runs r where r.id = run_id and r.company_id in (select public.my_company_ids())));
drop policy if exists pcons_w on public.production_consumption;
create policy pcons_w on public.production_consumption for all
  using (exists (select 1 from public.production_runs r where r.id = run_id and public.can_write_company(r.company_id)))
  with check (exists (select 1 from public.production_runs r where r.id = run_id and public.can_write_company(r.company_id)));

drop policy if exists tmov_r on public.tool_movements;
create policy tmov_r on public.tool_movements for select
  using (exists (select 1 from public.tools t where t.id = tool_id and t.company_id in (select public.my_company_ids())));
drop policy if exists tmov_w on public.tool_movements;
create policy tmov_w on public.tool_movements for all
  using (exists (select 1 from public.tools t where t.id = tool_id and public.can_write_company(t.company_id)))
  with check (exists (select 1 from public.tools t where t.id = tool_id and public.can_write_company(t.company_id)));

-- ---- a restore goes into an organisation you administer, not one you are limited in ----
create or replace function public.backup_target_org(p_file_org uuid)
returns uuid language plpgsql stable security definer set search_path = public as $fn$
declare mine uuid;
begin
  if p_file_org is not null and exists (select 1 from public.orgs o where o.id = p_file_org) then
    return p_file_org;
  end if;
  select m.org_id into mine from public.org_members m
   where m.user_id = auth.uid() and m.role in ('owner', 'admin', 'accountant')
     and coalesce(m.status,'active') = 'active'
     and (m.company_ids is null or array_length(m.company_ids,1) is null)
   order by m.created_at nulls last limit 1;
  return mine;
end $fn$;
