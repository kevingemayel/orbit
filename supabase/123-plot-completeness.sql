-- ============================================================================
-- 123-plot-completeness.sql  -  Close the gaps found auditing the Plot port.
--
-- The first pass carried buildings/units/owners/tenancies/charges/invoices but
-- left real Plot capability (and real Adma 92 data) behind. This adds the
-- missing entities so nothing is lost:
--   * building profile + money settings (reserve %, opening balance, committee
--     officers, disclaimer, legal/cadastral fields, give-back rules)
--   * annual budget with lines (budget vs actual)
--   * capital projects and contractor bids
--   * concierge checklists and photo check-ins
--   * a building document library
--   * committee tasks
-- Building expenses are NOT given their own table: they map to Orbit vendor
-- bills (in_invoice) carrying property_id, per the "post into Orbit's ledger"
-- decision, so a building's costs land in its P&L.
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Building profile + money settings (was Plot's per-building `settings` row)
-- ---------------------------------------------------------------------------
alter table public.properties add column if not exists profile jsonb not null default '{}'::jsonb;
alter table public.properties add column if not exists opening_balance numeric not null default 0;
alter table public.properties add column if not exists cash_limit numeric;
alter table public.properties add column if not exists giveback_split text not null default 'share';  -- share | equal | paid

-- Bills (building expenses) need the same dimension invoices already have.
alter table public.invoices add column if not exists property_block text;

-- ---------------------------------------------------------------------------
-- Annual budget
-- ---------------------------------------------------------------------------
create table if not exists public.property_budgets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  year int not null,
  name text,
  status text not null default 'draft',          -- draft | approved | closed
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pbud_prop on public.property_budgets(property_id, year);

create table if not exists public.property_budget_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  budget_id uuid not null references public.property_budgets(id) on delete cascade,
  category text not null default 'other',
  label text,
  amount numeric not null default 0,
  notes text,
  sort int default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_pbudl_b on public.property_budget_lines(budget_id, sort);

-- ---------------------------------------------------------------------------
-- Capital works projects and contractor bids
-- ---------------------------------------------------------------------------
create table if not exists public.property_projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'idea',           -- idea | bidding | awarded | in_progress | done | cancelled
  budget_estimate numeric not null default 0,
  progress int not null default 0,               -- 0..100
  is_public boolean not null default false,      -- visible to residents in the portal
  awarded_partner_id uuid references public.partners(id) on delete set null,
  awarded_amount numeric,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_pproj_prop on public.property_projects(property_id, status);

create table if not exists public.property_bids (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.property_projects(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  bidder_name text,
  amount numeric not null default 0,
  duration_days int,
  status text not null default 'received',       -- received | shortlisted | awarded | rejected
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pbid_proj on public.property_bids(project_id, status);

-- ---------------------------------------------------------------------------
-- Concierge checklist + photo check-ins
-- ---------------------------------------------------------------------------
create table if not exists public.property_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  requires_photo boolean not null default false,
  is_active boolean not null default true,
  sort int default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_pchk_prop on public.property_checklist_items(property_id, is_active, sort);

create table if not exists public.property_checkins (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  item_id uuid references public.property_checklist_items(id) on delete set null,
  kind text not null default 'concierge',        -- concierge | worker | inspection
  actor_name text,
  photo_url text,
  note text,
  done_at timestamptz not null default now(),
  done_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists idx_pci_prop on public.property_checkins(property_id, done_date);

-- ---------------------------------------------------------------------------
-- Building document library
-- ---------------------------------------------------------------------------
create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  category text default 'general',               -- general | minutes | contract | insurance | legal | plan | statement
  file_url text,
  notes text,
  is_public boolean not null default false,      -- residents can see it in the portal
  created_at timestamptz not null default now()
);
create index if not exists idx_pdoc_prop on public.property_documents(property_id, category);

-- ---------------------------------------------------------------------------
-- Committee tasks
-- ---------------------------------------------------------------------------
create table if not exists public.property_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',            -- todo | doing | done
  priority text not null default 'medium',        -- low | medium | high
  assignee_partner_id uuid references public.partners(id) on delete set null,
  assignee_name text,
  due_date date,
  source_suggestion_id uuid references public.property_suggestions(id) on delete set null,
  source_meeting_id uuid references public.property_meetings(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ptask_prop on public.property_tasks(property_id, status);

-- ---------------------------------------------------------------------------
-- RLS on every new table
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['property_budgets','property_budget_lines','property_projects','property_bids',
                           'property_checklist_items','property_checkins','property_documents','property_tasks']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format(
      'create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))',
      t || '_rw', t);
  end loop;
end $$;
