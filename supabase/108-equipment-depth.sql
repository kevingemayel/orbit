-- ============================================================================
-- 108-equipment-depth.sql  -  Equipment / Fleet depth (Dolphin gap): a single
-- event log per unit for transfers between sites, meter / working-hours
-- readings, and rental-out / return transactions with billing. The utilization
-- report reads this log. Company-scoped RLS via existing helpers. Safe to re-run.
-- ============================================================================
create table if not exists public.equipment_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  equipment_id uuid not null references public.plant_equipment(id) on delete cascade,
  kind text not null default 'transfer',    -- transfer | meter | rental_out | rental_return | service
  event_date date not null default current_date,
  from_location text,
  to_location text,
  project_id uuid references public.projects(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,   -- customer for a rental
  meter_reading numeric(20,2),
  rate numeric(20,4) default 0,
  days numeric(20,2) default 0,
  amount numeric(20,4) default 0,
  note text default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_equipment_events on public.equipment_events(company_id, equipment_id, event_date);

alter table public.equipment_events enable row level security;
drop policy if exists equipment_events_rw on public.equipment_events;
create policy equipment_events_rw on public.equipment_events using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
