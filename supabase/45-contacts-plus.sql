-- ============================================================================
--  Spacework ERP  -  CONTACTS: capabilities, industry list, specialty, address
--  (run AFTER 01-44)
--  Vendors get a tick-list of what they can supply; contacts get a managed
--  industry dropdown + a short specialty; addresses gain building/floor. The
--  capability + industry master lists are org-scoped so any member can grow them
--  on the spot while adding a contact.
-- ============================================================================
alter table public.partners add column if not exists specialty    text;
alter table public.partners add column if not exists building      text;
alter table public.partners add column if not exists floor         text;
alter table public.partners add column if not exists capabilities  text[];   -- what a vendor can supply
create index if not exists idx_partners_caps on public.partners using gin (capabilities);

-- master list: what a vendor can supply (Aluminium, Glass, Sealants, Fabrication...)
create table if not exists public.capabilities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
create unique index if not exists idx_capabilities_uniq on public.capabilities(org_id, lower(name));
alter table public.capabilities enable row level security;
drop policy if exists cap_r on public.capabilities;
create policy cap_r on public.capabilities for select using (org_id in (select public.my_orgs()));
drop policy if exists cap_w on public.capabilities;
create policy cap_w on public.capabilities for all using (org_id in (select public.my_orgs())) with check (org_id in (select public.my_orgs()));

-- master list: industries (managed dropdown that can gain extra items)
create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
create unique index if not exists idx_industries_uniq on public.industries(org_id, lower(name));
alter table public.industries enable row level security;
drop policy if exists ind_r on public.industries;
create policy ind_r on public.industries for select using (org_id in (select public.my_orgs()));
drop policy if exists ind_w on public.industries;
create policy ind_w on public.industries for all using (org_id in (select public.my_orgs())) with check (org_id in (select public.my_orgs()));

select 'contacts plus ready' as done;
