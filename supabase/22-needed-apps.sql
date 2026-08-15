-- ============================================================================
--  Spacework ERP  -  NEEDED APPS  (run AFTER 01-21)
--   Calendar   : calendar_events (manual events; the screen also aggregates
--                deadlines from submittals/RFIs/certs/planning/invoices/tasks)
--   Sign       : sign_requests + sign_signatures (sign-off register for IPCs,
--                subcontracts, POs, documents)
--   Recruitment: applicants (pipeline on job positions)
--   Knowledge  : articles (SOPs / method statements / references)
--  Company-scoped RLS.
-- ============================================================================

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null default 'Event',
  event_date date default current_date, start_time text default '', end_time text default '', all_day boolean default true,
  category text default 'meeting',            -- meeting | site_visit | milestone | reminder | deadline | other
  project_id uuid references public.projects(id) on delete set null,
  location text default '', notes text default '', assigned_to text default '',
  done boolean default false, created_at timestamptz default now()
);
create index if not exists idx_calendar_events on public.calendar_events(company_id, event_date);

create table if not exists public.sign_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', title text not null default 'Signature request',
  doc_type text default 'document',           -- ipc | subcontract | purchase_order | contract | document | other
  ref text default '', project_id uuid references public.projects(id) on delete set null,
  status text default 'draft',                -- draft | pending | signed | declined
  notes text default '', created_at timestamptz default now()
);
create table if not exists public.sign_signatures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  request_id uuid not null references public.sign_requests(id) on delete cascade,
  signer_name text default '', signer_role text default '',
  signed_at timestamptz, signature_data text default '', sequence int default 10
);
create index if not exists idx_sign_signatures on public.sign_signatures(company_id, request_id, sequence);

create table if not exists public.applicants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Applicant', email text default '', phone text default '',
  job_id uuid,                                -- soft ref to job positions
  stage text default 'new',                   -- new | screening | interview | offer | hired | rejected
  source text default '', rating int default 0, notes text default '', cv_link text default '',
  applied_date date default current_date, created_at timestamptz default now()
);
create index if not exists idx_applicants on public.applicants(company_id, stage);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null default 'Untitled', category text default '', body text default '',
  is_published boolean default true, updated_at timestamptz default now(), created_at timestamptz default now()
);
create index if not exists idx_articles on public.articles(company_id, category);

do $rls$ declare t text;
begin
  foreach t in array array['calendar_events','sign_requests','sign_signatures','applicants','articles'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;

select 'calendar_events' t, count(*) n from public.calendar_events
union all select 'sign_requests', count(*) from public.sign_requests
union all select 'applicants', count(*) from public.applicants
union all select 'articles', count(*) from public.articles;
