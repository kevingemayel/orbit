-- ============================================================================
-- 189-plot-soft-delete-and-portal.sql  -  two Plot fixes, 2026-09-16.
--
--  1. Deleting a committee role or a resident failed. Delete in a Plot form is
--     a soft delete (it stamps deleted_at so the record can be restored from the
--     Archive), but 125-plot-finish.sql created property_members and
--     property_residents without deleted_at and deleted_by, so the update was
--     refused. Both columns are added. Until this runs the app archives the
--     record instead (is_active = false).
--  2. The resident portal showed deleted records. portal_property_summary()
--     predates soft delete and never looked at deleted_at, so a deleted
--     announcement, document, capital project, charge, motion or unit (or a
--     removed owner link) kept showing to owners. It now skips every soft-deleted
--     row, and voting or raising a suggestion refuses deleted motions, meetings
--     and buildings.
--
-- Safe to re-run.
-- ============================================================================

alter table public.property_members   add column if not exists deleted_at timestamptz;
alter table public.property_members   add column if not exists deleted_by text;
alter table public.property_residents add column if not exists deleted_at timestamptz;
alter table public.property_residents add column if not exists deleted_by text;

create or replace function public.portal_property_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare pa public.portal_access; me uuid; co uuid; cur text;
  props uuid[]; units jsonb; invs jsonb; anns jsonb; motions jsonb; suggs jsonb;
  billed numeric; outstanding numeric;
begin
  pa := public.portal_me();
  if pa.id is null then return null; end if;
  me := pa.partner_id; co := pa.company_id;
  select currency_code into cur from public.companies where id = co;

  -- buildings this partner owns a live unit in, through a live owner link
  select array_agg(distinct u.property_id) into props
    from public.property_ownerships o
    join public.property_units u on u.id = o.unit_id
    join public.properties p on p.id = u.property_id
   where o.company_id = co and o.partner_id = me
     and o.deleted_at is null and u.deleted_at is null and p.deleted_at is null;
  if props is null then props := array[]::uuid[]; end if;

  select coalesce(jsonb_agg(jsonb_build_object('code', u.code, 'building', p.name, 'shares', u.shares, 'floor', u.floor) order by p.name, u.code), '[]'::jsonb)
    into units
    from public.property_ownerships o
    join public.property_units u on u.id = o.unit_id
    join public.properties p on p.id = u.property_id
   where o.company_id = co and o.partner_id = me
     and o.deleted_at is null and u.deleted_at is null and p.deleted_at is null;

  select coalesce(sum(amount_total),0), coalesce(sum(amount_residual),0)
    into billed, outstanding
    from public.invoices
   where company_id = co and partner_id = me and move_type = 'out_invoice' and property_id = any(props);

  select coalesce(jsonb_agg(jsonb_build_object('number', number, 'date', invoice_date, 'due', due_date, 'total', amount_total, 'residual', amount_residual, 'state', payment_state) order by invoice_date desc), '[]'::jsonb)
    into invs
    from public.invoices
   where company_id = co and partner_id = me and move_type = 'out_invoice' and property_id = any(props);

  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'body', body, 'pinned', pinned, 'date', created_at) order by pinned desc, created_at desc), '[]'::jsonb)
    into anns
    from public.property_announcements
   where company_id = co and property_id = any(props) and deleted_at is null;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', mi.id, 'title', mi.title, 'description', mi.description, 'authority', mi.authority,
           'meeting', mt.title, 'building', p.name,
           'my_vote', (select v.choice from public.property_meeting_votes v where v.item_id = mi.id and v.voter_partner_id = me limit 1)
         ) order by mt.meeting_date desc), '[]'::jsonb)
    into motions
    from public.property_meeting_items mi
    join public.property_meetings mt on mt.id = mi.meeting_id
    join public.properties p on p.id = mt.property_id
   where mt.company_id = co and mt.property_id = any(props) and mi.kind = 'motion' and mi.status = 'open'
     and mi.deleted_at is null and mt.deleted_at is null;

  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'type', type, 'status', status, 'date', created_at) order by created_at desc), '[]'::jsonb)
    into suggs
    from public.property_suggestions
   where company_id = co and property_id = any(props) and submitted_by_partner_id = me and deleted_at is null;

  return jsonb_build_object(
    'currency', coalesce(cur,''), 'units', units, 'billed', billed, 'outstanding', outstanding,
    'invoices', invs, 'announcements', anns, 'motions', motions, 'suggestions', suggs,
    'property_id', (case when array_length(props,1) > 0 then props[1] else null end),
    'buildings', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by p.name), '[]'::jsonb)
                    from public.properties p where p.id = any(props) and p.deleted_at is null),
    'documents', (select coalesce(jsonb_agg(jsonb_build_object('title', d.title, 'category', d.category, 'url', d.file_url) order by d.created_at desc), '[]'::jsonb)
                    from public.property_documents d where d.company_id = co and d.property_id = any(props) and d.is_public and d.deleted_at is null),
    'projects', (select coalesce(jsonb_agg(jsonb_build_object('title', pj.title, 'status', pj.status, 'budget', pj.budget_estimate, 'progress', pj.progress) order by pj.created_at desc), '[]'::jsonb)
                    from public.property_projects pj where pj.company_id = co and pj.property_id = any(props) and pj.is_public and pj.deleted_at is null),
    'charges', (select coalesce(jsonb_agg(jsonb_build_object('name', c.name, 'category', c.category, 'amount', c.amount, 'frequency', c.frequency) order by c.name), '[]'::jsonb)
                    from public.property_charges c where c.company_id = co and c.property_id = any(props) and c.is_active and c.deleted_at is null));
end $fn$;

create or replace function public.portal_property_vote(p_item uuid, p_choice text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare pa public.portal_access; me uuid; co uuid; mt record; sh numeric; uid uuid;
begin
  pa := public.portal_me();
  if pa.id is null then return jsonb_build_object('ok', false, 'reason', 'no access'); end if;
  if p_choice not in ('for','against','abstain') then return jsonb_build_object('ok', false, 'reason', 'bad choice'); end if;
  me := pa.partner_id; co := pa.company_id;

  select mt2.property_id as property_id, mi.status as status
    into mt
    from public.property_meeting_items mi
    join public.property_meetings mt2 on mt2.id = mi.meeting_id
   where mi.id = p_item and mt2.company_id = co and mi.deleted_at is null and mt2.deleted_at is null;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not found'); end if;
  if mt.status <> 'open' then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;

  select coalesce(sum(case when u.voting_excluded then 0 else u.shares end),0), (array_agg(u.id))[1] into sh, uid
    from public.property_ownerships o join public.property_units u on u.id = o.unit_id
   where o.company_id = co and o.partner_id = me and u.property_id = mt.property_id
     and o.deleted_at is null and u.deleted_at is null;
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'not an owner here'); end if;

  insert into public.property_meeting_votes (company_id, item_id, voter_partner_id, voter_name, unit_id, shares, choice)
  values (co, p_item, me, (select name from public.partners where id = me), uid, sh, p_choice)
  on conflict (item_id, voter_partner_id) where voter_partner_id is not null
  do update set choice = excluded.choice, shares = excluded.shares, created_at = now();

  return jsonb_build_object('ok', true, 'choice', p_choice, 'shares', sh);
end $fn$;

create or replace function public.portal_property_suggest(p_property uuid, p_title text, p_type text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare pa public.portal_access; me uuid; co uuid; ok boolean;
begin
  pa := public.portal_me();
  if pa.id is null then return jsonb_build_object('ok', false, 'reason', 'no access'); end if;
  if coalesce(btrim(p_title),'') = '' then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  me := pa.partner_id; co := pa.company_id;

  select exists(
    select 1 from public.property_ownerships o
      join public.property_units u on u.id = o.unit_id
      join public.properties p on p.id = u.property_id
     where o.company_id = co and o.partner_id = me and u.property_id = p_property
       and o.deleted_at is null and u.deleted_at is null and p.deleted_at is null) into ok;
  if not ok then return jsonb_build_object('ok', false, 'reason', 'not an owner here'); end if;

  insert into public.property_suggestions (company_id, property_id, submitted_by_partner_id, submitted_by_name, type, title, body, status)
  values (co, p_property, me, (select name from public.partners where id = me),
          case when p_type in ('suggestion','complaint','request') then p_type else 'suggestion' end,
          p_title, p_body, 'new');
  return jsonb_build_object('ok', true);
end $fn$;

grant execute on function public.portal_property_summary() to anon, authenticated;
grant execute on function public.portal_property_vote(uuid, text) to anon, authenticated;
grant execute on function public.portal_property_suggest(uuid, text, text, text) to anon, authenticated;

select '189 plot soft delete and portal ready' as done;
