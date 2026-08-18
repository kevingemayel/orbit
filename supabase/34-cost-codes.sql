-- ============================================================================
--  Spacework ERP  -  COST-CODE SPINE (ORB-13) + JOB COSTING (ORB-12)   run AFTER 01-33
--  One cost-code dimension threaded through budget -> commitment -> actual so job
--  costing (budget vs committed vs actual) is a query, not a rebuild.
-- ============================================================================

create table if not exists public.cost_codes (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code       text not null,
  name       text not null default '',
  category   text default '',            -- Labour | Materials | Subcontract | Plant | Preliminaries | Other
  sort       int default 10,
  is_active  boolean default true,
  created_at timestamptz default now()
);
create unique index if not exists idx_cost_codes_uniq on public.cost_codes(company_id, lower(code));
create index if not exists idx_cost_codes_co on public.cost_codes(company_id, sort);
alter table public.cost_codes enable row level security;

-- thread the code through the three cost stages
alter table public.project_budgets     add column if not exists cost_code_id uuid references public.cost_codes(id) on delete set null;
alter table public.purchase_order_lines add column if not exists cost_code_id uuid references public.cost_codes(id) on delete set null;
alter table public.invoice_lines        add column if not exists cost_code_id uuid references public.cost_codes(id) on delete set null;
create index if not exists idx_pol_costcode on public.purchase_order_lines(cost_code_id);
create index if not exists idx_il_costcode  on public.invoice_lines(cost_code_id);
create index if not exists idx_pb_costcode  on public.project_budgets(cost_code_id);

-- company-scoped RLS (standard helpers)
drop policy if exists cc_r on public.cost_codes;
create policy cc_r on public.cost_codes for select using (company_id in (select public.my_company_ids()));
drop policy if exists cc_w on public.cost_codes;
create policy cc_w on public.cost_codes for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'cost codes ready' as done, (select count(*) from public.cost_codes) as codes;
