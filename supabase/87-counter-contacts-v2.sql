-- ============================================================================
--  Orbit ERP  -  COUNTER v2 + CONTACT TYPES
--  Feedback from real cash-desk use:
--   #1/#2  a cash receipt/payment on behalf of a customer/supplier must move
--          their STATEMENT (create a payments row) and be splittable across
--          several invoices  -> cash_movements gains allocations + a handler.
--   #3     configurable payment methods.
--   #4     two parties: the physical person (handler = From/To) vs the account
--          that actually moves (party = On behalf of, already party_type/id).
--   #5     contact TYPE on partners: company (client/supplier/bank/insurance/
--          subcontractor/other), freelancer, or employee-of-a-company.
-- ============================================================================

-- #4 + #1: the physical handler (From/To) and the invoice allocation record
alter table public.cash_movements add column if not exists handler_name text default '';
alter table public.cash_movements add column if not exists handler_id uuid references public.partners(id) on delete set null;
alter table public.cash_movements add column if not exists allocations jsonb default '[]'::jsonb;  -- [{invoice_id, number, amount, payment_id}]
alter table public.cash_movements add column if not exists advance_amount numeric(20,4) default 0; -- the unallocated (on-account) part

-- #3: configurable payment methods
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Cash',
  kind text default 'cash',                  -- cash | bank | cheque | card | online | other
  is_active boolean default true,
  sort int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_payment_methods on public.payment_methods(company_id, is_active, sort);
alter table public.payment_methods enable row level security;
drop policy if exists paymeth_r on public.payment_methods;
create policy paymeth_r on public.payment_methods for select using (company_id in (select public.my_company_ids()));
drop policy if exists paymeth_w on public.payment_methods;
create policy paymeth_w on public.payment_methods for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- seed the standard four methods for every existing company
insert into public.payment_methods(company_id, name, kind, sort)
select c.id, v.name, v.kind, v.sort
from public.companies c
cross join (values ('Cash','cash',0),('Bank transfer','bank',1),('Cheque','cheque',2),('Card','card',3)) as v(name, kind, sort)
where not exists (select 1 from public.payment_methods pm where pm.company_id=c.id);

-- #5: contact type on partners
alter table public.partners add column if not exists contact_kind text default 'company';  -- company | freelancer | employee
alter table public.partners add column if not exists company_type text;                    -- client | supplier | bank | insurance | subcontractor | other
alter table public.partners add column if not exists employer_id uuid references public.partners(id) on delete set null;  -- for an employee: the company they work at
alter table public.partners add column if not exists role_title text default '';           -- for an employee / contact person

-- backfill existing partners so they have a sensible type
update public.partners set contact_kind = 'company' where contact_kind is null;
update public.partners set company_type = case
    when is_customer and is_vendor then 'client'
    when is_customer then 'client'
    when is_vendor then 'supplier'
    else 'other' end
  where company_type is null;

select 'counter v2 + contact types ready' as done;
