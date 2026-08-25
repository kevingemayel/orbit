-- ============================================================================
--  Orbit ERP  -  WORK-ORDER ROUTING / OPERATIONS (feature #1)
--  Multi-step routing on a work order: ordered operations (cut, weld, glaze,
--  QC ...), each at a work centre, timed, and advanced pending -> in_progress
--  -> done. Company-scoped RLS.
-- ============================================================================

create table if not exists public.work_order_operations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  sequence int default 10,
  name text not null default 'Operation',
  work_center text default '',
  state text default 'pending',      -- pending | in_progress | done
  planned_minutes numeric(20,2) default 0,
  actual_minutes numeric(20,2) default 0,
  operator text default '',
  started_at timestamptz,
  done_at timestamptz,
  note text default '',
  created_at timestamptz default now()
);
create index if not exists idx_wo_operations on public.work_order_operations(company_id, work_order_id, sequence);

alter table public.work_order_operations enable row level security;
drop policy if exists woops_r on public.work_order_operations;
create policy woops_r on public.work_order_operations for select using (company_id in (select public.my_company_ids()));
drop policy if exists woops_w on public.work_order_operations;
create policy woops_w on public.work_order_operations for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'work order operations ready' as done;
