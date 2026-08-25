-- ============================================================================
--  Orbit ERP  -  RECURRING / SUBSCRIPTION INVOICES (feature #8)
--  A recurring template generates a customer invoice every interval (weekly /
--  monthly / quarterly / yearly). Each generation creates a real invoice from
--  the template lines and advances next_date. Company-scoped RLS.
--  (Online card collection is a separate gateway integration, not included here.)
-- ============================================================================

create table if not exists public.recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  name text default '',
  currency_code text default '',
  interval_unit text default 'month',    -- week | month | quarter | year
  interval_count int default 1,
  start_date date default current_date,
  next_date date default current_date,
  end_date date,
  auto_post boolean default false,       -- generate as draft (false) or post immediately (true)
  active boolean default true,
  payment_days int default 30,
  last_invoice_at date,
  created_at timestamptz default now()
);
create index if not exists idx_recurring_invoices on public.recurring_invoices(company_id, active, next_date);

create table if not exists public.recurring_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recurring_id uuid not null references public.recurring_invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text default '',
  quantity numeric(20,4) default 1,
  unit_price numeric(20,4) default 0,
  tax_id uuid references public.taxes(id) on delete set null,
  sequence int default 10
);

alter table public.recurring_invoices enable row level security;
drop policy if exists recinv_r on public.recurring_invoices;
create policy recinv_r on public.recurring_invoices for select using (company_id in (select public.my_company_ids()));
drop policy if exists recinv_w on public.recurring_invoices;
create policy recinv_w on public.recurring_invoices for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.recurring_invoice_lines enable row level security;
drop policy if exists recinvl_r on public.recurring_invoice_lines;
create policy recinvl_r on public.recurring_invoice_lines for select using (company_id in (select public.my_company_ids()));
drop policy if exists recinvl_w on public.recurring_invoice_lines;
create policy recinvl_w on public.recurring_invoice_lines for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'recurring invoices ready' as done;
