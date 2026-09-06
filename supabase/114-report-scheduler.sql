-- ============================================================================
-- 114-report-scheduler.sql  -  Email a dashboard report on a schedule (BI gap).
-- Mirrors the existing reminder pattern: pg_cron -> net.http_post -> a Cloudflare
-- function that renders + sends via Resend, using due_report_schedules() and
-- mark_report_schedule_sent(). Safe to re-run.
-- ============================================================================
create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  name text not null default 'Scheduled report',
  cadence text not null default 'weekly',        -- daily | weekly | monthly
  day_of_week int default 1,                     -- 0=Sun..6=Sat (weekly)
  day_of_month int default 1,                    -- 1..28 (monthly)
  hour int not null default 7,                   -- local-ish send hour, UTC based
  recipients text not null default '',           -- comma-separated emails
  active boolean default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_report_schedules on public.report_schedules(company_id, active);

alter table public.report_schedules enable row level security;
drop policy if exists report_schedules_rw on public.report_schedules;
create policy report_schedules_rw on public.report_schedules
  using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));

-- Which schedules are due right now (called by the cron endpoint with the service role).
create or replace function public.due_report_schedules()
returns table (id uuid, company_id uuid, report_id uuid, name text, recipients text, cadence text)
language sql security definer set search_path = public as $fn$
  select s.id, s.company_id, s.report_id, s.name, s.recipients, s.cadence
  from public.report_schedules s
  where s.active
    and coalesce(s.recipients,'') <> ''
    and extract(hour from now() at time zone 'utc')::int = s.hour
    and (s.last_sent_at is null or s.last_sent_at < date_trunc('hour', now()))
    and (
      s.cadence = 'daily'
      or (s.cadence = 'weekly'  and extract(dow from now() at time zone 'utc')::int = coalesce(s.day_of_week,1))
      or (s.cadence = 'monthly' and extract(day from now() at time zone 'utc')::int = coalesce(s.day_of_month,1))
    );
$fn$;

create or replace function public.mark_report_schedule_sent(p_id uuid)
returns void language sql security definer set search_path = public as $fn$
  update public.report_schedules set last_sent_at = now() where id = p_id;
$fn$;
