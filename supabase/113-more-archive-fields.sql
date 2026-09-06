-- ============================================================================
-- 113-more-archive-fields.sql  -  Give the last master-data lists an archive flag
-- so they can be archived instead of only hard-deleted. Existing rows default to
-- active. Safe to re-run.
-- ============================================================================
alter table public.tools           add column if not exists is_active boolean default true;
alter table public.warehouses      add column if not exists is_active boolean default true;
alter table public.stock_locations add column if not exists is_active boolean default true;
alter table public.job_postings    add column if not exists is_active boolean default true;

update public.tools           set is_active = true where is_active is null;
update public.warehouses      set is_active = true where is_active is null;
update public.stock_locations set is_active = true where is_active is null;
update public.job_postings    set is_active = true where is_active is null;
