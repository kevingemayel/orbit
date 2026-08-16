-- ============================================================================
--  Spacework ERP  -  FUNNEL TRACEABILITY (ORB-02)  (run AFTER 01-31)
--  The lead -> tender -> project chain already works and carries data forward;
--  this adds the missing BACK-references so a project can be traced to its
--  tender, and a tender to the lead it came from. Additive + safe.
-- ============================================================================
alter table public.tenders  add column if not exists source_lead_id   uuid references public.crm_leads(id) on delete set null;
alter table public.projects add column if not exists source_tender_id uuid references public.tenders(id)   on delete set null;
create index if not exists idx_tenders_source_lead   on public.tenders(source_lead_id);
create index if not exists idx_projects_source_tender on public.projects(source_tender_id);
select 'traceability columns added' as done;
