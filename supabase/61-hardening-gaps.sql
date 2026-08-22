-- ============================================================================
--  Spacework ERP  -  close two documented-behaviour gaps  (run AFTER 60)
--  1) progress certificates can carry a VAT so the invoice they raise is taxed.
--  2) an approved staff expense can be posted to the accounts (payable) - the
--     help text always said this was possible; entry_id links the GL entry.
--  Additive + nullable, nothing existing breaks.
-- ============================================================================

alter table public.project_certificates add column if not exists tax_id  uuid references public.taxes(id)           on delete set null;
alter table public.hr_expenses          add column if not exists entry_id uuid references public.journal_entries(id) on delete set null;

select 'hardening gaps ready' as done;
