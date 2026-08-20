-- ============================================================================
--  Spacework ERP  -  EVENTS integrations  (run AFTER 01-54)
--  Wire the Events module into the rest of Orbit: a client (contact) + optional
--  project on the event, a source CRM lead, and links from money rows to the
--  real accounting documents they create.
-- ============================================================================
alter table public.event_events add column if not exists partner_id     uuid references public.partners(id)  on delete set null;
alter table public.event_events add column if not exists project_id      uuid references public.projects(id)  on delete set null;
alter table public.event_events add column if not exists source_lead_id  uuid references public.crm_leads(id) on delete set null;

alter table public.event_revenues    add column if not exists invoice_id uuid references public.invoices(id) on delete set null;
alter table public.event_payments     add column if not exists bill_id    uuid references public.invoices(id) on delete set null;
alter table public.event_procurement  add column if not exists bill_id    uuid references public.invoices(id) on delete set null;
alter table public.event_budget_lines add column if not exists bill_id    uuid references public.invoices(id) on delete set null;

alter table public.crm_leads add column if not exists event_id uuid references public.event_events(id) on delete set null;

select 'events integrations ready' as done;
