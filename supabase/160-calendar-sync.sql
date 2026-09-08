-- ============================================================================
-- 160-calendar-sync.sql  -  Orbit's calendar in Google and Outlook, and theirs
-- in Orbit.
--
-- Field and sales people live in Google Calendar or Outlook. A booking they
-- cannot see on their phone is a booking they miss, and a job scheduled on top
-- of the dentist appointment Orbit knew nothing about is the same problem from
-- the other side. So it has to go both ways.
--
-- Deliberately NOT OAuth. Signing in to Google would mean registering an
-- application, holding refresh tokens for every user, and a consent screen that
-- has to be verified. Both calendars already speak iCalendar over a plain URL,
-- which needs no account, no secret of theirs, and no token to leak:
--
--   OUT  Orbit publishes one unguessable .ics URL per person. Google, Outlook,
--        Apple Calendar and everything else subscribe to it and refresh
--        themselves. The token IS the authorisation, so it is 32 random bytes
--        and can be rolled at any time from inside the app.
--
--   IN   The person pastes their own secret .ics address from Google or
--        Outlook. An hourly job fetches it and stores the busy blocks, which
--        then show on the Orbit calendar and block the scheduler. Nothing about
--        the content is written back, so a private appointment stays private:
--        Orbit keeps only when they are busy.
-- ============================================================================

create table if not exists public.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  direction text not null check (direction in ('out', 'in')),
  label text,
  url text,                      -- 'in' only: their secret iCalendar address
  token text unique,             -- 'out' only: the address we publish
  is_active boolean not null default true,
  last_sync_at timestamptz,
  last_error text,
  event_count integer,
  created_at timestamptz not null default now()
);
create index if not exists calendar_feeds_user_idx on public.calendar_feeds (user_id, direction);
alter table public.calendar_feeds enable row level security;

drop policy if exists calendar_feeds_own on public.calendar_feeds;
create policy calendar_feeds_own on public.calendar_feeds for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and company_id in (select public.my_company_ids()));

-- Only when they are busy, never what they are doing. Orbit does not need to
-- know, and a synced calendar that leaks someone's private life is a breach
-- waiting to happen.
create table if not exists public.calendar_busy (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references public.calendar_feeds(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  uid text not null,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (feed_id, uid)
);
create index if not exists calendar_busy_when_idx on public.calendar_busy (user_id, starts_at);
alter table public.calendar_busy enable row level security;

drop policy if exists calendar_busy_own on public.calendar_busy;
create policy calendar_busy_own on public.calendar_busy for select using (user_id = auth.uid());
drop policy if exists calendar_busy_del on public.calendar_busy;
create policy calendar_busy_del on public.calendar_busy for delete using (user_id = auth.uid());

-- ------------------------------------------------------------------ outbound
-- One address per person per company, created on demand and rollable.
create or replace function public.calendar_out_token(p_company uuid, p_roll boolean default false)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare t text; f record;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into f from public.calendar_feeds
   where user_id = auth.uid() and company_id = p_company and direction = 'out' limit 1;
  if found and not p_roll then return f.token; end if;
  t := replace(replace(encode(extensions.gen_random_bytes(24), 'base64'), '/', '_'), '+', '-');
  if found then
    update public.calendar_feeds set token = t, last_error = null where id = f.id;
  else
    insert into public.calendar_feeds (company_id, user_id, direction, label, token)
    values (p_company, auth.uid(), 'out', 'My Orbit calendar', t);
  end if;
  return t;
end $fn$;

-- What that address serves. No session: the token is the authorisation, so it
-- is checked here and nothing else about the caller is trusted.
create or replace function public.calendar_feed_events(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare f record;
begin
  if p_token is null or length(p_token) < 20 then raise exception 'unauthorized'; end if;
  select * into f from public.calendar_feeds where token = p_token and direction = 'out' and is_active;
  if not found then raise exception 'unauthorized'; end if;
  update public.calendar_feeds set last_sync_at = now() where id = f.id;

  return jsonb_build_object(
    'name', coalesce((select name from public.companies where id = f.company_id), 'Orbit'),
    'events', coalesce((
      -- appointments booked with this person
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
end $fn$;
grant execute on function public.calendar_feed_events(text) to anon, authenticated;
grant execute on function public.calendar_out_token(uuid, boolean) to authenticated;

-- ------------------------------------------------------------------- inbound
create or replace function public.due_calendar_pulls(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare k text;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret is null or p_secret <> k then raise exception 'unauthorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', f.id, 'url', f.url))
      from public.calendar_feeds f
     where f.direction = 'in' and f.is_active and f.url is not null
       and (f.last_sync_at is null or f.last_sync_at < now() - interval '50 minutes')
     limit 200), '[]'::jsonb);
end $fn$;
grant execute on function public.due_calendar_pulls(text) to anon, authenticated;

-- The parsed blocks come back here. Everything for that feed is replaced, so a
-- deleted event on their side disappears on ours instead of lingering for ever.
create or replace function public.calendar_busy_upsert(p_secret text, p_feed uuid, p_events jsonb, p_error text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare k text; f record; n integer := 0; e jsonb;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret is null or p_secret <> k then raise exception 'unauthorized'; end if;
  select * into f from public.calendar_feeds where id = p_feed and direction = 'in';
  if not found then return 0; end if;

  if p_error is not null then
    update public.calendar_feeds set last_sync_at = now(), last_error = left(p_error, 300) where id = p_feed;
    return 0;
  end if;

  delete from public.calendar_busy where feed_id = p_feed;
  for e in select * from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) loop
    begin
      insert into public.calendar_busy (feed_id, company_id, user_id, uid, title, starts_at, ends_at, all_day)
      values (p_feed, f.company_id, f.user_id,
              coalesce(e->>'uid', gen_random_uuid()::text),
              nullif(e->>'title', ''),
              (e->>'starts_at')::timestamptz,
              (e->>'ends_at')::timestamptz,
              coalesce((e->>'all_day')::boolean, false))
      on conflict (feed_id, uid) do update set
        title = excluded.title, starts_at = excluded.starts_at,
        ends_at = excluded.ends_at, all_day = excluded.all_day, updated_at = now();
      n := n + 1;
    exception when others then continue;
    end;
  end loop;
  update public.calendar_feeds set last_sync_at = now(), last_error = null, event_count = n where id = p_feed;
  return n;
end $fn$;
grant execute on function public.calendar_busy_upsert(text, uuid, jsonb, text) to anon, authenticated;

-- hourly, ten past, so it never lands on the same minute as the reminders
do $sched$
begin
  perform cron.unschedule('orbit-calendar-pull');
exception when others then null;
end $sched$;

do $sched$
begin
  perform cron.schedule('orbit-calendar-pull', '10 * * * *', $cron$
    select net.http_post(
      url     := 'https://orbit.spacework.ai/api/calendar-pull',
      headers := jsonb_build_object(
                   'Content-Type','application/json',
                   'x-cron-secret', (select value from public.app_secrets where key='reminder_cron_secret')),
      body    := '{}'::jsonb
    );
  $cron$);
exception when others then
  raise notice 'pg_cron or pg_net not available - the inbound calendar pull must be triggered another way';
end $sched$;
