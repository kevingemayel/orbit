-- ============================================================================
--  Spacework ERP  -  ACCOUNTING DEPTH  (run AFTER 01-18)
--  Closes partial gaps vs Odoo Accounting:
--   1. Fixed Assets & Depreciation (assets + asset_lines; linear schedule; each
--      posted period books Dr 6800 Depreciation / Cr 2800 Accumulated depreciation)
--   2. Budgets + budget lines (budget vs actual by account, per period)
--   3. Follow-up / dunning levels (drive the Collections screen by days overdue)
--  Company-scoped RLS.
-- ============================================================================

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', name text not null default 'Asset',
  category text default '',
  acquisition_value numeric(20,4) default 0, salvage_value numeric(20,4) default 0,
  acquisition_date date default current_date, start_date date,
  method text default 'linear',                 -- linear (straight line)
  life_months int default 60,                   -- useful life in months
  asset_account text default '2100',            -- balance-sheet asset account code
  depr_account text default '2800',             -- accumulated depreciation (contra-asset)
  expense_account text default '6800',          -- depreciation expense
  state text default 'draft',                   -- draft | running | closed
  notes text default '', created_at timestamptz default now()
);
create index if not exists idx_assets on public.assets(company_id, state);

create table if not exists public.asset_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  seq int default 0, line_date date,
  depreciation numeric(20,4) default 0, cumulative numeric(20,4) default 0, book_value numeric(20,4) default 0,
  posted boolean default false, journal_entry_id uuid references public.journal_entries(id) on delete set null
);
create index if not exists idx_asset_lines on public.asset_lines(company_id, asset_id, seq);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Budget', date_start date, date_end date,
  state text default 'draft', notes text default '', created_at timestamptz default now()
);
create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  budget_id uuid not null references public.budgets(id) on delete cascade,
  account_code text default '', label text default '', planned numeric(20,4) default 0, sequence int default 10
);
create index if not exists idx_budget_lines on public.budget_lines(company_id, budget_id, sequence);

create table if not exists public.followup_levels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Reminder', days int default 15,
  action text default 'email',                  -- email | call | letter | legal
  message text default '', sequence int default 10, created_at timestamptz default now()
);
create index if not exists idx_followup_levels on public.followup_levels(company_id, days);

do $rls$ declare t text;
begin
  foreach t in array array['assets','asset_lines','budgets','budget_lines','followup_levels'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;

select 'assets' t, count(*) n from public.assets
union all select 'budgets', count(*) from public.budgets
union all select 'followup_levels', count(*) from public.followup_levels;
