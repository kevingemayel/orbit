-- ============================================================================
--  Spacework ERP  -  database schema  (Supabase / Postgres)
--  Multi-tenant from day one: every business is a "company"; a user can belong
--  to one or more companies; Row-Level Security keeps each company's data
--  private. Built on the lessons from the Property Manager lockdown.
--  Run once in a NEW Supabase project:  SQL Editor > New query > paste > Run.
-- ============================================================================

-- ---- 1. COMPANIES (the tenant) + membership -------------------------------
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  country       text default 'Lebanon',
  base_currency text not null default 'USD',
  address       text default '',
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text default '',
  active_company_id uuid references public.companies(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists public.company_members (
  user_id     uuid references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete cascade,
  role        text not null default 'member',      -- 'admin' | 'member'
  created_at  timestamptz default now(),
  primary key (user_id, company_id)
);

-- auto-create a profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- 2. CORE BUSINESS TABLES (all carry company_id) -----------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, contact_name text default '', email text default '',
  phone text default '', address text default '', vat text default '',
  created_at timestamptz default now()
);

create table if not exists public.services (          -- service / product catalog
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, unit text default 'hour', unit_price numeric not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null, stage text default 'in_progress',   -- lead|quoted|in_progress|review|delivered
  value_usd numeric default 0, progress int default 0,
  start_date date default current_date, due_date date,
  created_at timestamptz default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  number text not null, quote_date date default current_date,
  status text default 'draft',                              -- draft|sent|accepted|declined
  amount_usd numeric not null default 0, notes text default '',
  created_at timestamptz default now()
);
create table if not exists public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade,
  description text default '', qty numeric default 1, unit_price numeric default 0
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  number text not null, issue_date date default current_date, due_date date,
  status text default 'unpaid',                             -- unpaid|partial|paid|overdue|cancelled
  amount_usd numeric not null default 0, created_at timestamptz default now()
);
create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text default '', qty numeric default 1, unit_price numeric default 0
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  amount_usd numeric not null default 0, method text default 'bank',
  paid_at date default current_date, reference text default ''
);

create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  work_date date default current_date, task text default '', hours numeric not null default 0
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  category text default 'general', description text default '',
  amount_usd numeric not null default 0, spent_at date default current_date,
  status text default 'paid'
);

create index if not exists idx_clients_co  on public.clients(company_id);
create index if not exists idx_projects_co on public.projects(company_id);
create index if not exists idx_invoices_co on public.invoices(company_id);
create index if not exists idx_quotes_co   on public.quotes(company_id);

-- ---- 3. HELPERS (SECURITY DEFINER, so policies never recurse) -------------
create or replace function public.my_company_ids()
returns setof uuid language sql security definer set search_path = public stable as $$
  select company_id from public.company_members where user_id = auth.uid();
$$;
create or replace function public.role_in_company(cid uuid)
returns text language sql security definer set search_path = public stable as $$
  select role from public.company_members where user_id = auth.uid() and company_id = cid;
$$;
create or replace function public.is_member(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.company_members where user_id = auth.uid() and company_id = cid);
$$;
create or replace function public.is_admin_co(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.role_in_company(cid) = 'admin';
$$;
grant execute on function public.my_company_ids(), public.role_in_company(uuid),
  public.is_member(uuid), public.is_admin_co(uuid) to authenticated;

-- self-serve onboarding: a new signup creates their first company + becomes admin
create or replace function public.create_company_for_me(p_name text, p_currency text default 'USD', p_country text default 'Lebanon')
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); cid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.companies(name, base_currency, country, created_by)
    values (coalesce(nullif(btrim(p_name),''),'My Company'), coalesce(nullif(p_currency,''),'USD'), coalesce(p_country,'Lebanon'), uid)
    returning id into cid;
  insert into public.company_members(user_id, company_id, role) values (uid, cid, 'admin')
    on conflict (user_id, company_id) do update set role = 'admin';
  update public.profiles set active_company_id = cid where id = uid;
  return cid;
end; $$;
revoke all on function public.create_company_for_me(text,text,text) from public;
grant execute on function public.create_company_for_me(text,text,text) to authenticated;

-- ---- 4. ROW LEVEL SECURITY ------------------------------------------------
alter table public.companies       enable row level security;
alter table public.profiles        enable row level security;
alter table public.company_members enable row level security;
do $$ declare t text;
begin
  foreach t in array array['clients','services','projects','quotes','quote_lines',
      'invoices','invoice_lines','payments','timesheets','expenses'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_read  on public.%I;', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    -- any member of the owning company can read; admins can write
    execute format($f$create policy %I_read on public.%I for select
        using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_write on public.%I for all
        using (public.is_admin_co(company_id)) with check (public.is_admin_co(company_id));$f$, t, t);
  end loop;
end $$;

-- companies: a member sees their own companies; an admin can edit
drop policy if exists co_read on public.companies;
create policy co_read on public.companies for select using (id in (select public.my_company_ids()));
drop policy if exists co_write on public.companies;
create policy co_write on public.companies for all using (public.is_admin_co(id)) with check (public.is_admin_co(id));

-- profiles: you read/update your own
drop policy if exists prof_self on public.profiles;
create policy prof_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- company_members: you read rows for companies you belong to; admins manage
drop policy if exists mem_read on public.company_members;
create policy mem_read on public.company_members for select
  using (user_id = auth.uid() or public.is_admin_co(company_id));
drop policy if exists mem_write on public.company_members;
create policy mem_write on public.company_members for all
  using (public.is_admin_co(company_id)) with check (public.is_admin_co(company_id));

-- ============================================================================
--  DONE. Next: sign up, call rpc('create_company_for_me', { p_name:'Space Work S.A.R.L' }),
--  then import your Odoo CSVs (clients, projects, invoices) from ODOO_EXPORT/.
-- ============================================================================
