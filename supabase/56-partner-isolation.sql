-- ============================================================================
--  Spacework ERP  -  CONTACT ISOLATION per company (+ subsidiaries)  (AFTER 55)
--  SECURITY FIX: partners (contacts) were ORG-scoped, so every company in an org
--  saw every other company's contacts. Now a contact belongs to a COMPANY and is
--  visible only to that company and to companies linked by a parent/subsidiary
--  relationship (companies.parent_company_id, walked both directions).
-- ============================================================================

-- 1) give partners an owning company ------------------------------------------
alter table public.partners add column if not exists company_id uuid references public.companies(id) on delete set null;

-- 2) backfill: assign each contact to the company that uses it most, then to the
--    org's oldest company for any never referenced (so none stay orphaned).
update public.partners p set company_id = u.cid
from (
  select partner_id, cid, row_number() over (partition by partner_id order by cnt desc, cid) rn
  from (
    select partner_id, company_id as cid, count(*) cnt from (
      select partner_id, company_id from public.invoices        where partner_id is not null
      union all select partner_id, company_id from public.sale_orders     where partner_id is not null
      union all select partner_id, company_id from public.purchase_orders where partner_id is not null
      union all select partner_id, company_id from public.projects        where partner_id is not null
      union all select partner_id, company_id from public.tenders         where partner_id is not null
      union all select partner_id, company_id from public.event_events    where partner_id is not null
    ) x group by partner_id, company_id
  ) y
) u
where u.partner_id = p.id and u.rn = 1 and p.company_id is null;

update public.partners p set company_id = (
  select c.id from public.companies c where c.org_id = p.org_id order by c.created_at asc, c.id limit 1
) where p.company_id is null;

create index if not exists idx_partners_company on public.partners(company_id);

-- 3) the companies a member may see contacts of: their companies, all ancestors
--    (parent chain) and all descendants (subsidiary chain). Platform admins: all.
create or replace function public.my_partner_scope()
returns setof uuid language sql stable security definer set search_path=public as $$
  with recursive up as (
    select id, parent_company_id from public.companies where id in (select public.my_company_ids())
    union
    select c.id, c.parent_company_id from public.companies c join up on c.id = up.parent_company_id
  ),
  down as (
    select id from public.companies where id in (select public.my_company_ids())
    union
    select c.id from public.companies c join down on c.parent_company_id = down.id
  )
  select id from public.companies where public.is_platform_admin()
  union select id from up
  union select id from down;
$$;
grant execute on function public.my_partner_scope() to authenticated;

-- 4) re-scope the partners policies from org to company(+subsidiary) -----------
drop policy if exists partners_r on public.partners;
create policy partners_r on public.partners for select using (company_id in (select public.my_partner_scope()));
drop policy if exists partners_w on public.partners;
create policy partners_w on public.partners for all
  using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'partner isolation ready' as done;
