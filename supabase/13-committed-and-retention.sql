-- ============================================================================
--  Spacework ERP  -  CONTRACTOR: committed-cost link + retention GL accounts
--  (1) purchase_orders.project_id so open POs show as committed cost per project.
--  (2) Retention receivable (asset) + Retention payable (liability) accounts per
--      company, so progress-cert invoices and subcontract-cert bills can book the
--      retention held as a real GL balance instead of only a report figure.
-- ============================================================================
alter table public.purchase_orders add column if not exists project_id uuid references public.projects(id) on delete set null;

do $ret$ declare c record;
begin
  for c in select id from public.companies loop
    if not exists (select 1 from public.accounts a where a.company_id = c.id and a.code = '4110') then
      insert into public.accounts(company_id, code, name, type_code) values (c.id, '4110', 'Retention receivable', 'asset_receivable');
    end if;
    if not exists (select 1 from public.accounts a where a.company_id = c.id and a.code = '4010') then
      insert into public.accounts(company_id, code, name, type_code) values (c.id, '4010', 'Retention payable', 'liability_payable');
    end if;
  end loop;
end $ret$;
