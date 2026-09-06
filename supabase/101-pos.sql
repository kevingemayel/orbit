-- ============================================================================
-- 101-pos.sql  -  Point of Sale (Dolphin-gap #5). Register sessions (shifts),
-- orders, lines and payments. Company-scoped RLS via the existing helpers.
-- Safe to re-run.
-- ============================================================================
create table if not exists public.pos_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  register text default 'Main',
  status text default 'open',                      -- open | closed
  opened_by uuid references auth.users(id) on delete set null,
  opened_at timestamptz not null default now(),
  opening_cash numeric(20,4) default 0,
  closed_at timestamptz, closing_cash numeric(20,4), expected_cash numeric(20,4),
  note text default ''
);
create index if not exists idx_pos_sessions on public.pos_sessions(company_id, status);

create table if not exists public.pos_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  session_id uuid references public.pos_sessions(id) on delete set null,
  number text default '',
  partner_id uuid references public.partners(id) on delete set null,
  subtotal numeric(20,4) default 0, tax numeric(20,4) default 0, total numeric(20,4) default 0,
  status text default 'paid',                       -- paid | refunded | void
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_pos_orders on public.pos_orders(company_id, session_id, created_at);

create table if not exists public.pos_order_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.pos_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text default '', qty numeric(20,4) default 1, unit_price numeric(20,4) default 0,
  tax_rate numeric(20,4) default 0, line_total numeric(20,4) default 0, seq int default 10
);
create index if not exists idx_pos_order_lines on public.pos_order_lines(order_id);

create table if not exists public.pos_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.pos_orders(id) on delete cascade,
  method text default 'cash', amount numeric(20,4) default 0
);

alter table public.pos_sessions   enable row level security;
alter table public.pos_orders      enable row level security;
alter table public.pos_order_lines enable row level security;
alter table public.pos_payments    enable row level security;
drop policy if exists pos_sessions_rw on public.pos_sessions;
create policy pos_sessions_rw on public.pos_sessions using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
drop policy if exists pos_orders_rw on public.pos_orders;
create policy pos_orders_rw on public.pos_orders using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
drop policy if exists pos_order_lines_rw on public.pos_order_lines;
create policy pos_order_lines_rw on public.pos_order_lines using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
drop policy if exists pos_payments_rw on public.pos_payments;
create policy pos_payments_rw on public.pos_payments using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
