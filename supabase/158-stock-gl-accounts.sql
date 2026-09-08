-- ============================================================================
-- 158-stock-gl-accounts.sql  -  stop guessing the stock accounts by code.
--
-- Found by the new control-account invariant, not by reading the code.
--
-- Perpetual inventory posted to five HARDCODED account codes: 3100 stock, 3500
-- work in progress, 4700 goods received not invoiced, 6000 cost of sales, 6500
-- stock adjustment. Those are Orbit's own seeded codes. The moment a company
-- brings its own chart of accounts - which ALGECO just did - the lookup finds
-- nothing, and the posting function returns silently. Stock moves keep saving,
-- the warehouse looks right, and not one entry reaches the ledger. No error,
-- no toast, nothing to notice.
--
-- So the accounts become configuration on the company, like the retained
-- earnings and FX accounts already are, with the old codes used only to
-- backfill companies that never had anything else.
-- ============================================================================

alter table public.companies add column if not exists stock_account_id uuid references public.accounts(id);
alter table public.companies add column if not exists wip_account_id uuid references public.accounts(id);
alter table public.companies add column if not exists grni_account_id uuid references public.accounts(id);   -- goods received, not invoiced
alter table public.companies add column if not exists cogs_account_id uuid references public.accounts(id);
alter table public.companies add column if not exists stock_adj_account_id uuid references public.accounts(id);

comment on column public.companies.grni_account_id is 'Goods received not invoiced: the other side of a stock receipt until the supplier bill arrives.';

-- Backfill from the seeded codes, for every company that still uses them.
update public.companies c set
  stock_account_id     = coalesce(c.stock_account_id,     (select a.id from public.accounts a where a.company_id = c.id and a.code = '3100')),
  wip_account_id       = coalesce(c.wip_account_id,       (select a.id from public.accounts a where a.company_id = c.id and a.code = '3500')),
  grni_account_id      = coalesce(c.grni_account_id,      (select a.id from public.accounts a where a.company_id = c.id and a.code = '4700')),
  cogs_account_id      = coalesce(c.cogs_account_id,      (select a.id from public.accounts a where a.company_id = c.id and a.code = '6000')),
  stock_adj_account_id = coalesce(c.stock_adj_account_id, (select a.id from public.accounts a where a.company_id = c.id and a.code = '6500'));

-- ALGECO keeps its own Lebanese chart, so name its accounts explicitly rather
-- than leaving a company with 642 accounts unable to post a stock receipt.
update public.companies c set
  stock_account_id     = (select a.id from public.accounts a where a.company_id = c.id and a.code = '311'),   -- RAW MATERIALS
  wip_account_id       = (select a.id from public.accounts a where a.company_id = c.id and a.code = '331'),   -- PRODUCTS IN PROCESS
  grni_account_id      = (select a.id from public.accounts a where a.company_id = c.id and a.code = '4018'),  -- INVOICES NOT RECEIVED YET
  cogs_account_id      = (select a.id from public.accounts a where a.company_id = c.id and a.code = '6111'),  -- RAW MATERIAL PURCHASES
  stock_adj_account_id = (select a.id from public.accounts a where a.company_id = c.id and a.code = '6050')   -- Stock variation
 where c.id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1';

-- A product may still name its own stock account; that always wins. Where one
-- is set and the company has none, adopt it so the company is never unset.
update public.companies c
   set stock_account_id = (select p.stock_account_id from public.products p
                            where p.company_id = c.id and p.stock_account_id is not null limit 1)
 where c.stock_account_id is null
   and exists (select 1 from public.products p where p.company_id = c.id and p.stock_account_id is not null);
