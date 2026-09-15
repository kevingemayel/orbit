-- 193: a person's calendar feed carries their own appointments, not the whole practice's.
--
-- The feed a person subscribes to in Google, Outlook or Apple Calendar listed every
-- appointment in the company, with the client's name in the title. In a clinic or a law
-- firm that put every patient or client of every colleague into each person's phone.
-- It now carries the appointments booked with that person (the employee linked to their
-- login) and the ones booked with nobody, the same rule the company calendar half already
-- used. A feed also stops answering once its owner is no longer an active member of the
-- company: an ended or expired membership used to keep a working link to the diary.
-- Everything else is the live definition unchanged. Safe to re-run.

create or replace function public.calendar_feed_events(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare f record;
begin
  if p_token is null or length(p_token) < 20 then raise exception 'unauthorized'; end if;
  select * into f from public.calendar_feeds where token = p_token and direction = 'out' and is_active;
  if not found then raise exception 'unauthorized'; end if;
  -- the owner must still be an active, unexpired member with this company in scope
  if not exists (
    select 1 from public.companies c
    join public.org_members m on m.org_id = c.org_id and m.user_id = f.user_id
    where c.id = f.company_id and coalesce(m.status, 'active') = 'active'
      and (m.expires_at is null or m.expires_at > now())
      and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
  ) then raise exception 'unauthorized'; end if;
  update public.calendar_feeds set last_sync_at = now() where id = f.id;

  return jsonb_build_object(
    'name', coalesce((select name from public.companies where id = f.company_id), 'Orbit'),
    'events', coalesce((
      -- appointments booked with this person, or with nobody
      select jsonb_agg(x) from (
        select 'appt-' || a.id as uid,
               coalesce(nullif(a.title, ''), nullif(sv.name, ''), 'Appointment') || coalesce(' - ' || pt.name, '') as title,
               a.starts_at, a.ends_at, false as all_day,
               coalesce(a.location_type, '') as location, coalesce(a.notes, '') as descr
          from public.appt_appointments a
          left join public.appt_services sv on sv.id = a.service_id
          left join public.partners pt on pt.id = a.client_id
         where a.company_id = f.company_id
           and a.status <> 'cancelled'
           and a.starts_at > now() - interval '60 days'
           and (a.staff_id is null
                or exists (select 1 from public.hr_employees he where he.id = a.staff_id and he.user_id = f.user_id))
        union all
        -- and anything on the company calendar assigned to them or to nobody
        -- start_time and end_time are free text on this table, so anything that
        -- is not a readable clock time is treated as an all-day entry rather
        -- than blowing up the whole feed
        select 'cal-' || e.id,
               e.title,
               (e.event_date + case when e.start_time ~ '^\d{1,2}:\d{2}' then e.start_time::time else time '00:00' end) at time zone 'UTC',
               (e.event_date + case when e.end_time ~ '^\d{1,2}:\d{2}' then e.end_time::time
                                    when e.start_time ~ '^\d{1,2}:\d{2}' then e.start_time::time + interval '1 hour'
                                    else time '23:59' end) at time zone 'UTC',
               coalesce(e.all_day, false),
               coalesce(e.location, ''), coalesce(e.notes, '')
          from public.calendar_events e
         where e.company_id = f.company_id
           and e.event_date > current_date - 60
           and (e.assigned_to is null or e.assigned_to = '' or e.assigned_to = f.user_id::text)
      ) x), '[]'::jsonb));
end $function$;
