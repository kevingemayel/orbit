-- ============================================================================
--  Orbit ERP  -  CASH DESK  ("Counter")
--  The company's cash desk: one controlled point where money comes IN and goes
--  OUT, to or from ANY party (customer, vendor, employee, owner, one-off payee),
--  across cash and bank accounts. Every movement is a numbered, accountable
--  record tied to the right party and account, and posts to the ledger.
--
--    cash_accounts   - a "wallet": a till, a driver pouch, a safe, or a bank,
--                      mapped to a GL cash/bank account.
--    cash_movements  - a receipt (money in) or payment (money out).
--    cash_handovers  - a dual-confirmed cash transfer between two wallets.
--    cash_counts     - an end-of-shift count / close with variance.
--
--  Company-scoped RLS, matching the rest of Orbit.
-- ============================================================================

-- ---- wallets ---------------------------------------------------------------
create table if not exists public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Cash desk',
  kind text default 'cash',                 -- cash | bank
  holder_user uuid,                         -- the person who holds this drawer/pouch (null for a shared safe/bank)
  gl_account_id uuid references public.accounts(id) on delete set null,  -- the chart-of-accounts cash/bank account it posts to
  currency_code text default '',            -- '' = company functional currency
  opening_balance numeric(20,4) default 0,
  is_active boolean default true,
  sort int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_cash_accounts on public.cash_accounts(company_id, is_active, sort);

-- ---- receipts & payments ---------------------------------------------------
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '',
  move_date date default current_date,
  direction text not null default 'out',    -- in | out
  kind text default 'other',                -- client_receipt | supplier_payment | supplier_refund | salary | advance | drawing | capital | expense | service | maintenance | transfer_in | transfer_out | other
  method text default 'cash',               -- cash | bank | cheque | card | transfer
  cash_account_id uuid references public.cash_accounts(id) on delete set null,
  amount numeric(20,4) default 0,
  currency_code text default '',
  party_type text default 'none',           -- customer | vendor | employee | owner | payee | none
  party_id uuid,                            -- -> partners.id / employees.id depending on party_type
  payee_name text default '',               -- for a one-off payee, or a display label
  memo text default '',
  link_type text default 'none',            -- bill | invoice | payslip | none
  link_id uuid,                             -- the settled document, if any
  contra_account_id uuid references public.accounts(id) on delete set null,  -- the non-cash leg for un-invoiced movements (expense, advance, drawing...)
  status text default 'draft',              -- draft | posted | void
  journal_id uuid,                          -- the GL entry created when posted
  handover_id uuid,                         -- set when this movement is one leg of a handover
  created_by uuid default auth.uid(),
  posted_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_cash_movements on public.cash_movements(company_id, move_date, status);
create index if not exists idx_cash_movements_acct on public.cash_movements(company_id, cash_account_id);
create index if not exists idx_cash_movements_party on public.cash_movements(company_id, party_type, party_id);

-- ---- dual-confirmed handovers ---------------------------------------------
create table if not exists public.cash_handovers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '',
  hand_date date default current_date,
  journal_id uuid,
  from_account_id uuid references public.cash_accounts(id) on delete set null,
  to_account_id uuid references public.cash_accounts(id) on delete set null,
  amount numeric(20,4) default 0,
  currency_code text default '',
  purpose text default '',                  -- e.g. supplier run | return | deposit
  status text default 'pending',            -- pending | confirmed | cancelled
  initiated_by uuid default auth.uid(),
  confirmed_by uuid,
  confirmed_at timestamptz,
  note text default '',
  created_at timestamptz default now()
);
create index if not exists idx_cash_handovers on public.cash_handovers(company_id, status, hand_date);

-- ---- end-of-shift count / close -------------------------------------------
create table if not exists public.cash_counts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cash_account_id uuid references public.cash_accounts(id) on delete cascade,
  count_date date default current_date,
  expected_amount numeric(20,4) default 0,
  counted_amount numeric(20,4) default 0,
  variance numeric(20,4) default 0,
  denominations jsonb default '[]'::jsonb,  -- [{denom, qty}]
  status text default 'open',               -- open | closed
  signed_by uuid,
  signed_at timestamptz,
  note text default '',
  created_at timestamptz default now()
);
create index if not exists idx_cash_counts on public.cash_counts(company_id, cash_account_id, count_date);

-- ============================ RLS ==========================================
alter table public.cash_accounts enable row level security;
drop policy if exists cashacc_r on public.cash_accounts;
create policy cashacc_r on public.cash_accounts for select using (company_id in (select public.my_company_ids()));
drop policy if exists cashacc_w on public.cash_accounts;
create policy cashacc_w on public.cash_accounts for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.cash_movements enable row level security;
drop policy if exists cashmov_r on public.cash_movements;
create policy cashmov_r on public.cash_movements for select using (company_id in (select public.my_company_ids()));
drop policy if exists cashmov_w on public.cash_movements;
create policy cashmov_w on public.cash_movements for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.cash_handovers enable row level security;
drop policy if exists cashho_r on public.cash_handovers;
create policy cashho_r on public.cash_handovers for select using (company_id in (select public.my_company_ids()));
drop policy if exists cashho_w on public.cash_handovers;
create policy cashho_w on public.cash_handovers for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.cash_counts enable row level security;
drop policy if exists cashcnt_r on public.cash_counts;
create policy cashcnt_r on public.cash_counts for select using (company_id in (select public.my_company_ids()));
drop policy if exists cashcnt_w on public.cash_counts;
create policy cashcnt_w on public.cash_counts for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- ---- accounts the cash desk needs that the base chart lacks --------------
--  Owner drawings (contra-equity) and Employee advances (asset). Added to every
--  existing company, and to the Lebanon template so new companies get them too.
insert into public.accounts(company_id, code, name, type_code, reconcilable)
select c.id, v.code, v.name, v.type_code, false
from public.companies c
cross join (values
  ('1010','Owner drawings','equity'),
  ('4080','Employee advances','asset_current')
) as v(code, name, type_code)
on conflict (company_id, code) do nothing;

insert into public.coa_template_lines(template_id, code, name, type_code, reconcilable, is_bank_cash, sequence)
select t.id, v.code, v.name, v.type_code, false, false, v.seq
from public.coa_templates t
cross join (values
  ('1010','Owner drawings','equity',15),
  ('4080','Employee advances','asset_current',316)
) as v(code, name, type_code, seq)
where t.country='LB' and t.org_id is null
  and not exists (select 1 from public.coa_template_lines x where x.template_id=t.id and x.code=v.code);

select 'cash desk (Counter) ready' as done;
