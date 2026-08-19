-- ============================================================================
--  Spacework ERP  -  CUSTOM FIELDS + TERMINOLOGY (ORB-06b)   run AFTER 01-39
--  Two tenant-configurable layers, both company-scoped with the standard helpers:
--   1. custom_field_defs + a `custom` jsonb bag on master records, so an admin adds
--      their own fields to Contacts / Projects / Products without a schema change.
--   2. term_overrides, keyed by the default English label, so an admin renames the
--      nouns the app shows them (e.g. "Vendors" -> "Suppliers", "Projects" -> "Jobs").
-- ============================================================================

-- 1) CUSTOM FIELD DEFINITIONS -------------------------------------------------
create table if not exists public.custom_field_defs (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity     text not null check (entity in ('partner','project','product')),
  field_key  text not null,
  label      text not null,
  field_type text not null default 'text' check (field_type in ('text','number','date','select','checkbox')),
  options    text default '',           -- comma-separated choices, for field_type = 'select'
  required   boolean not null default false,
  sort       int not null default 10,
  is_active  boolean not null default true,
  created_at timestamptz default now()
);
create unique index if not exists idx_cfd_uniq on public.custom_field_defs(company_id, entity, lower(field_key));
create index if not exists idx_cfd_lookup on public.custom_field_defs(company_id, entity, sort);
alter table public.custom_field_defs enable row level security;
drop policy if exists cfd_r on public.custom_field_defs;
create policy cfd_r on public.custom_field_defs for select using (company_id in (select public.my_company_ids()));
drop policy if exists cfd_w on public.custom_field_defs;
create policy cfd_w on public.custom_field_defs for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- a jsonb bag on each master record to hold the values for those custom fields
alter table public.partners add column if not exists custom jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists custom jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists custom jsonb not null default '{}'::jsonb;

-- 2) TERMINOLOGY OVERRIDES ----------------------------------------------------
create table if not exists public.term_overrides (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  term_key   text not null,             -- the default label, e.g. 'Vendors'
  label      text not null,             -- what to show instead, e.g. 'Suppliers'
  created_at timestamptz default now()
);
create unique index if not exists idx_term_uniq on public.term_overrides(company_id, term_key);
alter table public.term_overrides enable row level security;
drop policy if exists trm_r on public.term_overrides;
create policy trm_r on public.term_overrides for select using (company_id in (select public.my_company_ids()));
drop policy if exists trm_w on public.term_overrides;
create policy trm_w on public.term_overrides for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'custom fields + terminology ready' as done;
