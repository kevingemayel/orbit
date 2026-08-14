-- ============================================================================
--  Spacework ERP  -  INSTALLATION (site crews)  (run AFTER 01-16)
--  Job cards for installation crews: install fabricated units on site, log daily
--  progress + labour hours (labour cost books to the project as Labour), track
--  installed vs planned. Company-scoped RLS.
-- ============================================================================
create table if not exists public.install_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', project_id uuid references public.projects(id) on delete set null,
  description text not null default 'Installation', area text default '',
  foreman text default '', crew_size int default 0, unit text default '',
  planned_qty numeric(20,4) default 0, installed_qty numeric(20,4) default 0,
  labour_rate numeric(20,4) default 0, labour_hours numeric(20,4) default 0, labour_cost numeric(20,4) default 0,
  status text default 'draft',                 -- draft | in_progress | done
  start_date date, due_date date, notes text default '',
  created_at timestamptz default now()
);
create index if not exists idx_install_jobs on public.install_jobs(company_id, project_id, status);

create table if not exists public.install_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.install_jobs(id) on delete cascade,
  log_date date default current_date,
  installed_qty numeric(20,4) default 0, hours numeric(20,4) default 0, note text default '',
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz default now()
);

do $rls$ declare t text;
begin
  foreach t in array array['install_jobs','install_logs'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;
