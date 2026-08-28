-- ============================================================================
--  Orbit ERP  -  COUNTER cash tendered/change + over-short account,
--                APPOINT appointment->invoice link
-- ============================================================================

-- Counter: cash tendered & change given back (net to the drawer stays `amount`)
alter table public.cash_movements add column if not exists tendered numeric(20,4) default 0;
alter table public.cash_movements add column if not exists change_given numeric(20,4) default 0;

-- Appoint: link a (completed) appointment to the invoice it was billed on
alter table public.appt_appointments add column if not exists invoice_id uuid references public.invoices(id) on delete set null;

-- A "cash over/short" account for daily-close variances (expense; can go either way)
insert into public.accounts(company_id, code, name, type_code, reconcilable)
select c.id, '6900', 'Cash over/short', 'expense', false
from public.companies c
on conflict (company_id, code) do nothing;

insert into public.coa_template_lines(template_id, code, name, type_code, reconcilable, is_bank_cash, sequence)
select t.id, '6900', 'Cash over/short', 'expense', false, false, 665
from public.coa_templates t
where t.country='LB' and t.org_id is null
  and not exists (select 1 from public.coa_template_lines x where x.template_id=t.id and x.code='6900');

select 'counter/appt v3 ready' as done;
