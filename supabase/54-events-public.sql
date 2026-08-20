-- ============================================================================
--  Spacework ERP  -  EVENTS public RSVP / registration  (run AFTER 01-53)
--  Token-gated SECURITY DEFINER functions so the public pages (no login) can
--  read minimal event info and submit, WITHOUT opening the tables to anon.
--  The event's public_token gates registration; each guest's rsvp_token gates
--  their own RSVP. Nothing else is exposed.
-- ============================================================================

-- event display info for the registration page
create or replace function public.event_public_info(p_token text)
returns table(event_id uuid, name text, event_type text, event_date date, venue text, location text, registration_open boolean)
language sql stable security definer set search_path=public as $$
  select id, name, event_type, event_date, venue, location, coalesce(registration_open,false)
  from public.event_events where public_token = p_token;
$$;
grant execute on function public.event_public_info(text) to anon, authenticated;

-- a non-user self-registers onto the longlist (only while registration is open)
create or replace function public.event_register(p_token text, p_first text, p_family text, p_email text, p_phone text, p_side text, p_category text, p_plus int)
returns text language plpgsql security definer set search_path=public as $$
declare ev public.event_events; tok text;
begin
  select * into ev from public.event_events where public_token = p_token;
  if ev.id is null then raise exception 'Event not found'; end if;
  if not coalesce(ev.registration_open, false) then raise exception 'Registration is closed'; end if;
  insert into public.event_guests(org_id, event_id, first_name, family_name, email, phone, side, category, plus_ones, invite_stage, source, rsvp)
    values (ev.org_id, ev.id, nullif(p_first,''), nullif(p_family,''), nullif(p_email,''), nullif(p_phone,''), nullif(p_side,''), nullif(p_category,''), coalesce(p_plus,0), 'longlist', 'self_registered', 'pending')
    returning rsvp_token into tok;
  return tok;
end $$;
grant execute on function public.event_register(text,text,text,text,text,text,text,int) to anon, authenticated;

-- an invited guest looks up their personal RSVP
create or replace function public.rsvp_lookup(p_token text)
returns table(guest_name text, event_name text, event_type text, event_date date, venue text, rsvp text, plus_ones int)
language sql stable security definer set search_path=public as $$
  select btrim(coalesce(g.first_name,'') || ' ' || coalesce(g.family_name,'')), e.name, e.event_type, e.event_date, e.venue, g.rsvp, coalesce(g.plus_ones,0)
  from public.event_guests g join public.event_events e on e.id = g.event_id
  where g.rsvp_token = p_token;
$$;
grant execute on function public.rsvp_lookup(text) to anon, authenticated;

-- an invited guest records their answer
create or replace function public.rsvp_respond(p_token text, p_rsvp text, p_plus int, p_dietary text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.event_guests
     set rsvp = case when p_rsvp in ('yes','no','maybe') then p_rsvp else rsvp end,
         plus_ones = coalesce(p_plus, plus_ones),
         dietary = coalesce(nullif(p_dietary,''), dietary),
         invite_stage = case when p_rsvp = 'yes' then 'confirmed' when p_rsvp = 'no' then 'declined' else invite_stage end,
         responded_at = now()
   where rsvp_token = p_token;
  return found;
end $$;
grant execute on function public.rsvp_respond(text,text,int,text) to anon, authenticated;

select 'events public ready' as done;
