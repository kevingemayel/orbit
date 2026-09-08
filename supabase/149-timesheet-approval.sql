-- ============================================================================
-- 149-timesheet-approval.sql  -  hours are money, so they need a signature.
--
-- Timesheets had no approval at all: anyone could log any hours to any project
-- and those hours went straight into job cost and straight onto a client
-- invoice. Every other document that moves money has a gate; this one did not.
--
-- Safe to re-run.
-- ============================================================================

alter table public.timesheets
  add column if not exists approved boolean not null default false,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz;

create index if not exists timesheets_approval_idx
  on public.timesheets (company_id, approved, work_date desc);

-- Existing hours are grandfathered as approved. Anything logged from now on
-- starts unapproved, so switching this on does not turn a year of history red
-- and does not quietly un-bill work already invoiced.
update public.timesheets set approved = true, approved_by = 'migrated', approved_at = now()
 where approved = false;
