-- ============================================================================
--  Spacework ERP  -  RFQ / supplier comparison (ORB-14)   run AFTER 01-35
--  Request quotes from several suppliers, capture each supplier's price per
--  line, compare side by side, and award -> generate a PO (which becomes the
--  committed cost in the Job Cost report). Tagged to a project + cost code.
-- ============================================================================

create table if not exists public.rfqs (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  number       text,
  title        text not null default 'Request for Quotation',
  project_id   uuid references public.projects(id)   on delete set null,
  cost_code_id uuid references public.cost_codes(id) on delete set null,
  deadline     date,
  status       text not null default 'draft',   -- draft | sent | closed | awarded | cancelled
  note         text default '',
  awarded_partner_id uuid references public.partners(id) on delete set null,
  created_at   timestamptz default now()
);
create index if not exists idx_rfqs_co on public.rfqs(company_id, created_at desc);

create table if not exists public.rfq_lines (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  rfq_id      uuid not null references public.rfqs(id) on delete cascade,
  description text not null default 'Item',
  unit        text default '',
  quantity    numeric(20,4) default 1,
  sequence    int default 10
);
create index if not exists idx_rfql_rfq on public.rfq_lines(rfq_id, sequence);

create table if not exists public.rfq_vendors (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  rfq_id     uuid not null references public.rfqs(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  status     text default 'invited',            -- invited | quoted | declined
  lead_time_days int,
  note       text default ''
);
create index if not exists idx_rfqv_rfq on public.rfq_vendors(rfq_id);

create table if not exists public.rfq_bids (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  rfq_id      uuid not null references public.rfqs(id) on delete cascade,
  rfq_line_id uuid not null references public.rfq_lines(id) on delete cascade,
  partner_id  uuid not null references public.partners(id) on delete cascade,
  unit_price  numeric(20,4) default 0
);
create index if not exists idx_rfqb_rfq on public.rfq_bids(rfq_id);
create unique index if not exists idx_rfqb_uniq on public.rfq_bids(rfq_line_id, partner_id);

-- company-scoped RLS on all four
do $$ declare t text;
begin
  foreach t in array array['rfqs','rfq_lines','rfq_vendors','rfq_bids'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $$;

select 'rfq ready' as done;
