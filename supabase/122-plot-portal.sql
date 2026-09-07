-- ============================================================================
-- 122-plot-portal.sql  -  Plot part 4: resident self-service through the portal.
--
-- Residents/owners reach Orbit through the SAME portal as clients (magic-link,
-- identified by portal_me() -> portal_access row). These RPCs let an owner see
-- their building and act on it: view their charges and balance, read
-- announcements, vote on open motions (weighted by their unit shares), and
-- raise a suggestion or complaint. Everything is scoped to the caller's own
-- partner + company by portal_me(); an owner can never see another building.
--
-- Safe to re-run.
-- ============================================================================

-- What the resident portal shows: their building(s), units, balance, invoices,
-- announcements, open motions (with whether they have voted), and their own
-- suggestions. One round-trip, all scoped to portal_me().
create or replace function public.portal_property_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare pa public.portal_access; me uuid; co uuid; cur text; res jsonb;
  props uuid[]; units jsonb; invs jsonb; anns jsonb; motions jsonb; suggs jsonb;
  billed numeric; outstanding numeric;
begin
  pa := public.portal_me();
  if pa.id is null then return null; end if;
  me := pa.partner_id; co := pa.company_id;
  select currency_code into cur from public.companies where id = co;

  -- properties this partner owns a unit in
  select array_agg(distinct u.property_id) into props
    from public.property_ownerships o join public.property_units u on u.id = o.unit_id
   where o.company_id = co and o.partner_id = me;
  if props is null then props := array[]::uuid[]; end if;

  select coalesce(jsonb_agg(jsonb_build_object('code', u.code, 'building', p.name, 'shares', u.shares, 'floor', u.floor) order by p.name, u.code), '[]'::jsonb)
    into units
    from public.property_ownerships o
    join public.property_units u on u.id = o.unit_id
    join public.properties p on p.id = u.property_id
   where o.company_id = co and o.partner_id = me;

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
   where company_id = co and property_id = any(props);

  -- Open motions in posted meetings the owner can still vote on.
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', mi.id, 'title', mi.title, 'description', mi.description, 'authority', mi.authority,
           'meeting', mt.title, 'building', p.name,
           'my_vote', (select v.choice from public.property_meeting_votes v where v.item_id = mi.id and v.voter_partner_id = me limit 1)
         ) order by mt.meeting_date desc), '[]'::jsonb)
    into motions
    from public.property_meeting_items mi
    join public.property_meetings mt on mt.id = mi.meeting_id
    join public.properties p on p.id = mt.property_id
   where mt.company_id = co and mt.property_id = any(props) and mi.kind = 'motion' and mi.status = 'open';

  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'type', type, 'status', status, 'date', created_at) order by created_at desc), '[]'::jsonb)
    into suggs
    from public.property_suggestions
   where company_id = co and property_id = any(props) and submitted_by_partner_id = me;

  return jsonb_build_object(
    'currency', coalesce(cur,''), 'units', units, 'billed', billed, 'outstanding', outstanding,
    'invoices', invs, 'announcements', anns, 'motions', motions, 'suggestions', suggs,
    'property_id', (case when array_length(props,1) > 0 then props[1] else null end));
end $fn$;

-- Cast (or change) this owner's vote on a motion, weighted by their unit shares
-- in that motion's building. Refuses motions outside the owner's buildings, and
-- once the motion is no longer open.
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
   where mi.id = p_item and mt2.company_id = co;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not found'); end if;
  if mt.status <> 'open' then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;

  -- The owner's voting weight + a unit id in this building (must own here).
  -- Units flagged voting_excluded carry no weight (joint-ownership rules), but
  -- still identify the owner, so exclusion is applied to shares only.
  select coalesce(sum(case when u.voting_excluded then 0 else u.shares end),0), (array_agg(u.id))[1] into sh, uid
    from public.property_ownerships o join public.property_units u on u.id = o.unit_id
   where o.company_id = co and o.partner_id = me and u.property_id = mt.property_id;
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'not an owner here'); end if;

  insert into public.property_meeting_votes (company_id, item_id, voter_partner_id, voter_name, unit_id, shares, choice)
  values (co, p_item, me, (select name from public.partners where id = me), uid, sh, p_choice)
  on conflict (item_id, voter_partner_id) where voter_partner_id is not null
  do update set choice = excluded.choice, shares = excluded.shares, created_at = now();

  return jsonb_build_object('ok', true, 'choice', p_choice, 'shares', sh);
end $fn$;

-- Raise a suggestion / complaint / request from the portal, for a building the
-- owner belongs to.
create or replace function public.portal_property_suggest(p_property uuid, p_title text, p_type text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare pa public.portal_access; me uuid; co uuid; ok boolean;
begin
  pa := public.portal_me();
  if pa.id is null then return jsonb_build_object('ok', false, 'reason', 'no access'); end if;
  if coalesce(btrim(p_title),'') = '' then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  me := pa.partner_id; co := pa.company_id;

  select exists(
    select 1 from public.property_ownerships o join public.property_units u on u.id = o.unit_id
     where o.company_id = co and o.partner_id = me and u.property_id = p_property) into ok;
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
