-- ============================================================================
--  Spacework ERP  -  HRM + PAYROLL  (run AFTER 01-07)
--  Rosters/shifts, attendance-driven OT/UT, configurable salary structures with
--  salary heads (fixed/percent/per_day/per_hour/overtime/undertime/formula),
--  employee contracts, payslip runs -> payslips -> payslip lines, leave
--  allocations. Company-scoped RLS (my_company_ids / can_write_company).
-- ============================================================================

-- richer employee profile ---------------------------------------------------
alter table public.hr_employees add column if not exists work_phone text default '';
alter table public.hr_employees add column if not exists mobile_phone text default '';
alter table public.hr_employees add column if not exists work_location text default '';
alter table public.hr_employees add column if not exists employee_type text default 'employee';   -- employee | worker | contractor | intern
alter table public.hr_employees add column if not exists identification_no text default '';
alter table public.hr_employees add column if not exists bank_account text default '';

-- shifts (roster templates) -------------------------------------------------
create table if not exists public.hr_shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  start_time text default '08:00',           -- HH:MM
  end_time text default '17:00',
  break_minutes int default 60,
  hours numeric(6,2) default 8,              -- paid working hours in the shift
  is_active boolean default true
);

-- roster: a shift assigned to an employee on a date -------------------------
create table if not exists public.hr_roster (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  work_date date not null,
  shift_id uuid references public.hr_shifts(id) on delete set null,
  unique (employee_id, work_date)
);

-- salary structure (a named set of heads) -----------------------------------
create table if not exists public.hr_salary_structures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  is_active boolean default true
);

-- salary heads / rules (components) -----------------------------------------
--  calc_type: fixed | percent | per_day | per_hour | overtime | undertime | formula
--  category : earning | deduction | benefit | total
create table if not exists public.hr_salary_heads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  structure_id uuid references public.hr_salary_structures(id) on delete cascade,
  code text not null,                        -- BASIC, HRA, TRANSPORT, OT, NSSF, TAX ...
  name text not null,
  category text not null default 'earning',
  calc_type text not null default 'fixed',
  amount numeric(20,6) default 0,            -- fixed value, percent (e.g. 25), or multiplier
  base_code text default 'BASIC',            -- code the percent/rate applies to
  formula text default '',                   -- expression for calc_type=formula
  account_id uuid references public.accounts(id) on delete set null,
  sequence int default 10,
  is_active boolean default true
);
create index if not exists idx_heads_struct on public.hr_salary_heads(structure_id, sequence);

-- employee contract ----------------------------------------------------------
create table if not exists public.hr_contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  name text default '',
  structure_id uuid references public.hr_salary_structures(id) on delete set null,
  wage numeric(20,4) default 0,              -- monthly basic
  currency_code text,
  working_days numeric(6,2) default 26,      -- standard paid days / month
  daily_hours numeric(6,2) default 8,
  ot_multiplier numeric(6,2) default 1.25,
  date_start date, date_end date,
  state text default 'draft'                 -- draft | running | expired
);
create index if not exists idx_contracts_emp on public.hr_contracts(company_id, employee_id);

-- payslip run (batch) --------------------------------------------------------
create table if not exists public.hr_payslip_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  date_from date, date_to date,
  state text default 'draft'                 -- draft | done
);

-- payslip --------------------------------------------------------------------
create table if not exists public.hr_payslips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  run_id uuid references public.hr_payslip_runs(id) on delete set null,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  contract_id uuid references public.hr_contracts(id) on delete set null,
  date_from date, date_to date,
  worked_days numeric(8,2) default 0, worked_hours numeric(10,2) default 0,
  ot_hours numeric(10,2) default 0, ut_hours numeric(10,2) default 0, leave_days numeric(8,2) default 0,
  gross numeric(20,4) default 0, total_deductions numeric(20,4) default 0, net numeric(20,4) default 0,
  currency_code text,
  state text default 'draft',                -- draft | confirmed | paid
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_payslips_run on public.hr_payslips(company_id, run_id);

create table if not exists public.hr_payslip_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payslip_id uuid references public.hr_payslips(id) on delete cascade,
  code text, name text, category text default 'earning',
  amount numeric(20,4) default 0, sequence int default 10
);

-- leave allocations (balance per employee / type / year) --------------------
create table if not exists public.hr_leave_allocations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete cascade,
  leave_type text default 'paid',
  year int,
  days numeric(6,2) default 0
);

-- ---------------------------------------------------------------------------
--  RLS  (company-scoped, same helpers as the rest of the app)
-- ---------------------------------------------------------------------------
do $$ declare t text;
begin
  foreach t in array array[
    'hr_shifts','hr_roster','hr_salary_structures','hr_salary_heads','hr_contracts',
    'hr_payslip_runs','hr_payslips','hr_payslip_lines','hr_leave_allocations'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  SEED: a "Standard Staff" structure + common heads for every company that
--  has none yet. Demonstrates every calc_type. Amounts are examples; edit in
--  Payroll > Salary Heads. GROSS/NET are computed totals (category='total').
-- ---------------------------------------------------------------------------
do $$ declare c record; sid uuid;
begin
  for c in select id from public.companies loop
    if not exists (select 1 from public.hr_salary_structures s where s.company_id = c.id) then
      insert into public.hr_salary_structures(company_id, name) values (c.id, 'Standard Staff') returning id into sid;
      insert into public.hr_salary_heads(company_id, structure_id, code, name, category, calc_type, amount, base_code, sequence) values
        (c.id, sid, 'BASIC',     'Basic salary',         'earning',   'per_day', 0,    'BASIC', 10),
        (c.id, sid, 'HRA',       'Housing allowance',    'earning',   'percent', 25,   'BASIC', 20),
        (c.id, sid, 'TRANSPORT', 'Transport allowance',  'earning',   'fixed',   0,    'BASIC', 30),
        (c.id, sid, 'OT',        'Overtime',             'earning',   'overtime',0,    'BASIC', 40),
        (c.id, sid, 'UT',        'Undertime deduction',  'deduction', 'undertime',0,   'BASIC', 50),
        (c.id, sid, 'GROSS',     'Gross salary',         'total',     'formula', 0,    'BASIC', 60),
        (c.id, sid, 'SSF',       'Social security',      'deduction', 'percent', 3,    'BASIC', 70),
        (c.id, sid, 'TAX',       'Income tax',           'deduction', 'formula', 0,    'GROSS', 80),
        (c.id, sid, 'NET',       'Net pay',              'total',     'formula', 0,    'GROSS', 90);
      update public.hr_salary_heads set formula = 'GROSS' where structure_id = sid and code = 'GROSS';
      update public.hr_salary_heads set formula = 'GROSS * 0.05' where structure_id = sid and code = 'TAX';
      update public.hr_salary_heads set formula = 'NET' where structure_id = sid and code = 'NET';
    end if;
  end loop;
end $$;
