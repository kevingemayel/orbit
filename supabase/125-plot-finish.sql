-- ============================================================================
-- 125-plot-finish.sql  -  Schema for the rest of the Plot punch list.
--
--   * soft delete + an activity log (today every Plot record is hard-deleted
--     and nothing records who did what - a syndic is expected to keep a trail)
--   * ownership history is already start_date/end_date on property_ownerships;
--     add the notes and the sale bookkeeping a transfer needs
--   * recurring committee tasks
--   * the hard budget-line link on a bill (we were matching on category)
--   * per-building roles (treasurer / concierge / committee), which Orbit's
--     company-level roles cannot express
--   * the resident record: emergency contact, vehicle, occupants, move in/out
--   * meeting notice date + lock, for the statutory notice period
--   * assessments: a one-off levy is a charge run of a different kind
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Soft delete across the Plot tables
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['properties','property_units','property_ownerships','property_tenancies',
                           'property_charges','property_charge_runs','property_meetings','property_meeting_items',
                           'property_resolutions','property_notices','property_suggestions','property_announcements',
                           'property_budgets','property_budget_lines','property_projects','property_bids',
                           'property_checklist_items','property_checkins','property_documents','property_tasks']
  loop
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
    execute format('alter table public.%I add column if not exists deleted_by text', t);
  end loop;
end $$;

-- Who did what, when. Append-only from the app's point of view.
create table if not exists public.property_activity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  actor text,
  action text not null,                    -- created | updated | deleted | restored | posted | billed | decided
  entity text not null,                    -- table name
  entity_id uuid,
  label text,                              -- human name of the thing
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pact_prop on public.property_activity(property_id, created_at desc);
create index if not exists idx_pact_co on public.property_activity(company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Ownership history / unit transfer
-- ---------------------------------------------------------------------------
alter table public.property_ownerships add column if not exists notes text;
alter table public.property_ownerships add column if not exists sale_price numeric;

-- ---------------------------------------------------------------------------
-- Recurring committee tasks
-- ---------------------------------------------------------------------------
alter table public.property_tasks add column if not exists recur text;          -- weekly | monthly | quarterly | yearly
alter table public.property_tasks add column if not exists recur_next date;
alter table public.property_tasks add column if not exists remind_email text;

-- ---------------------------------------------------------------------------
-- Hard link a bill to the budget line it spends against
-- ---------------------------------------------------------------------------
alter table public.invoices add column if not exists property_budget_line_id uuid references public.property_budget_lines(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Per-building roles
-- ---------------------------------------------------------------------------
create table if not exists public.property_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete cascade,
  name text,
  email text,
  role text not null default 'committee',  -- head | treasurer | secretary | committee | property_manager | concierge | worker | resident
  start_date date,
  end_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pmem_prop on public.property_members(property_id, is_active);

-- ---------------------------------------------------------------------------
-- The resident record (Plot kept far more than a name on a unit)
-- ---------------------------------------------------------------------------
create table if not exists public.property_residents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.property_units(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  name text,
  resident_type text default 'owner',      -- owner | tenant | family | staff
  phone text,
  whatsapp text,
  email text,
  occupants int,
  move_in date,
  move_out date,
  vehicle_plate text,
  parking_spot text,
  emergency_name text,
  emergency_phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_pres_prop2 on public.property_residents(property_id, is_active);

-- ---------------------------------------------------------------------------
-- Meetings: statutory notice period + a real lock
-- ---------------------------------------------------------------------------
alter table public.property_meetings add column if not exists notice_date date;
alter table public.property_meetings add column if not exists locked boolean not null default false;
alter table public.property_meetings add column if not exists minutes_html text;

-- ---------------------------------------------------------------------------
-- Assessments: a one-off levy is a run of a different kind
-- ---------------------------------------------------------------------------
alter table public.property_charge_runs add column if not exists kind text not null default 'recurring';  -- recurring | assessment
alter table public.property_charge_runs add column if not exists basis text;                              -- share | equal

-- ---------------------------------------------------------------------------
-- RLS on the new tables
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['property_activity','property_members','property_residents']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format(
      'create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))',
      t || '_rw', t);
  end loop;
end $$;
