-- ============================================================================
-- 132-fnb-customer.sql  -  F&B spec Section 3 (customer, loyalty, marketing)
--                          and Section 4 (digital channels & delivery).
--
-- Reuses partners as the customer record and pos_promotions/pos_vouchers where
-- they already fit. What is added is the money-holding side, which has to be
-- accounted for properly:
--
--   a gift card or a topped-up wallet is a LIABILITY, not revenue. Revenue is
--   recognised when the balance is spent. Breakage (expired unspent balance) is
--   recognised separately. Getting this wrong overstates income, so the balance
--   tables carry the account they post to.
--
-- Section 4's centrepiece is aggregator reconciliation: what the platform said
-- it would pay, against what it actually paid, per order, with the difference
-- visible and disputable.
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 3: the customer record
-- ---------------------------------------------------------------------------
alter table public.partners add column if not exists loyalty_card_no text;
alter table public.partners add column if not exists birthday date;
alter table public.partners add column if not exists marketing_opt_in boolean not null default false;
alter table public.partners add column if not exists consent_updated_at timestamptz;
alter table public.partners add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.partners add column if not exists favourite_product_id uuid references public.products(id) on delete set null;
alter table public.partners add column if not exists first_order_at timestamptz;
alter table public.partners add column if not exists last_order_at timestamptz;

create table if not exists public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  kind text not null default 'points',      -- points | stamp | spend_tier | visit_tier
  earn_per_currency numeric,                -- points per 1 spent
  redeem_value numeric,                     -- currency per point
  stamps_required int,                      -- buy 9 get 1 -> 9
  reward_product_id uuid references public.products(id) on delete set null,
  birthday_reward text,
  is_active boolean not null default true,
  starts_on date, ends_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  program_id uuid references public.loyalty_programs(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  points_balance numeric not null default 0,
  stamps_balance int not null default 0,
  tier text,
  lifetime_spend numeric not null default 0,
  visits int not null default 0,
  joined_on date not null default current_date,
  unique (program_id, partner_id)
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid not null references public.loyalty_accounts(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  kind text not null,                       -- earn | redeem | adjust | expire
  points numeric not null default 0,
  stamps int not null default 0,
  order_id uuid,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_loytx on public.loyalty_transactions (account_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Stored value and gift cards. Balance = liability.
-- ---------------------------------------------------------------------------
create table if not exists public.stored_value_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  kind text not null default 'wallet',      -- wallet | gift_card | corporate
  card_number text,
  balance numeric not null default 0,
  currency_code text,
  status text not null default 'active',    -- active | frozen | expired | closed
  issued_on date not null default current_date,
  expires_on date,
  -- the balance-sheet account this liability sits in
  liability_account_id uuid references public.accounts(id) on delete set null,
  breakage_account_id uuid references public.accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, card_number)
);
create table if not exists public.stored_value_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid not null references public.stored_value_accounts(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  kind text not null,                       -- topup | spend | refund | expire | adjust
  amount numeric not null,
  balance_after numeric,
  order_id uuid,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_svtx on public.stored_value_transactions (account_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Subscriptions (the unlimited-coffee pass, the bean box)
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  kind text not null default 'pass',        -- pass | box | corporate
  price numeric not null default 0,
  period text not null default 'monthly',   -- weekly | monthly | quarterly
  included_product_id uuid references public.products(id) on delete set null,
  daily_limit int, period_limit int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  status text not null default 'active',    -- active | paused | cancelled | dunning
  started_on date not null default current_date,
  next_billing_on date,
  cancelled_on date,
  redemptions_this_period int not null default 0,
  note text
);
create table if not exists public.subscription_redemptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  order_id uuid,
  redeemed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Feedback and complaints
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  order_id uuid,
  source text not null default 'receipt',   -- receipt | app | google | aggregator | walk_in
  nps int, rating numeric,
  comment text,
  status text not null default 'new',       -- new | acknowledged | resolved | closed
  category text,
  assigned_to text,
  due_at timestamptz, resolved_at timestamptz,
  compensation_amount numeric, compensation_note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_feedback on public.feedback (company_id, store_id, created_at desc);

-- ---------------------------------------------------------------------------
-- SECTION 4: aggregators and delivery
-- ---------------------------------------------------------------------------
create table if not exists public.aggregator_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  channel_id uuid references public.sales_channels(id) on delete set null,
  platform text not null,                    -- talabat | toters | deliveroo | careem | ubereats
  external_store_id text,
  commission_percent numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- What the platform said each order was worth, as we recorded it
create table if not exists public.aggregator_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid references public.aggregator_accounts(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  external_order_id text,
  order_id uuid,                             -- the matching pos_order
  ordered_at timestamptz,
  gross_amount numeric not null default 0,
  discount_amount numeric not null default 0,
  commission_amount numeric not null default 0,
  expected_net numeric not null default 0,
  status text not null default 'received',   -- received | accepted | prepared | collected | cancelled
  raw jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_aggorders on public.aggregator_orders (company_id, account_id, ordered_at desc);

-- What they actually paid, and the difference. This is the reconciliation the
-- spec calls a top-three pain point.
create table if not exists public.aggregator_payouts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid references public.aggregator_accounts(id) on delete set null,
  reference text,
  period_start date, period_end date,
  statement_gross numeric, statement_commission numeric, statement_other numeric,
  statement_net numeric,
  expected_net numeric,
  variance numeric generated always as (coalesce(statement_net,0) - coalesce(expected_net,0)) stored,
  status text not null default 'draft',      -- draft | matched | disputed | settled
  received_on date,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.aggregator_disputes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payout_id uuid references public.aggregator_payouts(id) on delete cascade,
  aggregator_order_id uuid references public.aggregator_orders(id) on delete set null,
  amount numeric not null default 0,
  reason text,
  status text not null default 'open',       -- open | submitted | accepted | rejected
  raised_on date not null default current_date,
  resolved_on date,
  note text
);

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  fee numeric not null default 0,
  min_order numeric not null default 0,
  max_minutes int,
  polygon jsonb,
  is_active boolean not null default true
);
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  order_id uuid,
  zone_id uuid references public.delivery_zones(id) on delete set null,
  rider_employee_id uuid references public.hr_employees(id) on delete set null,
  status text not null default 'pending',    -- pending | assigned | picked_up | delivered | failed
  address text, phone text,
  fee numeric not null default 0,
  cash_collected numeric,
  settled boolean not null default false,
  assigned_at timestamptz, picked_up_at timestamptz, delivered_at timestamptz,
  proof_media_id uuid,
  note text
);
create index if not exists idx_deliveries on public.deliveries (company_id, store_id, status);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  guest_name text, phone text,
  party_size int not null default 2,
  reserved_for timestamptz not null,
  table_id uuid references public.store_tables(id) on delete set null,
  status text not null default 'booked',     -- booked | seated | no_show | cancelled | waitlist
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reservations on public.reservations (company_id, store_id, reserved_for);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['loyalty_programs','loyalty_accounts','loyalty_transactions',
                           'stored_value_accounts','stored_value_transactions',
                           'subscription_plans','subscriptions','subscription_redemptions','feedback',
                           'aggregator_accounts','aggregator_orders','aggregator_payouts','aggregator_disputes',
                           'delivery_zones','deliveries','reservations']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))', t || '_rw', t);
  end loop;
end $$;
