-- ============================================================================
-- 109-wps-fields.sql  -  WPS (Wage Protection System) export fields for GCC
-- payroll (Dolphin/HR gap). Per-employee salary-file identifiers; the employer
-- header config lives in companies.profile (wps_employer_id / wps_bank_code).
-- Safe to re-run.
-- ============================================================================
alter table public.hr_employees add column if not exists wps_person_id text;   -- labour card / MOL personal number
alter table public.hr_employees add column if not exists iban text;
alter table public.hr_employees add column if not exists routing_code text;     -- employee bank / agent routing code
alter table public.hr_employees add column if not exists bank_name text;
