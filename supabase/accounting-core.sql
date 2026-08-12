-- ============================================================================
--  Spacework ERP  -  ACCOUNTING CORE
--  Full double-entry + multi-company + multi-currency, built for complex ops.
--  Postgres / Supabase. Multi-tenant with Row-Level Security from day one.
--
--  DESIGN DECISIONS (the important ones):
--   * An ORG is the SaaS tenant (the customer account) and the RLS boundary.
--     An org owns one or more COMPANIES (legal entities). Consolidation happens
--     across companies inside an org.
--   * Double-entry: a journal ENTRY has many LINES; posting is blocked unless
--     debits = credits (in the company's own currency).
--   * Multi-currency the correct way: every line stores debit/credit in the
--     COMPANY's functional currency (the ledger is always mono-currency per
--     company), PLUS amount_currency + currency_id preserving the original
--     transaction amount. FX gains/losses post as normal entries to dedicated
--     accounts. Consolidation translates each company into the group currency.
--   * Consolidation "that actually ties out": intercompany lines are tagged, and
--     eliminations/translations are stored as auditable consolidation_adjustments
--     so the group report reconciles and is explainable.
-- ============================================================================
create extension if not exists pgcrypto;

-- ============================================================================
--  1. TENANCY  (org = tenant/customer, company = legal entity)
-- ============================================================================
create table if not exists public.orgs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  ref_currency  text not null default 'USD',   -- currency all FX rates are quoted against
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text default '',
  active_org_id     uuid references public.orgs(id) on delete set null,
  active_company_id uuid,
  created_at  timestamptz default now()
);

create table if not exists public.org_members (
  user_id   uuid references auth.users(id) on delete cascade,
  org_id    uuid references public.orgs(id)  on delete cascade,
  role      text not null default 'member',   -- owner | admin | accountant | member | viewer
  created_at timestamptz default now(),
  primary key (user_id, org_id)
);

create table if not exists public.companies (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  name            text not null,
  legal_name      text default '',
  currency_code   text not null default 'USD',       -- functional (ledger) currency
  country         text default '',
  tax_id          text default '',
  parent_company_id uuid references public.companies(id) on delete set null,  -- ownership tree
  ownership_pct   numeric(7,4) default 100,
  fy_start_month  int not null default 1,            -- fiscal year start month (1-12)
  period_lock_date date,                             -- hard lock: no posting on/before
  -- system accounts (set after chart is created)
  retained_earnings_account_id uuid,
  current_earnings_account_id  uuid,
  fx_gain_account_id           uuid,
  fx_loss_account_id           uuid,
  rounding        numeric(12,6) not null default 0.01,
  is_active       boolean default true,
  created_at      timestamptz default now()
);
create index if not exists idx_companies_org on public.companies(org_id);

-- optional finer-grained access; absence = org role governs
create table if not exists public.user_company_access (
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  role text not null default 'member',
  primary key (user_id, company_id)
);

-- ============================================================================
--  2. CURRENCIES + RATES  (per org; rates quoted vs org.ref_currency)
-- ============================================================================
create table if not exists public.currencies (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.orgs(id) on delete cascade,
  code      text not null,                 -- ISO 4217, e.g. USD, EUR, LBP
  name      text default '',
  symbol    text default '',
  decimals  int not null default 2,
  is_active boolean default true,
  unique (org_id, code)
);

-- rate = value of 1 unit of `code` expressed in org.ref_currency.
-- convert A->B:  amount_B = amount_A * rate(A) / rate(B)
-- rate_type lets consolidation pick closing vs average vs spot.
create table if not exists public.currency_rates (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  code       text not null,
  rate_date  date not null,
  rate       numeric(20,10) not null,
  rate_type  text not null default 'spot', -- spot | average | closing
  unique (org_id, code, rate_date, rate_type)
);
create index if not exists idx_rates_lookup on public.currency_rates(org_id, code, rate_type, rate_date desc);

-- ============================================================================
--  3. PARTNERS  (customers / vendors; shared across companies in an org)
-- ============================================================================
create table if not exists public.partners (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.orgs(id) on delete cascade,
  name      text not null,
  is_company boolean default true,
  is_customer boolean default false,
  is_vendor  boolean default false,
  email text default '', phone text default '', vat text default '',
  street text default '', city text default '', country text default '',
  -- a partner may itself be one of our companies (for intercompany)
  linked_company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_partners_org on public.partners(org_id);

-- ============================================================================
--  4. CHART OF ACCOUNTS
--  account_types = global standard classification (drives BS vs P&L, etc.)
-- ============================================================================
create table if not exists public.account_types (
  code           text primary key,          -- e.g. asset_receivable
  name           text not null,
  internal_group text not null,             -- asset|liability|equity|income|expense|off
  is_bs          boolean not null,          -- balance sheet (true) vs P&L (false)
  reconcilable   boolean default false,     -- receivable/payable
  is_bank_cash   boolean default false
);

create table if not exists public.accounts (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  code          text not null,
  name          text not null,
  type_code     text not null references public.account_types(code),
  currency_code text,                        -- non-null = foreign-currency account (e.g. a USD bank in an EUR company)
  reconcilable  boolean default false,
  is_intercompany boolean default false,     -- flag IC accounts for consolidation elimination
  parent_account_id uuid references public.accounts(id) on delete set null,
  consol_account_id uuid,                    -- maps to a group/consolidation account
  is_active     boolean default true,
  created_at    timestamptz default now(),
  unique (company_id, code)
);
create index if not exists idx_accounts_company on public.accounts(company_id);

-- the GROUP chart used for consolidated reporting
create table if not exists public.consolidation_accounts (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references public.orgs(id) on delete cascade,
  code      text not null,
  name      text not null,
  type_code text not null references public.account_types(code),
  unique (org_id, code)
);

-- ============================================================================
--  5. FISCAL YEARS + PERIODS  (per company; periods can be locked)
-- ============================================================================
create table if not exists public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, date_start date not null, date_end date not null,
  state text not null default 'open'         -- open | closed
);
create table if not exists public.fiscal_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  fiscal_year_id uuid references public.fiscal_years(id) on delete cascade,
  name text not null, date_start date not null, date_end date not null,
  state text not null default 'open'         -- open | closed | locked
);
create index if not exists idx_periods_company on public.fiscal_periods(company_id, date_start);

-- ============================================================================
--  6. JOURNALS  (+ document numbering)
-- ============================================================================
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null, name text not null,
  type text not null,                        -- sale|purchase|cash|bank|general|misc
  default_account_id uuid references public.accounts(id) on delete set null,
  currency_code text,                        -- restrict journal to one currency (e.g. a USD bank journal)
  seq_prefix text default '', seq_next bigint default 1,
  unique (company_id, code)
);

-- ============================================================================
--  7. JOURNAL ENTRIES + LINES  (double-entry, multi-currency)
-- ============================================================================
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  journal_id uuid not null references public.journals(id) on delete restrict,
  entry_number text,
  date date not null default current_date,
  ref text default '', narration text default '',
  currency_code text,                        -- document currency (e.g. the invoice currency)
  state text not null default 'draft',       -- draft | posted | cancelled
  is_intercompany boolean default false,
  counterparty_company_id uuid references public.companies(id) on delete set null,
  source_type text default '', source_id text default '',   -- e.g. 'invoice', <uuid>
  posted_at timestamptz, created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_entries_company on public.journal_entries(company_id, date);

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,  -- denormalized for RLS + reporting
  account_id uuid not null references public.accounts(id) on delete restrict,
  partner_id uuid references public.partners(id) on delete set null,
  label text default '',
  -- LEDGER amounts, always in the COMPANY functional currency:
  debit  numeric(20,4) not null default 0,
  credit numeric(20,4) not null default 0,
  -- ORIGINAL transaction amount (foreign currency), signed (+debit / -credit):
  amount_currency numeric(20,4) not null default 0,
  currency_code   text,                      -- null = same as company currency
  -- management / cost accounting dimensions (flexible):
  analytic_distribution jsonb default '{}'::jsonb,   -- { "<analytic_account_id>": percent }
  tax_id uuid,
  date_maturity date,                        -- for receivables/payables aging
  reconciled boolean default false,
  full_reconcile_id uuid,
  quantity numeric(20,4),
  created_at timestamptz default now(),
  constraint one_side check (debit >= 0 and credit >= 0 and not (debit > 0 and credit > 0))
);
create index if not exists idx_lines_company on public.journal_lines(company_id);
create index if not exists idx_lines_account on public.journal_lines(account_id);
create index if not exists idx_lines_entry   on public.journal_lines(entry_id);
create index if not exists idx_lines_partner on public.journal_lines(partner_id) where partner_id is not null;

-- ============================================================================
--  8. TAXES
-- ============================================================================
create table if not exists public.taxes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  scope text not null default 'sale',        -- sale | purchase
  amount_type text not null default 'percent', -- percent | fixed
  amount numeric(12,4) not null default 0,
  account_id uuid references public.accounts(id) on delete set null,   -- tax collected/paid account
  is_active boolean default true
);

-- ============================================================================
--  9. ANALYTIC (cost / management accounting dimensions)
-- ============================================================================
create table if not exists public.analytic_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text default '', name text not null, plan text default 'default',
  is_active boolean default true
);

-- ============================================================================
--  10. RECONCILIATION  (partial matching of debit vs credit lines)
--  Enables correct partial payments and realized FX on settlement.
-- ============================================================================
create table if not exists public.partial_reconciles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  debit_line_id  uuid not null references public.journal_lines(id) on delete cascade,
  credit_line_id uuid not null references public.journal_lines(id) on delete cascade,
  amount           numeric(20,4) not null,   -- in company currency
  amount_currency  numeric(20,4) default 0,  -- in the matched transaction currency
  created_at timestamptz default now()
);
create index if not exists idx_partial_debit  on public.partial_reconciles(debit_line_id);
create index if not exists idx_partial_credit on public.partial_reconciles(credit_line_id);

-- ============================================================================
--  11. PAYMENTS  (each posts a journal entry, reconciled to invoice lines)
-- ============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  journal_id uuid references public.journals(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  entry_id uuid references public.journal_entries(id) on delete set null,
  payment_type text not null default 'inbound',  -- inbound | outbound
  date date not null default current_date,
  amount numeric(20,4) not null default 0,       -- in currency_code
  currency_code text,
  amount_company numeric(20,4) not null default 0, -- converted to company currency
  memo text default '', reference text default '',
  state text not null default 'draft'            -- draft | posted | reconciled
);

-- ============================================================================
--  12. CONSOLIDATION  (group reporting that reconciles + is auditable)
-- ============================================================================
create table if not exists public.consolidation_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  currency_code text not null default 'USD'      -- group reporting currency
);
create table if not exists public.consolidation_group_companies (
  group_id uuid references public.consolidation_groups(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  method text not null default 'full',           -- full | proportional | equity
  ownership_pct numeric(7,4) default 100,
  primary key (group_id, company_id)
);
create table if not exists public.consolidation_runs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.consolidation_groups(id) on delete cascade,
  as_of date not null, label text default '', state text default 'draft'
);
-- stored eliminations / translations / minority / manual adjustments = the audit trail
create table if not exists public.consolidation_adjustments (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.consolidation_runs(id) on delete cascade,
  consol_account_id uuid references public.consolidation_accounts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  kind text not null default 'elimination',      -- elimination | translation | minority | manual
  description text default '',
  amount numeric(20,4) not null default 0        -- in group currency
);

-- ============================================================================
--  13. HELPERS
-- ============================================================================
-- convert an amount between two currencies of an org, on a date, using rate_type
create or replace function public.fx_convert(p_org uuid, p_amount numeric, p_from text, p_to text, p_date date, p_type text default 'spot')
returns numeric language plpgsql stable security definer set search_path=public as $$
declare rf numeric; rt numeric; ref text;
begin
  if p_from = p_to or p_amount = 0 then return p_amount; end if;
  select ref_currency into ref from public.orgs where id = p_org;
  rf := case when p_from = ref then 1 else (select rate from public.currency_rates
           where org_id=p_org and code=p_from and rate_type=p_type and rate_date<=p_date
           order by rate_date desc limit 1) end;
  rt := case when p_to = ref then 1 else (select rate from public.currency_rates
           where org_id=p_org and code=p_to and rate_type=p_type and rate_date<=p_date
           order by rate_date desc limit 1) end;
  if rf is null or rt is null then raise exception 'missing % rate for % or % on %', p_type, p_from, p_to, p_date; end if;
  return round(p_amount * rf / rt, 6);
end; $$;

-- POST an entry: enforces balance + period lock + access. This is the gate.
create or replace function public.post_entry(p_entry uuid)
returns void language plpgsql security definer set search_path=public as $$
declare e record; d numeric; c numeric; n int; lk date;
begin
  select * into e from public.journal_entries where id = p_entry;
  if e is null then raise exception 'entry not found'; end if;
  if not public.can_write_company(e.company_id) then raise exception 'not allowed'; end if;
  if e.state <> 'draft' then raise exception 'entry is not draft'; end if;
  select coalesce(sum(debit),0), coalesce(sum(credit),0), count(*) into d,c,n
    from public.journal_lines where entry_id = p_entry;
  if n < 2 then raise exception 'an entry needs at least two lines'; end if;
  if abs(d - c) > 0.005 then raise exception 'entry not balanced: debit % <> credit %', d, c; end if;
  select period_lock_date into lk from public.companies where id = e.company_id;
  if lk is not null and e.date <= lk then raise exception 'period is locked on %', lk; end if;
  update public.journal_entries set state='posted', posted_at=now() where id = p_entry;
end; $$;

-- trial balance for one company (posted lines up to a date), in company currency
create or replace function public.trial_balance(p_company uuid, p_date date default current_date)
returns table(code text, name text, type_code text, debit numeric, credit numeric, balance numeric)
language sql stable security definer set search_path=public as $$
  select a.code, a.name, a.type_code,
         coalesce(sum(l.debit),0), coalesce(sum(l.credit),0),
         coalesce(sum(l.debit),0) - coalesce(sum(l.credit),0)
  from public.accounts a
  left join public.journal_lines l on l.account_id = a.id
       and l.company_id = p_company
       and exists (select 1 from public.journal_entries e where e.id=l.entry_id and e.state='posted' and e.date<=p_date)
  where a.company_id = p_company
  group by a.code, a.name, a.type_code
  order by a.code;
$$;

-- guard: block edits to a posted entry's lines (must unpost first)
create or replace function public.guard_posted_line()
returns trigger language plpgsql security definer set search_path=public as $$
declare st text; eid uuid;
begin
  eid := coalesce(new.entry_id, old.entry_id);
  select state into st from public.journal_entries where id = eid;
  if st = 'posted' then raise exception 'cannot modify a posted entry (unpost first)'; end if;
  return coalesce(new, old);
end; $$;
drop trigger if exists trg_guard_line on public.journal_lines;
create trigger trg_guard_line before insert or update or delete on public.journal_lines
  for each row execute procedure public.guard_posted_line();

-- ============================================================================
--  14. ROW LEVEL SECURITY
-- ============================================================================
create or replace function public.my_orgs()
returns setof uuid language sql stable security definer set search_path=public as $$
  select org_id from public.org_members where user_id = auth.uid();
$$;
create or replace function public.my_company_ids()
returns setof uuid language sql stable security definer set search_path=public as $$
  select id from public.companies where org_id in (select org_id from public.org_members where user_id = auth.uid());
$$;
create or replace function public.is_org_admin(oid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.org_members where org_id=oid and user_id=auth.uid() and role in ('owner','admin','accountant'));
$$;
create or replace function public.can_write_company(cid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.companies c join public.org_members m on m.org_id=c.org_id
                 where c.id=cid and m.user_id=auth.uid() and m.role in ('owner','admin','accountant'));
$$;
grant execute on function public.my_orgs(), public.my_company_ids(), public.is_org_admin(uuid),
  public.can_write_company(uuid), public.fx_convert(uuid,numeric,text,text,date,text),
  public.post_entry(uuid), public.trial_balance(uuid,date) to authenticated;

-- self-serve: a new signup creates their org (tenant) + first company, becomes owner
create or replace function public.create_org_for_me(p_org text, p_company text, p_currency text default 'USD')
returns uuid language plpgsql security definer set search_path=public as $$
declare uid uuid := auth.uid(); oid uuid; cid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.orgs(name, ref_currency, created_by) values (coalesce(nullif(btrim(p_org),''),'My Group'), coalesce(nullif(p_currency,''),'USD'), uid) returning id into oid;
  insert into public.org_members(user_id, org_id, role) values (uid, oid, 'owner');
  insert into public.companies(org_id, name, currency_code) values (oid, coalesce(nullif(btrim(p_company),''),'My Company'), coalesce(nullif(p_currency,''),'USD')) returning id into cid;
  insert into public.currencies(org_id, code, name, decimals) values (oid, coalesce(nullif(p_currency,''),'USD'), 'Currency', 2) on conflict do nothing;
  update public.profiles set active_org_id=oid, active_company_id=cid where id=uid;
  return oid;
end; $$;
revoke all on function public.create_org_for_me(text,text,text) from public;
grant execute on function public.create_org_for_me(text,text,text) to authenticated;

alter table public.orgs        enable row level security;
alter table public.profiles    enable row level security;
alter table public.org_members enable row level security;
alter table public.companies   enable row level security;
alter table public.account_types enable row level security;
alter table public.user_company_access enable row level security;

drop policy if exists org_read  on public.orgs;
create policy org_read  on public.orgs for select using (id in (select public.my_orgs()));
drop policy if exists org_write on public.orgs;
create policy org_write on public.orgs for all using (public.is_org_admin(id)) with check (public.is_org_admin(id));

drop policy if exists prof_self on public.profiles;
create policy prof_self on public.profiles for all using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists mem_read on public.org_members;
create policy mem_read on public.org_members for select using (user_id=auth.uid() or public.is_org_admin(org_id));
drop policy if exists mem_write on public.org_members;
create policy mem_write on public.org_members for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

drop policy if exists co_read on public.companies;
create policy co_read on public.companies for select using (org_id in (select public.my_orgs()));
drop policy if exists co_write on public.companies;
create policy co_write on public.companies for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

drop policy if exists uca_self on public.user_company_access;
create policy uca_self on public.user_company_access for all
  using (user_id=auth.uid() or public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- account_types = shared read-only reference
drop policy if exists at_read on public.account_types;
create policy at_read on public.account_types for select using (auth.uid() is not null);

-- ORG-scoped tables: read if member, write if org admin/accountant
do $$ declare t text;
begin
  foreach t in array array['currencies','currency_rates','partners','analytic_accounts',
      'consolidation_accounts','consolidation_groups'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (org_id in (select public.my_orgs()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));$f$, t, t);
  end loop;
end $$;

-- COMPANY-scoped tables: read if company in my orgs, write if company writer
do $$ declare t text;
begin
  foreach t in array array['accounts','fiscal_years','fiscal_periods','journals',
      'journal_entries','journal_lines','taxes','partial_reconciles','payments'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $$;

-- consolidation child tables: scope via their group's org
alter table public.consolidation_group_companies enable row level security;
alter table public.consolidation_runs enable row level security;
alter table public.consolidation_adjustments enable row level security;
drop policy if exists cgc_rw on public.consolidation_group_companies;
create policy cgc_rw on public.consolidation_group_companies for all
  using (group_id in (select id from public.consolidation_groups where org_id in (select public.my_orgs())));
drop policy if exists crun_rw on public.consolidation_runs;
create policy crun_rw on public.consolidation_runs for all
  using (group_id in (select id from public.consolidation_groups where org_id in (select public.my_orgs())));
drop policy if exists cadj_rw on public.consolidation_adjustments;
create policy cadj_rw on public.consolidation_adjustments for all
  using (run_id in (select r.id from public.consolidation_runs r join public.consolidation_groups g on g.id=r.group_id where g.org_id in (select public.my_orgs())));

-- ============================================================================
--  15. SEED  -  standard account types (drive Balance Sheet vs P&L + reporting)
-- ============================================================================
insert into public.account_types(code,name,internal_group,is_bs,reconcilable,is_bank_cash) values
  ('asset_receivable','Receivable','asset',true,true,false),
  ('asset_cash','Bank and Cash','asset',true,false,true),
  ('asset_current','Current Assets','asset',true,false,false),
  ('asset_prepayments','Prepayments','asset',true,false,false),
  ('asset_fixed','Fixed Assets','asset',true,false,false),
  ('asset_non_current','Non-current Assets','asset',true,false,false),
  ('liability_payable','Payable','liability',true,true,false),
  ('liability_current','Current Liabilities','liability',true,false,false),
  ('liability_non_current','Non-current Liabilities','liability',true,false,false),
  ('liability_tax','Tax Payable','liability',true,false,false),
  ('equity','Equity','equity',true,false,false),
  ('equity_unaffected','Current Year Earnings','equity',true,false,false),
  ('equity_cta','Cumulative Translation Adjustment','equity',true,false,false),
  ('income','Income','income',false,false,false),
  ('income_other','Other Income','income',false,false,false),
  ('expense','Expenses','expense',false,false,false),
  ('expense_cogs','Cost of Revenue','expense',false,false,false),
  ('expense_depreciation','Depreciation','expense',false,false,false),
  ('off_balance','Off-Balance Sheet','off',false,false,false)
on conflict (code) do nothing;

-- ============================================================================
--  DONE (accounting core). NEXT layers to build on top of this foundation:
--   * chart-of-accounts template + one-click company setup (seed accounts/journals)
--   * invoices/bills that generate balanced entries + tax lines
--   * reconciliation UI + realized FX on settlement (uses partial_reconciles)
--   * FX revaluation run (unrealized) posting to fx_gain/fx_loss accounts
--   * consolidated_trial_balance(group, date): translate each company to group
--     currency (closing rate for BS, average for P&L), map local->consol accounts,
--     apply consolidation_adjustments (intercompany eliminations + CTA + minority)
-- ============================================================================
