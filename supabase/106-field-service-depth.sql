-- ============================================================================
-- 106-field-service-depth.sql  -  Field Service depth (Dolphin gap): planned
-- preventive maintenance (PPM) plans that auto-generate recurring tickets,
-- plus RMA / bill-to and satisfaction-survey fields on the ticket. The drag-drop
-- technician calendar and customer-portal tickets are code-only. Safe to re-run.
-- ============================================================================

alter table public.service_tickets add column if not exists rma_no text;
alter table public.service_tickets add column if not exists bill_to text default 'customer';   -- customer | manufacturer | dealer
alter table public.service_tickets add column if not exists survey_score int;                  -- 1..5
alter table public.service_tickets add column if not exists survey_comment text;
alter table public.service_tickets add column if not exists maintenance_plan_id uuid;

create table if not exists public.service_maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null default 'Maintenance',
  partner_id uuid references public.partners(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  equipment_id uuid references public.plant_equipment(id) on delete set null,
  serial_no text,
  assigned_to uuid references auth.users(id) on delete set null,
  priority text default 'normal',
  frequency_days int not null default 90,
  next_due date not null default current_date,
  problem text default 'Scheduled preventive maintenance',
  active boolean default true,
  last_generated_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_service_mplans on public.service_maintenance_plans(company_id, active, next_due);

alter table public.service_maintenance_plans enable row level security;
drop policy if exists service_mplans_rw on public.service_maintenance_plans;
create policy service_mplans_rw on public.service_maintenance_plans using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
