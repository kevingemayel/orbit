-- ============================================================================
--  Spacework ERP  -  COCKPIT SUITE  (run AFTER 01-17)
--  Four features share this migration:
--   1. Collections: ar_followups (chase log per overdue customer/invoice)
--   2. Consolidation: partners.intercompany_company_id (tag intra-group parties
--      so their balances net out in consolidation)
--   3. Cash forecast: projects.retention_due_date (expected retention release)
--   4. Document control: submittals, rfis, transmittals + transmittal_items
--  Company-scoped RLS.
-- ============================================================================

-- 1. Collections follow-up log
create table if not exists public.ar_followups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  followup_date date default current_date,
  channel text default 'call',                 -- call | email | meeting | letter
  note text default '',
  promised_date date, promised_amount numeric(20,4) default 0,
  next_action_date date,
  status text default 'open',                   -- open | promised | paid | escalated
  created_at timestamptz default now()
);
create index if not exists idx_ar_followups on public.ar_followups(company_id, partner_id, invoice_id);

-- 2. Intercompany tagging for consolidation elimination
alter table public.partners add column if not exists intercompany_company_id uuid references public.companies(id) on delete set null;

-- 3. Expected retention release date for the cash forecast
alter table public.projects add column if not exists retention_due_date date;

-- 4. Document control: submittals / drawings / material approvals
create table if not exists public.submittals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  number text default '', title text not null default 'Submittal',
  doc_type text default 'shop_drawing',        -- shop_drawing | material_approval | sample | method_statement | other
  revision text default 'A',
  status text default 'draft',                 -- draft | submitted | approved | approved_comments | rejected | superseded
  consultant text default '', ref text default '',
  submitted_date date, response_date date, due_date date,
  notes text default '',
  created_at timestamptz default now()
);
create index if not exists idx_submittals on public.submittals(company_id, project_id, status);

create table if not exists public.rfis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  number text default '', subject text not null default 'RFI',
  question text default '', answer text default '',
  status text default 'open',                  -- open | answered | closed
  raised_date date default current_date, needed_by date, answered_date date,
  discipline text default '',
  created_at timestamptz default now()
);
create index if not exists idx_rfis on public.rfis(company_id, project_id, status);

create table if not exists public.transmittals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  number text default '', to_party text default '', purpose text default '',
  transmittal_date date default current_date, notes text default '',
  created_at timestamptz default now()
);
create table if not exists public.transmittal_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transmittal_id uuid not null references public.transmittals(id) on delete cascade,
  description text default '', doc_ref text default '', revision text default '', copies int default 1, sequence int default 10
);

do $rls$ declare t text;
begin
  foreach t in array array['ar_followups','submittals','rfis','transmittals','transmittal_items'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;

select 'ar_followups' t, count(*) n from public.ar_followups
union all select 'submittals', count(*) from public.submittals
union all select 'rfis', count(*) from public.rfis
union all select 'transmittals', count(*) from public.transmittals;
