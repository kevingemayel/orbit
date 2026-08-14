-- ============================================================================
--  Spacework ERP  -  ESTIMATION / TENDERING  (run AFTER 01-14)
--  Price a tender from a BOQ with a per-line cost buildup (material / labour /
--  subcontract / other + margin), track a win/loss pipeline, and on WIN convert
--  the tender into a project with contract value, a seeded cost budget, and the
--  schedule of values (BOQ) ready for progress billing. Company-scoped RLS.
-- ============================================================================
create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  number text default '', name text not null default 'Tender',
  partner_id uuid references public.partners(id) on delete set null,
  status text default 'draft',                 -- draft | submitted | won | lost
  tender_date date default current_date, valid_until date, submitted_date date,
  margin_pct numeric(6,2) default 15,          -- default margin applied to new lines
  notes text default '', lost_reason text default '',
  project_id uuid references public.projects(id) on delete set null,   -- set on WIN
  total_cost numeric(20,4) default 0, total_sell numeric(20,4) default 0,
  created_at timestamptz default now()
);
create index if not exists idx_tenders_company on public.tenders(company_id, status);

create table if not exists public.tender_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tender_id uuid not null references public.tenders(id) on delete cascade,
  code text default '', description text not null default 'Item', unit text default '',
  quantity numeric(20,4) default 1,
  material_cost numeric(20,4) default 0, labour_cost numeric(20,4) default 0,     -- per unit
  subcontract_cost numeric(20,4) default 0, other_cost numeric(20,4) default 0,   -- per unit
  margin_pct numeric(6,2) default 0,
  sell_rate numeric(20,4) default 0, line_total numeric(20,4) default 0,
  sequence int default 10
);
create index if not exists idx_tender_lines on public.tender_lines(company_id, tender_id, sequence);

do $rls$ declare t text;
begin
  foreach t in array array['tenders','tender_lines'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;
