-- ============================================================================
--  Spacework ERP  -  AUTOMATION RULES  (run AFTER 01-42)
--  Company-scoped rules that watch the data and raise notifications ("if X then
--  act"). A rule is a catalog key + on/off + a small params bag; the engine runs
--  client-side and inserts a notification per matching record, deduped by a
--  per-rule/per-record/per-day key so re-runs never spam the bell.
-- ============================================================================

create table if not exists public.automation_rules (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  rule_key   text not null,
  enabled    boolean not null default true,
  params     jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index if not exists idx_auto_rules_uniq on public.automation_rules(company_id, rule_key);
alter table public.automation_rules enable row level security;
drop policy if exists ar_r on public.automation_rules;
create policy ar_r on public.automation_rules for select using (company_id in (select public.my_company_ids()));
drop policy if exists ar_w on public.automation_rules;
create policy ar_w on public.automation_rules for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- dedupe handle on notifications so the engine can insert-or-ignore
alter table public.notifications add column if not exists dedupe_key text;
create unique index if not exists idx_notif_dedupe on public.notifications(company_id, dedupe_key) where dedupe_key is not null;

select 'automations ready' as done;
