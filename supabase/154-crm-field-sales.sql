-- ============================================================================
-- 154-crm-field-sales.sql  -  the fields a CRM needs when the lead is a PLACE.
--
-- Orbit's CRM assumed a lead is a company you phone. A great many businesses
-- sell to a SITE instead: a building going up, a shop being fitted out, a house
-- being renovated. For them the questions are different and none of them had a
-- home in the schema:
--
--   where is it, exactly (a pin, not a postal address)
--   which area does it belong to, so a rep can work a round
--   how far along is THEIR project, because that decides when to call
--   who are the several people involved, and in what role
--   what did we quote, when, and against what specification
--   what is the next thing anyone is supposed to do about it
--
-- These are real columns on crm_leads rather than custom fields, because they
-- are not one company's idiosyncrasy: any field-sales team asks all six.
-- crm_leads also had no notes column at all, which is why this data was living
-- in a spreadsheet in the first place.
--
-- Safe to re-run.
-- ============================================================================

alter table public.crm_leads
  -- the free text every CRM needs and this one did not have
  add column if not exists notes text,
  -- where, and which round it belongs to
  add column if not exists area text,
  add column if not exists map_url text,
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7),
  -- how the prospect stands with us, and how far along their own project is
  add column if not exists qualification text,
  add column if not exists site_stage text,
  -- what happens next, and whose job it is
  add column if not exists next_action text,
  add column if not exists next_action_date date,
  add column if not exists next_action_owner text,
  -- what we put in front of them
  add column if not exists docs_status text,
  add column if not exists quoted_amount numeric,
  add column if not exists quoted_currency text,
  add column if not exists quoted_at date,
  add column if not exists quote_spec text;

comment on column public.crm_leads.area is
  'Sales area or round the lead belongs to. Free text so it fits territories, districts or routes.';
comment on column public.crm_leads.qualification is
  'How the prospect stands with us: interested, not interested, already has a supplier, not contacted yet.';
comment on column public.crm_leads.site_stage is
  'How far along the prospect''s OWN project is, which is what decides when to call. Free text: a builder says "floors pouring", a software buyer says "budget approved".';
comment on column public.crm_leads.docs_status is
  'What we have from them in order to quote: drawings, a brief, a specification.';

create index if not exists crm_leads_area_idx on public.crm_leads (company_id, area);
create index if not exists crm_leads_next_action_idx
  on public.crm_leads (company_id, next_action_date) where next_action_date is not null;

-- ------------------------------------------------------------------ contacts
-- One lead, several people. On a building site there is an owner, an architect,
-- a contractor and whoever answered the phone, and losing which is which is
-- losing most of the value of the record.
create table if not exists public.crm_lead_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  lead_id uuid not null references public.crm_leads (id) on delete cascade,
  partner_id uuid references public.partners (id) on delete set null,
  name text not null,
  role text,
  phone text,
  email text,
  note text,
  is_primary boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists crm_lead_contacts_lead_idx on public.crm_lead_contacts (lead_id, sort);
create index if not exists crm_lead_contacts_company_idx on public.crm_lead_contacts (company_id);

alter table public.crm_lead_contacts enable row level security;
drop policy if exists crm_lead_contacts_r on public.crm_lead_contacts;
drop policy if exists crm_lead_contacts_w on public.crm_lead_contacts;
create policy crm_lead_contacts_r on public.crm_lead_contacts
  for select to authenticated using (company_id in (select public.my_company_ids()));
create policy crm_lead_contacts_w on public.crm_lead_contacts
  for all to authenticated
  using (public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- A lead can carry photographs like any other record. media is already generic;
-- this just makes the intent explicit for anyone reading the schema.
comment on table public.crm_lead_contacts is
  'The several people attached to one lead, each with a role. Photos of a lead live in media with entity = ''lead''.';
