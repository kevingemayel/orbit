-- ============================================================================
--  Spacework ERP  -  bind event-collaboration accept to the invited email  (AFTER 62)
--  accept_event_collab accepted an invite on the share token alone, so a
--  forwarded/leaked invite link let a DIFFERENT company attach itself to the
--  event. Now acceptance also requires the signed-in user's email to match the
--  email the invite was addressed to (when one was set).
-- ============================================================================

create or replace function public.accept_event_collab(p_token text)
returns uuid language plpgsql security definer set search_path=public as $$
declare rec public.event_collaborators; myco uuid; myorg uuid; myemail text;
begin
  select * into rec from public.event_collaborators where token = p_token and status <> 'declined' limit 1;
  if rec.id is null then raise exception 'Invite not found or already handled'; end if;
  select lower(email) into myemail from auth.users where id = auth.uid();
  if rec.invited_email is not null and btrim(rec.invited_email) <> ''
     and lower(rec.invited_email) <> coalesce(myemail, '') then
    raise exception 'This invitation was sent to a different email address. Sign in as % to accept it.', rec.invited_email;
  end if;
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

select 'event collab bind ready' as done;
