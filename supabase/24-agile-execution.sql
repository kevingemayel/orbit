-- ============================================================================
--  Spacework ERP  -  AGILE EXECUTION LAYER  (run AFTER 01-23)
--   The INTERNAL agile project board (Asana / ActiveCollab style), kept
--   distinct from the CLIENT-facing Delivery view (contract / BOQ / programme).
--   - Enriches project_tasks with board / assignee / sprint / priority fields
--   - sprints            : optional timeboxes
--   - task_comments      : threaded discussion + @employee mentions
--   - task_checklists    : sub-steps inside a task
--   - task_watchers      : who follows a task
--   - task_activity      : per-task + per-project activity feed
--  Assignees are HR employees (hr_employees), not app logins.
--  Company-scoped RLS.
-- ============================================================================

-- ---- 1. enrich project_tasks (all additive, safe to re-run) ----------------
alter table public.project_tasks add column if not exists assignee_id     uuid references public.hr_employees(id) on delete set null;
alter table public.project_tasks add column if not exists board_stage     text default 'backlog';   -- backlog | todo | in_progress | review | done
alter table public.project_tasks add column if not exists priority        text default 'medium';    -- low | medium | high | urgent
-- base project_tasks may already carry an Odoo-style integer `priority`; coerce to text
do $pri$ begin
  if (select data_type from information_schema.columns where table_name='project_tasks' and column_name='priority') <> 'text' then
    alter table public.project_tasks alter column priority drop default;
    alter table public.project_tasks alter column priority type text using priority::text;
    alter table public.project_tasks alter column priority set default 'medium';
    update public.project_tasks set priority='medium' where priority is null or priority !~ '^(low|medium|high|urgent)$';
  end if;
end $pri$;
alter table public.project_tasks add column if not exists points          numeric(10,2) default 0;  -- effort estimate (story points / days)
alter table public.project_tasks add column if not exists sprint_id       uuid;                     -- FK added after sprints exists
alter table public.project_tasks add column if not exists parent_task_id  uuid references public.project_tasks(id) on delete set null;
alter table public.project_tasks add column if not exists blocked_by      uuid references public.project_tasks(id) on delete set null;
alter table public.project_tasks add column if not exists sort_order      int default 0;
alter table public.project_tasks add column if not exists labels          text[] default '{}';
alter table public.project_tasks add column if not exists is_agile        boolean default false;    -- true = lives on the execution board
alter table public.project_tasks add column if not exists date_start      date;
alter table public.project_tasks add column if not exists completed_at    timestamptz;

-- ---- 2. sprints ------------------------------------------------------------
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null default 'Sprint', goal text default '',
  start_date date, end_date date,
  status text default 'planned',                 -- planned | active | done
  sort_order int default 10, created_at timestamptz default now()
);
create index if not exists idx_sprints on public.sprints(company_id, project_id, status);

-- late FK: project_tasks.sprint_id -> sprints
do $sf$ begin
  if not exists (select 1 from information_schema.table_constraints
                 where constraint_name = 'project_tasks_sprint_fk') then
    alter table public.project_tasks
      add constraint project_tasks_sprint_fk
      foreign key (sprint_id) references public.sprints(id) on delete set null;
  end if;
end $sf$;

-- ---- 3. task_comments ------------------------------------------------------
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  body text not null default '',
  author_id uuid default auth.uid(), author_name text default '',
  mentions uuid[] default '{}',                  -- hr_employee ids mentioned
  created_at timestamptz default now()
);
create index if not exists idx_task_comments on public.task_comments(company_id, task_id, created_at);

-- ---- 4. task_checklists ----------------------------------------------------
create table if not exists public.task_checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  title text not null default '', is_done boolean default false,
  sort_order int default 10, created_at timestamptz default now()
);
create index if not exists idx_task_checklists on public.task_checklists(company_id, task_id, sort_order);

-- ---- 5. task_watchers ------------------------------------------------------
create table if not exists public.task_watchers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  created_at timestamptz default now(),
  unique (task_id, employee_id)
);
create index if not exists idx_task_watchers on public.task_watchers(company_id, task_id);

-- ---- 6. task_activity (feed) ----------------------------------------------
create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid references public.project_tasks(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  actor_name text default '', verb text default '', detail text default '',
  created_at timestamptz default now()
);
create index if not exists idx_task_activity on public.task_activity(company_id, project_id, created_at desc);

-- ---- 7. RLS ----------------------------------------------------------------
do $rls$ declare t text;
begin
  foreach t in array array['sprints','task_comments','task_checklists','task_watchers','task_activity'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;

select 'sprints' t, count(*) n from public.sprints
union all select 'task_comments', count(*) from public.task_comments
union all select 'task_checklists', count(*) from public.task_checklists
union all select 'task_watchers', count(*) from public.task_watchers
union all select 'task_activity', count(*) from public.task_activity;
