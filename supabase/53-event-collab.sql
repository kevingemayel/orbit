-- ============================================================================
--  Spacework ERP  -  EVENT COLLABORATION accept flow  (run AFTER 01-52)
--  The owner invites another company by email; the invitee opens a share link
--  (?evinvite=TOKEN) while logged in and accepts. Acceptance is a definer RPC
--  because the invitee is not in the owner's org (evc_w is owner-only).
-- ============================================================================

-- pending invites addressed to the current user's email
create or replace function public.my_event_invites()
returns table(id uuid, event_id uuid, event_name text, role text, owner_org_id uuid, token text)
language sql stable security definer set search_path=public as $$
  select ec.id, ec.event_id, e.name, ec.role, ec.owner_org_id, ec.token
  from public.event_collaborators ec
  join public.event_events e on e.id = ec.event_id
  where ec.status = 'pending'
    and lower(ec.invited_email) = lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'email',''));
$$;
grant execute on function public.my_event_invites() to authenticated;

-- accept an invite by its share token: attach the caller's active company/org
create or replace function public.accept_event_collab(p_token text)
returns uuid language plpgsql security definer set search_path=public as $$
declare rec public.event_collaborators; myco uuid; myorg uuid;
begin
  select * into rec from public.event_collaborators where token = p_token and status <> 'declined' limit 1;
  if rec.id is null then raise exception 'Invite not found or already handled'; end if;
  select active_company_id into myco from public.profiles where id = auth.uid();
  select org_id into myorg from public.companies where id = myco;
  update public.event_collaborators
     set status = 'accepted', accepted_at = now(),
         invited_org_id = coalesce(rec.invited_org_id, myorg),
         company_id = coalesce(rec.company_id, myco)
   where id = rec.id;
  return rec.event_id;
end $$;
grant execute on function public.accept_event_collab(text) to authenticated;

select 'event collab ready' as done;
