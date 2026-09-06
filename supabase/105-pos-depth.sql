-- ============================================================================
-- 105-pos-depth.sql  -  POS depth (Dolphin gap): promotions, gift/cashback
-- vouchers, loyalty points, POS returns/refunds, and period scoping on the
-- existing pricelists so POS can pick a time-bound price list. Company-scoped
-- RLS via existing helpers. Safe to re-run.
-- ============================================================================

-- Loyalty balance on the customer.
alter table public.partners add column if not exists loyalty_points numeric(20,2) default 0;

-- POS order: discount, redeemed voucher, loyalty movement, and refund link.
alter table public.pos_orders add column if not exists discount numeric(20,4) default 0;
alter table public.pos_orders add column if not exists voucher_code text;
alter table public.pos_orders add column if not exists loyalty_earned numeric(20,2) default 0;
alter table public.pos_orders add column if not exists loyalty_redeemed numeric(20,2) default 0;
alter table public.pos_orders add column if not exists refund_of uuid references public.pos_orders(id) on delete set null;
alter table public.pos_order_lines add column if not exists discount numeric(20,4) default 0;

-- Period scoping for pricelists (location/period/channel). Product/category
-- scoping already lives in pricelist_items; these add the time + channel axis.
alter table public.pricelists add column if not exists valid_from date;
alter table public.pricelists add column if not exists valid_to date;
alter table public.pricelists add column if not exists channel text;

-- Promotions: percentage off, quantity tier, or buy-x-get-y, scoped to all /
-- a category / a product.
create table if not exists public.pos_promotions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Promotion',
  kind text not null default 'percent_off',          -- percent_off | qty_tier | bxgy
  scope_type text not null default 'all',             -- all | category | product
  scope_id uuid,                                      -- category_id or product_id
  params jsonb not null default '{}'::jsonb,           -- {pct} | {min_qty,pct} | {buy_qty,get_qty}
  active boolean default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_pos_promotions on public.pos_promotions(company_id, active);

-- Gift / cashback vouchers.
create table if not exists public.pos_vouchers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  kind text not null default 'fixed',                 -- fixed | percent
  value numeric(20,4) not null default 0,
  expiry date,
  active boolean default true,
  used_at timestamptz,
  used_order_id uuid references public.pos_orders(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_pos_vouchers on public.pos_vouchers(company_id, code);

alter table public.pos_promotions enable row level security;
alter table public.pos_vouchers    enable row level security;
drop policy if exists pos_promotions_rw on public.pos_promotions;
create policy pos_promotions_rw on public.pos_promotions using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
drop policy if exists pos_vouchers_rw on public.pos_vouchers;
create policy pos_vouchers_rw on public.pos_vouchers using (company_id in (select public.my_company_ids())) with check (public.can_write_company(company_id));
