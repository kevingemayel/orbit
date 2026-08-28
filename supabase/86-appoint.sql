-- ============================================================================
--  Orbit ERP  -  APPOINT  (appointment-based service platform, as a module)
--  One configurable core for any appointment trade (coach, clinic, legal,
--  wellness). Clients are ordinary partners (so billing + statements reuse the
--  ledger); Appoint adds the scheduling, records and per-trade configuration.
--
--    appt_settings     - one row per company: the trade + terminology.
--    appt_services     - the bookable services (duration, price, location).
--    appt_availability - working hours (per staff, or whole business).
--    appt_appointments - the bookings on the calendar.
--    appt_notes        - the client/patient record: history notes per client.
--
--  Company-scoped RLS, matching the rest of Orbit.
-- ============================================================================

create table if not exists public.appt_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  vertical text default 'coach',            -- coach | clinic | legal | wellness | general
  term_client text default 'Client',        -- Client | Patient | Member | Case owner
  term_appointment text default 'Appointment',
  slot_minutes int default 30,              -- calendar granularity
  created_at timestamptz default now()
);

create table if not exists public.appt_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Session',
  duration_min int default 60,
  price numeric(20,4) default 0,
  currency_code text default '',
  location_type text default 'in_person',   -- in_person | online | phone
  buffer_min int default 0,
  capacity int default 1,                    -- 1 = one-to-one; >1 = class/group
  color text default '',
  staff_id uuid references public.hr_employees(id) on delete set null,
  is_active boolean default true,
  sort int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_appt_services on public.appt_services(company_id, is_active, sort);

create table if not exists public.appt_availability (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  staff_id uuid references public.hr_employees(id) on delete cascade,  -- null = whole business
  weekday int not null default 1,            -- 0=Sun .. 6=Sat
  start_min int not null default 540,        -- minutes from midnight (09:00)
  end_min int not null default 1020,         -- 17:00
  created_at timestamptz default now()
);
create index if not exists idx_appt_availability on public.appt_availability(company_id, staff_id, weekday);

create table if not exists public.appt_appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '',
  client_id uuid references public.partners(id) on delete set null,
  service_id uuid references public.appt_services(id) on delete set null,
  staff_id uuid references public.hr_employees(id) on delete set null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default now(),
  status text default 'booked',              -- booked | confirmed | completed | cancelled | no_show
  location_type text default 'in_person',
  price numeric(20,4) default 0,
  currency_code text default '',
  title text default '',
  notes text default '',
  source text default 'staff',               -- staff | portal
  invoice_id uuid references public.invoices(id) on delete set null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);
create index if not exists idx_appt_appointments on public.appt_appointments(company_id, starts_at);
create index if not exists idx_appt_appointments_client on public.appt_appointments(company_id, client_id);

create table if not exists public.appt_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.partners(id) on delete cascade,
  appointment_id uuid references public.appt_appointments(id) on delete set null,
  note_type text default 'note',             -- note | soap | matter | plan
  title text default '',
  body text default '',
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);
create index if not exists idx_appt_notes on public.appt_notes(company_id, client_id, created_at);

-- ============================ RLS ==========================================
alter table public.appt_settings enable row level security;
drop policy if exists apptset_r on public.appt_settings;
create policy apptset_r on public.appt_settings for select using (company_id in (select public.my_company_ids()));
drop policy if exists apptset_w on public.appt_settings;
create policy apptset_w on public.appt_settings for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.appt_services enable row level security;
drop policy if exists apptsvc_r on public.appt_services;
create policy apptsvc_r on public.appt_services for select using (company_id in (select public.my_company_ids()));
drop policy if exists apptsvc_w on public.appt_services;
create policy apptsvc_w on public.appt_services for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.appt_availability enable row level security;
drop policy if exists apptav_r on public.appt_availability;
create policy apptav_r on public.appt_availability for select using (company_id in (select public.my_company_ids()));
drop policy if exists apptav_w on public.appt_availability;
create policy apptav_w on public.appt_availability for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.appt_appointments enable row level security;
drop policy if exists apptapp_r on public.appt_appointments;
create policy apptapp_r on public.appt_appointments for select using (company_id in (select public.my_company_ids()));
drop policy if exists apptapp_w on public.appt_appointments;
create policy apptapp_w on public.appt_appointments for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.appt_notes enable row level security;
drop policy if exists apptnote_r on public.appt_notes;
create policy apptnote_r on public.appt_notes for select using (company_id in (select public.my_company_ids()));
drop policy if exists apptnote_w on public.appt_notes;
create policy apptnote_w on public.appt_notes for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'appoint ready' as done;
