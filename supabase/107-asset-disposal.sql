-- ============================================================================
-- 107-asset-disposal.sql  -  Fixed-asset disposal (Dolphin gap): capture a
-- sale / scrap, the proceeds, and the resulting gain or loss, and close the
-- asset. The utilization / depreciation dashboard is code-only. Safe to re-run.
-- ============================================================================
alter table public.assets add column if not exists disposed boolean default false;
alter table public.assets add column if not exists disposal_date date;
alter table public.assets add column if not exists disposal_type text;      -- sale | scrap | writeoff
alter table public.assets add column if not exists disposal_value numeric(20,4) default 0;
alter table public.assets add column if not exists disposal_gain numeric(20,4);   -- proceeds - net book value at disposal
