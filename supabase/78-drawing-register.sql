-- ============================================================================
--  Orbit ERP  -  DOCUMENT CONTROL: DRAWING REGISTER + REVISIONS (feature #4)
--  A drawing has a version history of revisions (Rev A/B/C ...), each with its
--  own files (via the existing media table, entity='drawing_rev'), status, and
--  optional links to a submittal / transmittal / RFI. Company-scoped RLS,
--  matching 74-shipments / 18-cockpit-suite.
-- ============================================================================

create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  number text default '',
  title text not null default 'Drawing',
  discipline text default '',
  status text default 'in_progress',      -- in_progress | issued | superseded | void
  current_revision text default '',        -- the live revision letter (denormalised for lists)
  notes text default '',
  created_at timestamptz default now()
);
create index if not exists idx_drawings on public.drawings(company_id, project_id, status);

create table if not exists public.drawing_revisions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  revision text not null default 'A',
  status text default 'draft',             -- draft | issued | approved | rejected | superseded
  issue_purpose text default '',           -- for approval | for construction | as-built ...
  issued_date date,
  received_date date,
  submittal_id uuid references public.submittals(id) on delete set null,
  transmittal_id uuid references public.transmittals(id) on delete set null,
  rfi_id uuid references public.rfis(id) on delete set null,
  superseded_by uuid references public.drawing_revisions(id) on delete set null,
  notes text default '',
  sequence int default 10,
  created_at timestamptz default now()
);
create index if not exists idx_drawing_revisions on public.drawing_revisions(company_id, drawing_id, sequence);

alter table public.drawings enable row level security;
drop policy if exists drawings_r on public.drawings;
create policy drawings_r on public.drawings for select using (company_id in (select public.my_company_ids()));
drop policy if exists drawings_w on public.drawings;
create policy drawings_w on public.drawings for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.drawing_revisions enable row level security;
drop policy if exists drawing_revisions_r on public.drawing_revisions;
create policy drawing_revisions_r on public.drawing_revisions for select using (company_id in (select public.my_company_ids()));
drop policy if exists drawing_revisions_w on public.drawing_revisions;
create policy drawing_revisions_w on public.drawing_revisions for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'drawing register ready' as done;
