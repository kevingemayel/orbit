-- ============================================================================
--  Spacework ERP  -  editable settings: payment terms, unit conversion, labels
--  (AFTER 68)
--   * payment_terms  : an editable list of payment-term options per company
--   * uoms.factor/... : link units for easy conversion (factor to a base unit)
--   * task_labels    : predefined execution-task labels per company
--  RLS follows the standard company-scoped pattern (read = my_company_ids,
--  write = can_write_company). All additive.
-- ============================================================================

-- ---- editable payment terms -------------------------------------------------
create table if not exists public.payment_terms (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  days       int  not null default 0,
  label      text,
  sort       int  default 0,
  created_at timestamptz default now()
);
alter table public.payment_terms enable row level security;
drop policy if exists pt_r on public.payment_terms;
create policy pt_r on public.payment_terms for select using (company_id in (select public.my_company_ids()));
drop policy if exists pt_w on public.payment_terms;
create policy pt_w on public.payment_terms for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- ---- unit conversion (link units with a formula) ----------------------------
alter table public.uoms add column if not exists factor   numeric;   -- how many BASE units in one of this unit
alter table public.uoms add column if not exists base_uom text;      -- the base unit this converts to
alter table public.uoms add column if not exists category text;      -- optional group: length / weight / area / count

-- ---- predefined task labels -------------------------------------------------
create table if not exists public.task_labels (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name       text not null,
  color      text,
  sort       int  default 0,
  created_at timestamptz default now()
);
alter table public.task_labels enable row level security;
drop policy if exists tl_r on public.task_labels;
create policy tl_r on public.task_labels for select using (company_id in (select public.my_company_ids()));
drop policy if exists tl_w on public.task_labels;
create policy tl_w on public.task_labels for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'settings config ready' as done;
