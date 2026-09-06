-- ============================================================================
-- 112-partner-archive.sql  -  Give contacts/customers/vendors an archive flag
-- (they carry transaction history and shouldn't be hard-deleted). Existing rows
-- default to active. Safe to re-run.
-- ============================================================================
alter table public.partners add column if not exists is_active boolean default true;
update public.partners set is_active = true where is_active is null;
