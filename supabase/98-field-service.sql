-- ============================================================================
-- 98-field-service.sql  -  Field Service / Service Center (Dolphin-gap #2).
-- Tickets -> diagnosis -> job lines (labor + parts) -> warranty check -> billable.
-- Reuses contacts (customer), products (parts), plant_equipment (serviced unit),
-- and the auth.users technicians. Company-scoped RLS via the existing helpers.
-- Safe to re-run.
-- ============================================================================

-- Warranty register: coverage for a customer's item/serial.
create table if not exists public.service_warranties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,   -- customer
  product_id uuid references public.products(id) on delete set null,
  serial_no text,
  wtype text default 'company',      -- company | manufacturer | sla | extended
  covers text default 'both',        -- labor | parts | both
  start_date date default current_date,
  end_date date,
  reference text,
  notes text default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_service_warranties on public.service_warranties(company_id, serial_no);

-- The ticket: one customer request / repair / maintenance job.
create table if not exists public.service_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '',
  partner_id uuid references public.partners(id) on delete set null,      -- customer
  contact text,
  product_id uuid references public.products(id) on delete set null,      -- item serviced
  serial_no text,
  equipment_id uuid references public.plant_equipment(id) on delete set null,
  warranty_id uuid references public.service_warranties(id) on delete set null,
  title text not null default 'Service ticket',
  problem text default '',
  diagnosis text default '',
  priority text default 'normal',    -- low | normal | high | urgent
  status text default 'new',         -- new | assigned | in_progress | on_hold | done | closed | cancelled
  channel text default 'internal',   -- internal | phone | portal | email
  assigned_to uuid references auth.users(id) on delete set null,          -- technician
  scheduled_at timestamptz,
  sla_due timestamptz,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  location text default '',           -- site | workshop | store
  invoice_id uuid references public.invoices(id) on delete set null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists idx_service_tickets on public.service_tickets(company_id, status, priority);
create index if not exists idx_service_tickets_tech on public.service_tickets(company_id, assigned_to, scheduled_at);

-- Ticket lines: labor time and parts used (parts optionally draw from stock later).
create table if not exists public.service_ticket_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null references public.service_tickets(id) on delete cascade,
  kind text default 'part',          -- part | labor | expense
  product_id uuid references public.products(id) on delete set null,
  description text default '',
  qty numeric(20,4) default 1,
  hours numeric(20,4) default 0,
  unit_price numeric(20,4) default 0,
  unit_cost numeric(20,4) default 0,
  covered boolean default false,     -- covered by warranty (not billed)
  seq int default 10
);
create index if not exists idx_service_ticket_lines on public.service_ticket_lines(company_id, ticket_id, seq);

alter table public.service_warranties   enable row level security;
alter table public.service_tickets      enable row level security;
alter table public.service_ticket_lines enable row level security;

drop policy if exists service_warranties_rw on public.service_warranties;
create policy service_warranties_rw on public.service_warranties
  using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));

drop policy if exists service_tickets_rw on public.service_tickets;
create policy service_tickets_rw on public.service_tickets
  using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));

drop policy if exists service_ticket_lines_rw on public.service_ticket_lines;
create policy service_ticket_lines_rw on public.service_ticket_lines
  using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
