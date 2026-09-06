-- ============================================================================
-- 100-einvoice.sql  -  E-invoicing document log (Dolphin-gap #1).
-- Stores the structured (UBL/PINT AE) document generated from each posted invoice
-- and tracks its transmission status. E-invoicing SETTINGS live on companies.profile
-- .einvoice (no schema needed). Company-scoped RLS via the existing helpers.
-- Safe to re-run.
-- ============================================================================
create table if not exists public.einvoice_docs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  format text default 'ubl-bis3',
  status text default 'generated',   -- generated | sent | accepted | rejected | error
  doc_ref text,
  payload text,                       -- the structured XML
  response jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_einvoice_docs on public.einvoice_docs(company_id, invoice_id);

alter table public.einvoice_docs enable row level security;
drop policy if exists einvoice_docs_rw on public.einvoice_docs;
create policy einvoice_docs_rw on public.einvoice_docs
  using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
