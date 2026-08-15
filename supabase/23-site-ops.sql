-- ============================================================================
--  Spacework ERP  -  SITE OPERATIONS (construction depth)  (run AFTER 01-22)
--   Snagging / QHSE : inspections + snags (punch list / defects)
--   Plant & equipment: register (owned / hired) + status
--   Site diary       : daily log (weather, manpower, delays)
--   Programme (Gantt): schedule_tasks = the CLIENT-facing programme, kept
--                      separate from the internal agile task board (that layer
--                      enriches project_tasks in a later migration)
--  Company-scoped RLS.
-- ============================================================================

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', project_id uuid references public.projects(id) on delete set null,
  insp_type text default 'quality',            -- quality | safety | handover | pre_pour | snag
  insp_date date default current_date, inspector text default '', area text default '',
  status text default 'open',                  -- open | closed
  score int default 0, notes text default '', created_at timestamptz default now()
);
create index if not exists idx_inspections on public.inspections(company_id, project_id, status);

create table if not exists public.snags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', project_id uuid references public.projects(id) on delete set null,
  inspection_id uuid references public.inspections(id) on delete set null,
  location text default '', description text not null default 'Snag',
  severity text default 'medium',              -- low | medium | high | critical
  trade text default '', assigned_to uuid references public.hr_employees(id) on delete set null,
  due_date date, status text default 'open',   -- open | in_progress | fixed | verified | closed
  photo_url text default '', created_at timestamptz default now()
);
create index if not exists idx_snags on public.snags(company_id, project_id, status);

create table if not exists public.plant_equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text default '', name text not null default 'Equipment', category text default '',
  ownership text default 'owned',              -- owned | hired
  supplier text default '', daily_rate numeric(20,4) default 0,
  status text default 'available',             -- available | on_site | maintenance | off_hired
  project_id uuid references public.projects(id) on delete set null,
  location text default '', start_date date, end_date date, next_service_date date,
  notes text default '', created_at timestamptz default now()
);
create index if not exists idx_plant on public.plant_equipment(company_id, status);

create table if not exists public.site_diaries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  diary_date date default current_date, weather text default '', temperature text default '',
  manpower int default 0, subcontractor_count int default 0,
  work_done text default '', delays text default '', materials_received text default '',
  visitors text default '', notes text default '', created_at timestamptz default now()
);
create index if not exists idx_site_diaries on public.site_diaries(company_id, project_id, diary_date);

create table if not exists public.schedule_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null default 'Activity', wbs text default '',
  start_date date, end_date date, progress numeric(6,2) default 0,
  depends_on uuid references public.schedule_tasks(id) on delete set null,
  is_milestone boolean default false, color text default '', sort_order int default 10,
  created_at timestamptz default now()
);
create index if not exists idx_schedule_tasks on public.schedule_tasks(company_id, project_id, sort_order);

do $rls$ declare t text;
begin
  foreach t in array array['inspections','snags','plant_equipment','site_diaries','schedule_tasks'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;

select 'inspections' t, count(*) n from public.inspections
union all select 'snags', count(*) from public.snags
union all select 'plant_equipment', count(*) from public.plant_equipment
union all select 'site_diaries', count(*) from public.site_diaries
union all select 'schedule_tasks', count(*) from public.schedule_tasks;
