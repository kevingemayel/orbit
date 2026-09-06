-- ============================================================================
-- 121-plot-governance.sql  -  Plot part 3: the syndic governance layer, which
-- Orbit has nothing like. Meetings with per-item voting, resolutions, overdue
-- notices, and resident suggestions. Modelled on Plot's own tables, with people
-- as partners and the Arabic-specific columns dropped (Orbit i18n differs).
--
-- Safe to re-run.
-- ============================================================================

-- Meetings (AGM, committee, extraordinary) and their minutes.
create table if not exists public.property_meetings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  meeting_date date,
  kind text not null default 'committee',      -- agm | committee | extraordinary
  title text not null default 'Meeting',
  location text,
  session_no int,
  attendees text,                              -- free text roll-call, or use votes for the formal record
  agenda text,
  decisions text,
  notes text,
  status text not null default 'draft',        -- draft | posted
  posted_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_pmeet_prop on public.property_meetings(property_id, meeting_date);

-- Agenda items / motions inside a meeting. A motion carries the majority rule it
-- needs and, once carried, can point at the resolution it produced.
create table if not exists public.property_meeting_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  meeting_id uuid not null references public.property_meetings(id) on delete cascade,
  kind text not null default 'agenda',         -- agenda | motion | action
  title text not null,
  description text,
  authority text default 'simple_majority',    -- info | simple_majority | two_thirds | unanimous
  responsible_partner_id uuid references public.partners(id) on delete set null,
  due_date date,
  status text not null default 'open',          -- open | carried | rejected | done
  resolution_id uuid,                           -- set when a motion becomes a resolution
  source_suggestion_id uuid,                    -- when the item came from a resident suggestion
  sort int default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_pmitem_meet on public.property_meeting_items(meeting_id, sort);

-- One vote per owner on a motion. Proxy captured so a held vote is auditable.
create table if not exists public.property_meeting_votes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  item_id uuid not null references public.property_meeting_items(id) on delete cascade,
  voter_partner_id uuid references public.partners(id) on delete set null,
  voter_name text,
  unit_id uuid references public.property_units(id) on delete set null,
  shares numeric default 0,                     -- weight of this vote (millieme voting)
  choice text not null default 'abstain',       -- for | against | abstain
  is_proxy boolean not null default false,
  proxy_for text,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_pmvote_one on public.property_meeting_votes(item_id, voter_partner_id) where voter_partner_id is not null;

-- Standing resolutions: the building's binding decisions and rules.
create table if not exists public.property_resolutions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  meeting_id uuid references public.property_meetings(id) on delete set null,
  title text not null,
  body text,
  rule text,                                    -- the durable rule text, if this resolution sets one
  status text not null default 'passed',        -- proposed | passed | rejected | superseded
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_pres_prop on public.property_resolutions(property_id, status);

-- Overdue notices (dunning): staged reminder letters to an owner in arrears.
create table if not exists public.property_notices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.property_units(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  stage int not null default 1,                 -- 1 reminder, 2 warning, 3 formal
  notice_date date not null default current_date,
  amount numeric default 0,
  months_overdue int default 0,
  channel text default 'hand',                  -- hand | email | post | posted_board
  delivered boolean default false,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_pnotice_prop on public.property_notices(property_id, unit_id);

-- Resident suggestions / complaints, which can be escalated into a meeting item.
create table if not exists public.property_suggestions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_id uuid references public.property_units(id) on delete set null,
  submitted_by_partner_id uuid references public.partners(id) on delete set null,
  submitted_by_name text,
  type text not null default 'suggestion',      -- suggestion | complaint | request
  title text not null,
  body text,
  status text not null default 'new',           -- new | reviewing | accepted | rejected | done
  admin_note text,
  decision_note text,
  meeting_id uuid references public.property_meetings(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_psug_prop on public.property_suggestions(property_id, status);

-- Building announcements (pinned notices to residents).
create table if not exists public.property_announcements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  body text,
  pinned boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_pann_prop on public.property_announcements(property_id, pinned);

-- ---------------------------------------------------------------------------
-- RLS: standard Orbit pattern on every table above.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['property_meetings','property_meeting_items','property_meeting_votes',
                           'property_resolutions','property_notices','property_suggestions','property_announcements']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format(
      'create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))',
      t || '_rw', t);
  end loop;
end $$;
