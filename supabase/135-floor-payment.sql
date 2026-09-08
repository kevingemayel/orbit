-- ============================================================================
-- 135-floor-payment.sql  -  taking the money at the table.
--
-- pos_payments was id/company/order/method/amount only, which is enough for a
-- counter sale rung once. A table bill is different: it can be settled by
-- several people, in several tenders, and part of it can be paid before the
-- rest. So a payment needs to know when it happened, what it referenced, and
-- which slice of the bill it covered.
--
-- Safe to re-run.
-- ============================================================================

alter table public.pos_payments add column if not exists paid_at timestamptz not null default now();
alter table public.pos_payments add column if not exists reference text;
alter table public.pos_payments add column if not exists tip_amount numeric not null default 0;
alter table public.pos_payments add column if not exists stored_value_account_id uuid references public.stored_value_accounts(id) on delete set null;
alter table public.pos_payments add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.pos_payments add column if not exists taken_by text;
-- which part of the bill this tender settled: whole | even_split | items | amount
alter table public.pos_payments add column if not exists split_kind text not null default 'whole';
alter table public.pos_payments add column if not exists split_label text;
create index if not exists idx_pospay_order on public.pos_payments (order_id);

-- Paying "by item" needs the line to remember it has been settled, otherwise
-- the second person to pay is offered the same dishes again.
alter table public.pos_order_lines add column if not exists paid boolean not null default false;
alter table public.pos_order_lines add column if not exists paid_at timestamptz;

-- The bill's own state, separate from the kitchen's view of the order.
alter table public.pos_orders add column if not exists amount_paid numeric not null default 0;
alter table public.pos_orders add column if not exists closed_at timestamptz;

-- What is still owed on a table, in one place, so the floor screen and the
-- payment modal can never disagree about the balance.
create or replace function public.order_balance(p_order uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select round(
    coalesce((select total from public.pos_orders where id = p_order), 0)
    - coalesce((select sum(amount) from public.pos_payments where order_id = p_order), 0)
  , 2);
$$;
