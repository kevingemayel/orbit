-- ============================================================================
--  Spacework ERP  -  COMPANY SETUP + LEBANESE CHART OF ACCOUNTS TEMPLATE
--  Run AFTER accounting-core.sql and 02-operations.sql.
--  Gives a reusable, EDITABLE chart template (Lebanese / French-plan style) and
--  a one-click setup_company() that seeds a company's chart, journals, taxes,
--  sequences and system accounts. After setup, every account is a normal row
--  the user can rename / add / deactivate (RLS: company writers).
-- ============================================================================

-- Reusable templates (global templates have org_id = null; an org can add its own)
create table if not exists public.coa_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,
  name text not null, country text default '', is_active boolean default true
);
create table if not exists public.coa_template_lines (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.coa_templates(id) on delete cascade,
  code text not null, name text not null, type_code text not null references public.account_types(code),
  reconcilable boolean default false, is_bank_cash boolean default false, sequence int default 10
);
alter table public.coa_templates enable row level security;
alter table public.coa_template_lines enable row level security;
drop policy if exists coat_r on public.coa_templates;
create policy coat_r on public.coa_templates for select using (auth.uid() is not null);
drop policy if exists coatl_r on public.coa_template_lines;
create policy coatl_r on public.coa_template_lines for select using (auth.uid() is not null);

-- ---------------------------------------------------------------------------
--  Seed the Lebanese general chart (French-plan classes 1-7). Representative,
--  editable starting point; users adjust per company after setup.
-- ---------------------------------------------------------------------------
do $$
declare tid uuid;
begin
  select id into tid from public.coa_templates where country='LB' and org_id is null limit 1;
  if tid is null then
    insert into public.coa_templates(name, country) values ('Lebanon - General Chart', 'LB') returning id into tid;
    insert into public.coa_template_lines(template_id, code, name, type_code, reconcilable, is_bank_cash, sequence) values
    -- Class 1: Equity & long-term liabilities
    (tid,'1000','Capital','equity',false,false,10),
    (tid,'1060','Legal & other reserves','equity',false,false,20),
    (tid,'1100','Retained earnings','equity',false,false,30),
    (tid,'1200','Current year result','equity_unaffected',false,false,40),
    (tid,'1300','Cumulative translation adjustment','equity_cta',false,false,50),
    (tid,'1600','Long-term loans','liability_non_current',false,false,60),
    -- Class 2: Fixed assets
    (tid,'2100','Property, plant & equipment','asset_fixed',false,false,110),
    (tid,'2180','Furniture, fixtures & IT','asset_fixed',false,false,120),
    (tid,'2400','Intangible assets','asset_non_current',false,false,130),
    (tid,'2800','Accumulated depreciation','asset_fixed',false,false,140),
    -- Class 3: Inventory
    (tid,'3100','Raw materials','asset_current',false,false,210),
    (tid,'3500','Work in progress / finished goods','asset_current',false,false,220),
    (tid,'3700','Merchandise (goods for resale)','asset_current',false,false,230),
    -- Class 4: Third parties
    (tid,'4000','Suppliers (accounts payable)','liability_payable',true,false,310),
    (tid,'4090','Suppliers - advances paid','asset_current',false,false,315),
    (tid,'4100','Customers (accounts receivable)','asset_receivable',true,false,320),
    (tid,'4190','Customers - advances received','liability_current',false,false,325),
    (tid,'4200','Personnel - salaries payable','liability_current',false,false,330),
    (tid,'4300','Social security (NSSF)','liability_current',false,false,340),
    (tid,'4456','VAT deductible (input)','asset_current',false,false,350),
    (tid,'4457','VAT collected (output)','liability_tax',false,false,360),
    (tid,'4458','VAT payable / receivable','liability_tax',false,false,370),
    (tid,'4600','Sundry debtors','asset_current',false,false,380),
    (tid,'4610','Sundry creditors','liability_current',false,false,390),
    (tid,'4700','Suspense / to allocate','asset_current',false,false,400),
    -- Class 5: Financial
    (tid,'5100','Bank','asset_cash',false,true,510),
    (tid,'5150','Bank - second account','asset_cash',false,true,515),
    (tid,'5300','Cash on hand','asset_cash',false,true,520),
    (tid,'5710','Outstanding receipts','asset_cash',false,true,530),
    (tid,'5720','Outstanding payments','asset_cash',false,true,540),
    (tid,'5800','Internal transfers','asset_cash',false,true,550),
    -- Class 6: Expenses
    (tid,'6000','Purchases of goods / materials','expense_cogs',false,false,610),
    (tid,'6100','Subcontracting & external services','expense',false,false,620),
    (tid,'6200','Rent, utilities & other external','expense',false,false,630),
    (tid,'6300','Taxes & duties','expense',false,false,640),
    (tid,'6400','Personnel costs (salaries)','expense',false,false,650),
    (tid,'6500','Other operating expenses','expense',false,false,660),
    (tid,'6600','Financial charges','expense',false,false,670),
    (tid,'6660','Foreign exchange loss','expense',false,false,675),
    (tid,'6800','Depreciation & amortization','expense_depreciation',false,false,680),
    -- Class 7: Revenue
    (tid,'7000','Sales of services','income',false,false,710),
    (tid,'7010','Sales of goods','income',false,false,720),
    (tid,'7400','Other operating income','income_other',false,false,730),
    (tid,'7600','Financial income','income_other',false,false,740),
    (tid,'7660','Foreign exchange gain','income_other',false,false,745);
  end if;
end $$;

-- ---------------------------------------------------------------------------
--  setup_company(): seed chart + journals + taxes + sequences + system accounts
-- ---------------------------------------------------------------------------
create or replace function public.setup_company(p_company uuid, p_template uuid default null)
returns void language plpgsql security definer set search_path=public as $$
declare tmpl uuid; cur text;
begin
  -- allow SQL-editor / service seeding (auth.uid() null); otherwise require a company writer
  if auth.uid() is not null and not public.can_write_company(p_company) then raise exception 'not allowed'; end if;
  select currency_code into cur from public.companies where id=p_company;
  tmpl := coalesce(p_template, (select id from public.coa_templates where country='LB' and org_id is null limit 1));

  -- 1) chart of accounts (copied from template; editable afterwards)
  insert into public.accounts(company_id, code, name, type_code, reconcilable)
  select p_company, l.code, l.name, l.type_code, l.reconcilable
  from public.coa_template_lines l where l.template_id = tmpl
  on conflict (company_id, code) do nothing;

  -- 2) system accounts on the company
  update public.companies c set
    retained_earnings_account_id = (select id from public.accounts where company_id=p_company and code='1100'),
    current_earnings_account_id  = (select id from public.accounts where company_id=p_company and code='1200'),
    fx_gain_account_id           = (select id from public.accounts where company_id=p_company and code='7660'),
    fx_loss_account_id           = (select id from public.accounts where company_id=p_company and code='6660')
  where c.id = p_company;

  -- 3) journals
  insert into public.journals(company_id, code, name, type, default_account_id, seq_prefix)
  values
    (p_company,'INV','Customer Invoices','sale',   (select id from public.accounts where company_id=p_company and code='7000'), 'INV/'),
    (p_company,'BILL','Vendor Bills','purchase',   (select id from public.accounts where company_id=p_company and code='6000'), 'BILL/'),
    (p_company,'BNK','Bank','bank',                (select id from public.accounts where company_id=p_company and code='5100'), 'BNK/'),
    (p_company,'CSH','Cash','cash',                (select id from public.accounts where company_id=p_company and code='5300'), 'CSH/'),
    (p_company,'MISC','Miscellaneous','general',   null, 'MISC/')
  on conflict (company_id, code) do nothing;

  -- 4) taxes (Lebanon VAT 11% + 0% export)
  insert into public.taxes(company_id, name, scope, amount_type, amount, account_id)
  values
    (p_company,'VAT 11%','sale','percent',11,        (select id from public.accounts where company_id=p_company and code='4457')),
    (p_company,'VAT 11% (purchase)','purchase','percent',11, (select id from public.accounts where company_id=p_company and code='4456')),
    (p_company,'Exempt 0%','sale','percent',0, null);

  -- 5) currencies for the org (idempotent)
  insert into public.currencies(org_id, code, name, symbol, decimals)
  select c.org_id, x.code, x.name, x.symbol, 2
  from public.companies c, (values ('USD','US Dollar','$'),('EUR','Euro','EUR'),('LBP','Lebanese Pound','LBP')) as x(code,name,symbol)
  where c.id = p_company
  on conflict (org_id, code) do nothing;
end; $$;
grant execute on function public.setup_company(uuid, uuid) to authenticated;

-- ============================================================================
--  Usage: after create_org_for_me(...) or creating a company, call
--    select public.setup_company('<company_id>');
--  -> company gets the Lebanese chart, journals, VAT taxes, currencies.
--  Every account is then editable (rename / add / deactivate) per company.
-- ============================================================================
