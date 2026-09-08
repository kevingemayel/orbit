-- ============================================================================
-- 152-appoint-profiles.sql  -  Appoint for anyone you can make an appointment with.
--
-- Appoint could already rename "Client" to "Patient" and seed three service
-- names. That is a vocabulary, not a practice. A dentist, a solicitor and a
-- hairdresser all book time with a person, but what they need to KNOW about
-- that person is completely different, and it is the record, not the calendar,
-- that decides whether the app is usable.
--
-- So a vertical becomes a PROFILE that shapes three things:
--   1. the file kept on the person, section by section
--   2. what must be flagged in red at the top of it (an allergy, a conflict
--      of interest, a failed patch test)
--   3. the shape of a visit note (SOAP for a clinician, an attendance note for
--      a lawyer, the colour formula for a salon)
--
-- and the provider can then add their own fields on top, because no preset
-- survives contact with a real practice.
--
-- The file is a SEPARATE table from the contact on purpose. A contact is shared
-- with sales, purchasing and invoicing across the whole company. A medical
-- history is not, and putting it in partners.custom would spill it into every
-- contact list and every export in the product.
--
-- Safe to re-run.
-- ============================================================================

-- ------------------------------------------------- custom fields: grouping
-- A patient file is not one flat list of fields; it has sections. The custom
-- field engine is shared, so this helps every entity that uses it.
alter table public.custom_field_defs
  add column if not exists section text,
  add column if not exists hint text,
  add column if not exists from_profile text;

comment on column public.custom_field_defs.from_profile is
  'The Appoint profile that seeded this field, so re-applying a profile can tell its own defaults from fields the practice added.';

-- ------------------------------------------------------------- the file
create table if not exists public.appt_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  client_id uuid not null references public.partners (id) on delete cascade,
  file_no text,
  status text not null default 'active',          -- active | discharged | closed
  opened_on date not null default current_date,
  closed_on date,
  assigned_to uuid references public.hr_employees (id) on delete set null,
  -- what must be seen before anything else: allergies, a conflict of interest,
  -- a safeguarding flag. Kept as its own column rather than inside data so it
  -- can be shown without reading the whole record.
  alerts text[] not null default '{}',
  summary text,
  data jsonb not null default '{}'::jsonb,
  consent_given_at timestamptz,
  consent_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists appt_files_one_per_client
  on public.appt_files (company_id, client_id);
create index if not exists appt_files_company_idx
  on public.appt_files (company_id, status);

-- ------------------------------------------------------- structured notes
-- A note keeps its template's parts separately, so "what did the clinician
-- record as the assessment" is answerable later. body stays as the readable
-- rendering, which is what search and print use.
alter table public.appt_notes
  add column if not exists template_key text,
  add column if not exists data jsonb not null default '{}'::jsonb;

-- --------------------------------------------------------------- settings
alter table public.appt_settings
  add column if not exists term_file text,
  add column if not exists file_prefix text,
  add column if not exists is_sensitive boolean not null default false,
  add column if not exists profile_applied_at timestamptz;

comment on column public.appt_settings.is_sensitive is
  'Health, legal and therapy records are special-category or privileged data. Drives the confidentiality banner and the consent prompt on the file.';

-- ------------------------------------------------------------------- RLS
alter table public.appt_files enable row level security;

drop policy if exists appt_files_r on public.appt_files;
drop policy if exists appt_files_w on public.appt_files;

create policy appt_files_r on public.appt_files
  for select to authenticated
  using (company_id in (select public.my_company_ids()));

create policy appt_files_w on public.appt_files
  for all to authenticated
  using (public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- The next file number for a practice, so files read PT-0001 rather than a uuid.
create or replace function public.appt_next_file_no(p_company uuid, p_prefix text default 'F')
returns text language sql stable security definer set search_path = public as $$
  select coalesce(p_prefix, 'F') || '-' ||
         lpad((coalesce(max(nullif(regexp_replace(f.file_no, '^.*[^0-9]', '', 'g'), '')::int), 0) + 1)::text, 4, '0')
    from public.appt_files f
   where f.company_id = p_company
     and f.file_no is not null
     and f.file_no ~ ('^' || coalesce(p_prefix, 'F') || '-[0-9]+$');
$$;

grant execute on function public.appt_next_file_no(uuid, text) to authenticated;

create or replace function public.appt_files_touch() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists appt_files_touch_t on public.appt_files;
create trigger appt_files_touch_t before update on public.appt_files
  for each row execute function public.appt_files_touch();
