-- ============================================================================
--  Spacework ERP  -  EVENTS  (run AFTER 01-51)
--  A full event / wedding management module: an event with guests (invite
--  pipeline + RSVP), visual seating, suppliers, a unified budget that doubles as
--  expenses + a payment schedule, procurement, revenues, tasks/checklist, and
--  cross-company collaboration. Public register/RSVP happen through a Cloudflare
--  function using tokens; the tables stay locked by RLS.
--
--  ISOLATION: every event child row is reachable only through my_event_ids(),
--  which returns events owned by one of my companies PLUS events another company
--  shared with me (accepted collaborator). No event data crosses a tenant unless
--  it was explicitly shared and accepted.
-- ============================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------ events ----
create table if not exists public.event_events (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  company_id   uuid not null references public.companies(id) on delete cascade,
  name         text not null,
  event_type   text default 'wedding',            -- wedding | corporate | private | other
  event_date   date,
  end_date     date,
  venue        text,
  location     text,
  guest_target int,                                -- capacity cap (e.g. 320)
  currency     text default 'USD',
  status       text default 'planning',            -- planning | confirmed | in_progress | done | cancelled
  concept      jsonb default '{}'::jsonb,          -- brief fields (feeling, aesthetic, moments, hashtags...)
  notes        text,
  public_token text default replace(gen_random_uuid()::text,'-',''),   -- registration link
  registration_open boolean default false,
  created_by   uuid default auth.uid(),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_events_co on public.event_events(company_id, status);

-- cross-company collaboration on a single event -------------------------------
create table if not exists public.event_collaborators (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.event_events(id) on delete cascade,
  owner_org_id uuid not null references public.orgs(id) on delete cascade,
  invited_email text,
  invited_org_id uuid references public.orgs(id) on delete set null,
  company_id   uuid references public.companies(id) on delete set null,  -- set when accepted
  role         text default 'editor',              -- editor | viewer
  status       text default 'pending',             -- pending | accepted | declined
  token        text default replace(gen_random_uuid()::text,'-',''),
  created_by   uuid default auth.uid(),
  created_at   timestamptz default now(),
  accepted_at  timestamptz
);
create index if not exists idx_evcollab on public.event_collaborators(event_id, status);

-- which events can the current user reach (owned + accepted collaboration) -----
create or replace function public.my_event_ids()
returns setof uuid language sql stable security definer set search_path=public as $$
  select e.id from public.event_events e where e.company_id in (select public.my_company_ids())
  union
  select ec.event_id from public.event_collaborators ec
    where ec.status = 'accepted'
      and ( (ec.company_id is not null and ec.company_id in (select public.my_company_ids()))
            or (ec.invited_org_id is not null and ec.invited_org_id in (select public.my_orgs())) );
$$;
grant execute on function public.my_event_ids() to authenticated;

-- ------------------------------------------------------------------ guests ----
create table if not exists public.event_guests (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  event_id     uuid not null references public.event_events(id) on delete cascade,
  side         text,                               -- e.g. bride / groom / company
  first_name   text,
  family_name  text,
  category     text,                               -- grouping (family, close friends...)
  priority     text,                               -- A | B | C | D
  invite_stage text default 'longlist',            -- longlist | shortlisted | invited | confirmed | declined | maybe
  rsvp         text default 'pending',             -- pending | yes | no | maybe (guest-set via link)
  plus_ones    int default 0,
  email        text,
  phone        text,
  table_id     uuid,                               -- seating assignment (event_tables)
  seat_no      int,
  dietary      text,
  is_vip       boolean default false,
  notes        text,
  rsvp_token   text default replace(gen_random_uuid()::text,'-',''),   -- personal confirm link
  responded_at timestamptz,
  source       text default 'internal',            -- internal | self_registered
  created_at   timestamptz default now()
);
create index if not exists idx_guests_ev on public.event_guests(event_id, invite_stage);
create index if not exists idx_guests_tok on public.event_guests(rsvp_token);

-- ------------------------------------------------------------- seating --------
create table if not exists public.event_zones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  name text not null, color text default '#0ea5e9', sort int default 10,
  created_at timestamptz default now()
);
create table if not exists public.event_tables (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  zone_id uuid references public.event_zones(id) on delete set null,
  name text not null,
  shape text default 'round',                      -- round | rect
  capacity int default 10,
  x numeric default 60, y numeric default 60,      -- position on the floor plan (px)
  w numeric default 90, h numeric default 90,
  rotation numeric default 0, sort int default 10,
  created_at timestamptz default now()
);
create index if not exists idx_evtables on public.event_tables(event_id);
alter table public.event_guests add constraint event_guests_table_fk
  foreign key (table_id) references public.event_tables(id) on delete set null;

-- ------------------------------------------------------------- suppliers ------
create table if not exists public.event_suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  category text,                                    -- budget category
  name text not null,                               -- supplier / option
  why text,                                         -- quality-vs-price note
  price_band text,
  contact_name text, phone text, email text, source text,
  partner_id uuid references public.partners(id) on delete set null,
  is_pick boolean default false,                    -- best-value pick
  status text default 'to_contact',                 -- to_contact | contacted | quoted | shortlisted | booked | rejected
  notes text, sort int default 10,
  created_at timestamptz default now()
);
create index if not exists idx_evsup on public.event_suppliers(event_id, category);

-- ------------------------------------------- budget (= expenses + schedule) ---
create table if not exists public.event_budget_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  category text, subcategory text, item text,
  cost_basis text default 'fixed',                  -- fixed | per_guest
  rate_per_guest numeric,
  estimated numeric default 0,
  actual numeric default 0,
  supplier_id uuid references public.event_suppliers(id) on delete set null,
  notes text, sort int default 10,
  created_at timestamptz default now()
);
create index if not exists idx_evbud on public.event_budget_lines(event_id, category);

create table if not exists public.event_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  budget_line_id uuid references public.event_budget_lines(id) on delete set null,
  supplier_id uuid references public.event_suppliers(id) on delete set null,
  label text,
  kind text default 'deposit',                      -- deposit | balance | installment
  amount numeric default 0,
  due_date date,
  paid boolean default false, paid_date date,
  is_booking_confirmation boolean default false,     -- booking-confirmation milestone
  method text, reference text, notes text,
  created_at timestamptz default now()
);
create index if not exists idx_evpay on public.event_payments(event_id, due_date);

create table if not exists public.event_procurement (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  supplier_id uuid references public.event_suppliers(id) on delete set null,
  category text, description text,
  qty numeric default 1, unit_price numeric default 0, amount numeric default 0,
  status text default 'planned',                     -- planned | ordered | confirmed | delivered
  needed_by date, notes text,
  created_at timestamptz default now()
);
create index if not exists idx_evproc on public.event_procurement(event_id, status);

create table if not exists public.event_revenues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  source text,                                       -- client fee | contribution | gift | sponsorship
  description text, amount numeric default 0,
  expected_date date, received boolean default false, received_date date, notes text,
  created_at timestamptz default now()
);
create index if not exists idx_evrev on public.event_revenues(event_id);

-- ------------------------------------------------ tasks / checklist -----------
create table if not exists public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid not null references public.event_events(id) on delete cascade,
  phase text, category text,
  title text not null,
  status text default 'not_started',                 -- not_started | in_progress | done | blocked
  assignee text, assignee_id uuid,
  start_date date, due_date date,
  is_payment boolean default false,                  -- payment-scheduling task
  is_booking boolean default false,                  -- booking-confirmation task
  supplier_id uuid references public.event_suppliers(id) on delete set null,
  payment_id uuid references public.event_payments(id) on delete set null,
  sort int default 10, notes text,
  completed_at timestamptz, created_at timestamptz default now()
);
create index if not exists idx_evtasks on public.event_tasks(event_id, status);

-- ============================ RLS ==========================================
-- Parent: reachable if owned or shared-accepted; writable by the owning company
-- or an accepted editor collaborator.
alter table public.event_events enable row level security;
drop policy if exists ev_r on public.event_events;
create policy ev_r on public.event_events for select using (id in (select public.my_event_ids()));
drop policy if exists ev_w on public.event_events;
create policy ev_w on public.event_events for all
  using (public.can_write_company(company_id) or id in (select public.my_event_ids()))
  with check (public.can_write_company(company_id) or id in (select public.my_event_ids()));

alter table public.event_collaborators enable row level security;
drop policy if exists evc_r on public.event_collaborators;
create policy evc_r on public.event_collaborators for select using (
  owner_org_id in (select public.my_orgs())
  or invited_org_id in (select public.my_orgs())
  or lower(invited_email) = lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json->>'email',''))
);
drop policy if exists evc_w on public.event_collaborators;
create policy evc_w on public.event_collaborators for all
  using (owner_org_id in (select public.my_orgs())) with check (owner_org_id in (select public.my_orgs()));

-- Children: one policy shape, gated by my_event_ids().
do $$
declare t text;
begin
  foreach t in array array['event_guests','event_zones','event_tables','event_suppliers','event_budget_lines','event_payments','event_procurement','event_revenues','event_tasks']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('create policy %I_r on public.%I for select using (event_id in (select public.my_event_ids()));', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format('create policy %I_w on public.%I for all using (event_id in (select public.my_event_ids())) with check (event_id in (select public.my_event_ids()));', t, t);
  end loop;
end $$;

select 'events ready' as done;
