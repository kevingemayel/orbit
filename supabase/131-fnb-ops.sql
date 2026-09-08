-- ============================================================================
-- 131-fnb-ops.sql  -  F&B spec Section 2 (POS operations, loss prevention)
--                     and Section 9 (operations, quality, HACCP, compliance).
--
-- Orbit already has pos_orders/_lines/_payments/_sessions, cash_accounts and
-- cash_counts. This adds what a food service floor needs on top: order types and
-- table service, kitchen routing, reason-coded voids and discounts (which is
-- what makes loss prevention possible), tips, and the whole compliance side.
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 2: order capture
-- ---------------------------------------------------------------------------
alter table public.pos_orders add column if not exists order_type text not null default 'counter';
  -- counter | dine_in | takeaway | drive_thru | curbside | delivery | scheduled | catering | wholesale
alter table public.pos_orders add column if not exists table_id uuid;
alter table public.pos_orders add column if not exists guest_name text;
alter table public.pos_orders add column if not exists guest_count int;
alter table public.pos_orders add column if not exists pager_number text;
alter table public.pos_orders add column if not exists allergy_note text;
alter table public.pos_orders add column if not exists scheduled_for timestamptz;
alter table public.pos_orders add column if not exists parked boolean not null default false;
alter table public.pos_orders add column if not exists tip_amount numeric not null default 0;
alter table public.pos_orders add column if not exists service_charge numeric not null default 0;

-- The customer's modifier choices, kept per line so cost and stock can follow.
alter table public.pos_order_lines add column if not exists modifier_ids uuid[] not null default '{}';
alter table public.pos_order_lines add column if not exists modifier_note text;
alter table public.pos_order_lines add column if not exists station text;
alter table public.pos_order_lines add column if not exists course int;
alter table public.pos_order_lines add column if not exists kds_status text not null default 'new';   -- new | fired | ready | bumped
alter table public.pos_order_lines add column if not exists fired_at timestamptz;
alter table public.pos_order_lines add column if not exists ready_at timestamptz;
alter table public.pos_order_lines add column if not exists bumped_at timestamptz;

create table if not exists public.store_tables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  name text not null,
  zone text,
  seats int,
  status text not null default 'free',      -- free | seated | ordered | bill | dirty
  current_order_id uuid,
  sort int not null default 10,
  is_active boolean not null default true
);
create index if not exists idx_tables_store on public.store_tables (company_id, store_id, is_active);

-- ---------------------------------------------------------------------------
-- SECTION 2: loss prevention. Reason codes on every value-destroying action are
-- the whole mechanism; without them an exception report has nothing to rank.
-- ---------------------------------------------------------------------------
create table if not exists public.pos_reason_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind text not null,            -- void | discount | refund | comp | no_sale | price_override
  code text not null,
  name text not null,
  requires_manager boolean not null default true,
  is_active boolean not null default true,
  sort int not null default 10,
  unique (company_id, kind, code)
);

create table if not exists public.pos_exceptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  session_id uuid,
  order_id uuid,
  line_id uuid,
  kind text not null,             -- void | discount | refund | comp | no_sale | price_override | line_deleted
  reason_id uuid references public.pos_reason_codes(id) on delete set null,
  amount numeric not null default 0,
  qty numeric,
  cashier text,
  approved_by text,
  occurred_at timestamptz not null default now(),
  -- for tying a suspicious transaction back to the camera
  device_id text,
  note text
);
create index if not exists idx_posex on public.pos_exceptions (company_id, store_id, occurred_at desc);
create index if not exists idx_posex_cashier on public.pos_exceptions (company_id, cashier, kind);

alter table public.pos_sessions add column if not exists opening_float numeric;
alter table public.pos_sessions add column if not exists declared_cash numeric;
alter table public.pos_sessions add column if not exists expected_cash numeric;
alter table public.pos_sessions add column if not exists variance numeric;
alter table public.pos_sessions add column if not exists is_blind_close boolean not null default true;
alter table public.pos_sessions add column if not exists device_id text;
alter table public.pos_sessions add column if not exists cashier text;

create table if not exists public.cash_drops (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  session_id uuid,
  amount numeric not null,
  dropped_by text,
  witnessed_by text,
  dropped_at timestamptz not null default now(),
  note text
);

create table if not exists public.tip_pools (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  period_start date not null,
  period_end date not null,
  card_tips numeric not null default 0,
  cash_tips_declared numeric not null default 0,
  service_charge numeric not null default 0,
  method text not null default 'hours',    -- hours | equal | points | role_weighted
  status text not null default 'draft',    -- draft | approved | paid
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.tip_allocations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  pool_id uuid not null references public.tip_pools(id) on delete cascade,
  employee_id uuid references public.hr_employees(id) on delete set null,
  hours numeric, points numeric,
  amount numeric not null default 0
);

-- ---------------------------------------------------------------------------
-- SECTION 9: checklists, HACCP, equipment, audits
-- ---------------------------------------------------------------------------
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  kind text not null default 'opening',   -- opening | closing | hourly | handover | cleaning | haccp | audit
  frequency text,                          -- daily | weekly | per_shift | monthly
  applies_to_store_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  text text not null,
  section text,
  input_type text not null default 'check',   -- check | temperature | number | text | photo
  requires_photo boolean not null default false,
  min_value numeric, max_value numeric,       -- the safe range, for a temperature
  weight numeric not null default 1,          -- for scored audits
  is_critical boolean not null default false,
  sort int not null default 10
);
create table if not exists public.checklist_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  template_id uuid references public.checklist_templates(id) on delete set null,
  run_date date not null default current_date,
  shift text,
  status text not null default 'open',        -- open | complete | failed
  score numeric,
  completed_by text, completed_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_clruns on public.checklist_runs (company_id, store_id, run_date desc);
create table if not exists public.checklist_results (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  run_id uuid not null references public.checklist_runs(id) on delete cascade,
  item_id uuid references public.checklist_template_items(id) on delete set null,
  value_bool boolean, value_num numeric, value_text text,
  photo_media_id uuid,
  -- a reading outside the safe range is a non-conformance and needs an action
  is_breach boolean not null default false,
  corrective_action text,
  action_by text, action_at timestamptz,
  recorded_by text,
  recorded_at timestamptz not null default now()
);
create index if not exists idx_clres on public.checklist_results (run_id);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  code text, name text not null,
  category text,                              -- espresso_machine | grinder | oven | fridge | freezer | ice | pos
  make text, model text, serial_no text,
  supplier_id uuid references public.partners(id) on delete set null,
  purchase_date date, warranty_until date,
  asset_id uuid,
  status text not null default 'active',      -- active | repair | retired
  location_note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_equipment on public.equipment (company_id, store_id, status);

create table if not exists public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  task text not null,                          -- backflush | descale | filter change | service
  frequency_days int,
  last_done date,
  next_due date,
  is_active boolean not null default true
);
create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  equipment_id uuid references public.equipment(id) on delete set null,
  schedule_id uuid references public.maintenance_schedules(id) on delete set null,
  log_date date not null default current_date,
  kind text not null default 'preventive',     -- preventive | repair | breakdown
  done_by text, cost numeric, downtime_hours numeric,
  note text, photo_media_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.store_audits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  template_id uuid references public.checklist_templates(id) on delete set null,
  audit_date date not null default current_date,
  auditor text,
  kind text not null default 'brand_standards',  -- brand_standards | food_safety | mystery_shopper
  score numeric, max_score numeric,
  status text not null default 'draft',          -- draft | issued | actioned | closed
  summary text,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_actions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  audit_id uuid not null references public.store_audits(id) on delete cascade,
  finding text not null,
  severity text not null default 'minor',        -- critical | major | minor
  owner text, due_date date,
  status text not null default 'open',           -- open | in_progress | done | verified
  closed_at timestamptz, note text
);
create index if not exists idx_auditactions on public.audit_actions (company_id, status, due_date);

create table if not exists public.compliance_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  name text not null,
  kind text,                                     -- licence | permit | insurance | lease | certificate
  reference text,
  issued_on date, expires_on date,
  issuer text,
  media_id uuid,
  reminder_days int not null default 30,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_compdocs on public.compliance_documents (company_id, expires_on);

-- Seed the reason codes and a HACCP template every food business needs
insert into public.pos_reason_codes (company_id, kind, code, name, requires_manager, sort)
select c.id, v.kind, v.code, v.name, v.mgr, v.sort from public.companies c
cross join (values
  ('void','wrong_item','Wrong item rung',true,10),
  ('void','customer_changed','Customer changed mind',true,20),
  ('void','quality','Quality issue',true,30),
  ('discount','staff','Staff discount',true,10),
  ('discount','loyalty','Loyalty reward',false,20),
  ('discount','goodwill','Goodwill',true,30),
  ('comp','complaint','Complaint remake',true,10),
  ('refund','wrong_order','Wrong order',true,10),
  ('no_sale','change','Change given',true,10)
) as v(kind,code,name,mgr,sort)
on conflict (company_id, kind, code) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['store_tables','pos_reason_codes','pos_exceptions','cash_drops',
                           'tip_pools','tip_allocations','checklist_templates','checklist_template_items',
                           'checklist_runs','checklist_results','equipment','maintenance_schedules',
                           'maintenance_logs','store_audits','audit_actions','compliance_documents']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('create policy %I on public.%I using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id))', t || '_rw', t);
  end loop;
end $$;
