-- ============================================================================
--  Spacework ERP  -  EVENT ISOLATION per company (+ subsidiaries)  (AFTER 61)
--  SECURITY FIX: my_event_ids() scoped owned events by my_company_ids(), which
--  for a multi-company member (or a platform admin) is EVERY company - so events
--  showed across companies. Now it uses my_partner_scope() (the active company
--  plus its parent/subsidiary chain), exactly like the contacts fix. Accepted
--  cross-company collaborations still cross tenants (that's their purpose).
-- ============================================================================

create or replace function public.my_event_ids()
returns setof uuid language sql stable security definer set search_path=public as $$
  select e.id from public.event_events e
   where e.company_id in (select public.my_partner_scope())
  union
  select ec.event_id from public.event_collaborators ec
    where ec.status = 'accepted'
      and ( (ec.company_id is not null and ec.company_id in (select public.my_partner_scope()))
            or (ec.invited_org_id is not null and ec.invited_org_id in (select public.my_orgs())) );
$$;
grant execute on function public.my_event_ids() to authenticated;

select 'event isolation ready' as done;
