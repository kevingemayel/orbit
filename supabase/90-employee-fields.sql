-- ============================================================================
--  Orbit ERP  -  Employee personal fields (first/last name split, DOB,
--  emergency contact, application-time details)
--  Applied live 2026-08-29 via the Management API; recorded here for the record.
--  Idempotent: safe to re-run on any environment.
-- ============================================================================

alter table public.hr_employees add column if not exists first_name         text;
alter table public.hr_employees add column if not exists last_name          text;
alter table public.hr_employees add column if not exists dob                 date;
alter table public.hr_employees add column if not exists gender              text;
alter table public.hr_employees add column if not exists marital_status      text;
alter table public.hr_employees add column if not exists nationality         text;
alter table public.hr_employees add column if not exists personal_email      text;
alter table public.hr_employees add column if not exists personal_phone      text;
alter table public.hr_employees add column if not exists address             text;
alter table public.hr_employees add column if not exists emergency_name      text;
alter table public.hr_employees add column if not exists emergency_phone     text;
alter table public.hr_employees add column if not exists emergency_relation  text;
alter table public.hr_employees add column if not exists hire_date           date;
alter table public.hr_employees add column if not exists notes               text;

-- Backfill first/last from the existing single name (first token -> first_name, remainder -> last_name)
update public.hr_employees
   set first_name = split_part(name, ' ', 1),
       last_name  = case when position(' ' in name) > 0
                         then substring(name from position(' ' in name) + 1)
                         else '' end
 where first_name is null;

select 'employee personal fields ready' as done;
