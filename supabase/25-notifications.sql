-- ============================================================================
--  Spacework ERP  -  NOTIFICATIONS  (run AFTER 01-24)
--   In-app alerts surfaced by the top-bar bell. Targets a company (owner sees
--   all) and optionally an employee/user for future per-person filtering.
--   Written by notify() in the app on assignment, @mention, approval request
--   and approval decision, plus scheduled reminders (pg_cron).
--  Company-scoped RLS.
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid,                                  -- target auth user (nullable)
  employee_id uuid references public.hr_employees(id) on delete set null,
  kind text default 'system',                    -- mention | assignment | approval_request | approval_result | reminder | system
  title text not null default '', body text default '',
  link_action text, link_id uuid,                -- where clicking navigates
  actor_name text default '',
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_notifications on public.notifications(company_id, is_read, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists notifications_r on public.notifications;
drop policy if exists notifications_w on public.notifications;
create policy notifications_r on public.notifications for select using (company_id in (select public.my_company_ids()));
create policy notifications_w on public.notifications for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'notifications' t, count(*) n from public.notifications;
