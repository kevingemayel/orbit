-- ============================================================================
--  Orbit ERP  -  CRM ACTIVITY LOG (feature #16)
--  Log calls / emails / meetings / notes / tasks against a lead, with an
--  optional follow-up date. Feeds the lead timeline and the "next action" view.
--  Company-scoped RLS.
-- ============================================================================

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid references public.crm_leads(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  act_type text default 'note',      -- call | email | meeting | note | task
  subject text default '',
  note text default '',
  due_date date,
  done boolean default false,
  done_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);
create index if not exists idx_crm_activities on public.crm_activities(company_id, lead_id, created_at);

alter table public.crm_activities enable row level security;
drop policy if exists crmact_r on public.crm_activities;
create policy crmact_r on public.crm_activities for select using (company_id in (select public.my_company_ids()));
drop policy if exists crmact_w on public.crm_activities;
create policy crmact_w on public.crm_activities for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'crm activities ready' as done;
