-- ============================================================================
--  Orbit ERP  -  Appointment reminder emails (run AFTER 89 + 91)
--  Reuses the existing reminder_cron_secret + pg_cron + pg_net setup from
--  57-events-reminders.sql. An hourly scheduler calls the Cloudflare function
--  /api/run-appt-reminders, which asks for appointments coming up inside each
--  company's reminder window (Appoint > Settings), emails the client via Resend,
--  and stamps reminder_sent_at so nobody is emailed twice.
--  Safe to run in the Supabase SQL editor. Idempotent.
-- ============================================================================

-- The shared cron secret already exists (from 57-events-reminders.sql); create it
-- defensively in case this runs on an environment that never had events.
create table if not exists public.app_secrets (
  key text primary key, value text not null, updated_at timestamptz default now()
);
insert into public.app_secrets(key, value)
  values ('reminder_cron_secret', encode(gen_random_bytes(24),'hex'))
  on conflict (key) do nothing;

-- 1) appointments due for a reminder now (per-company window from appt_settings)
create or replace function public.due_appt_reminders(p_secret text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare k text;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret is null or p_secret <> k then raise exception 'unauthorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',          a.id,
      'to',          pt.email,
      'client_name', pt.name,
      'business',    co.name,
      'service',     sv.name,
      'starts_at',   a.starts_at,
      'location',    a.location_type,
      'term_appt',   coalesce(st.term_appointment, 'Appointment'),
      'currency',    co.currency_code,
      'price',       a.price
    ) order by a.starts_at)
    from public.appt_appointments a
    join public.appt_settings st on st.company_id = a.company_id
    join public.companies     co on co.id = a.company_id
    left join public.partners     pt on pt.id = a.client_id
    left join public.appt_services sv on sv.id = a.service_id
    where st.reminders_enabled = true
      and a.reminder_sent_at is null
      and coalesce(a.status,'booked') not in ('cancelled','completed','no_show')
      and a.starts_at > now()
      and a.starts_at <= now() + (coalesce(st.reminder_hours, 24) || ' hours')::interval
      and pt.email is not null and pt.email like '%@%.%'
  ), '[]'::jsonb);
end $$;
grant execute on function public.due_appt_reminders(text) to anon, authenticated;

-- 2) stamp the appointments we emailed
create or replace function public.mark_appt_reminders_sent(p_secret text, p_ids uuid[])
returns int language plpgsql security definer set search_path=public as $$
declare k text; n int;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret <> k then raise exception 'unauthorized'; end if;
  update public.appt_appointments set reminder_sent_at = now() where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.mark_appt_reminders_sent(text, uuid[]) to anon, authenticated;

-- 3) hourly scheduler: pg_cron -> pg_net POST to the Cloudflare function
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('appt-reminders');
exception when others then null;
end $$;

select cron.schedule('appt-reminders', '0 * * * *', $cron$
  select net.http_post(
    url     := 'https://orbit.spacework.ai/api/run-appt-reminders',
    headers := jsonb_build_object(
                 'Content-Type','application/json',
                 'x-cron-secret', (select value from public.app_secrets where key='reminder_cron_secret')),
    body    := '{}'::jsonb
  );
$cron$);

select 'appointment reminders ready' as done;
