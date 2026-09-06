-- ============================================================================
-- 97-careers.sql  -  Job postings + public careers embed (connect-mode).
-- Lets the ERP power a careers page on ANY site (ours or a customer's existing
-- website) via a one-line <script> embed. Public reads/writes go through
-- SECURITY DEFINER RPCs granted to anon; the base tables stay owner-only.
-- Safe to re-run.
-- ============================================================================

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  location text,
  employment_type text,            -- Full-time / Part-time / Contract ...
  department text,
  description text,                 -- plain text or light HTML
  apply_url text,                   -- optional external application link
  is_published boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists job_postings_company_idx on public.job_postings(company_id, is_published, sort);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid references public.job_postings(id) on delete set null,
  name text,
  email text,
  phone text,
  cv_url text,
  message text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists job_applications_company_idx on public.job_applications(company_id, created_at desc);

alter table public.job_postings   enable row level security;
alter table public.job_applications enable row level security;

-- Owner/company-member management of postings (mirrors the sites tables from 96).
drop policy if exists job_postings_rw on public.job_postings;
create policy job_postings_rw on public.job_postings
  using (company_id in (select public.my_company_ids()))
  with check (public.can_write_company(company_id));

-- Applications: company members read; nobody writes directly (writes go via job_apply()).
drop policy if exists job_applications_read on public.job_applications;
create policy job_applications_read on public.job_applications
  for select using (company_id in (select public.my_company_ids()));

-- Public list of a company's PUBLISHED jobs (anyone with the company id can read).
create or replace function public.public_jobs(p_company uuid)
returns table (id uuid, title text, location text, employment_type text, department text, description text, apply_url text)
language sql stable security definer set search_path = public as $$
  select id, title, location, employment_type, department, description, apply_url
  from public.job_postings
  where company_id = p_company and is_published = true
  order by sort, created_at desc
$$;

-- Public application submit (validates the job is published for that company).
create or replace function public.job_apply(p_company uuid, p_job uuid, p_data jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_job is not null and not exists (
    select 1 from public.job_postings where id = p_job and company_id = p_company and is_published = true
  ) then
    raise exception 'unknown job';
  end if;
  insert into public.job_applications(company_id, job_id, name, email, phone, cv_url, message, data)
  values (p_company, p_job,
          nullif(p_data->>'name',''), nullif(p_data->>'email',''), nullif(p_data->>'phone',''),
          nullif(p_data->>'cv_url',''), nullif(p_data->>'message',''), coalesce(p_data,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.public_jobs(uuid) to anon, authenticated;
grant execute on function public.job_apply(uuid, uuid, jsonb) to anon, authenticated;
