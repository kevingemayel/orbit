-- ============================================================================
-- 157-dual-currency-tender.sql  -  one bill, more than one currency.
--
-- A till in Beirut takes 300,000 lira and five dollars for the same bill and
-- gives the change in whichever it has. Orbit's engine has always converted
-- correctly; the tender screen only ever accepted one currency, so the cashier
-- had to fudge it and the drawer count afterwards meant nothing.
--
-- The shape that makes this work without breaking a single existing report:
--
--   * amount stays what it has always been - the value in the company's own
--     currency. Every report, every money invariant, the whole ledger side is
--     untouched.
--   * currency_code + amount_ccy record what physically crossed the counter,
--     and fx_rate is what it was converted at, so amount = amount_ccy * fx_rate.
--   * CHANGE IS A NEGATIVE TENDER. That is how a drawer actually works: money
--     in, money out, and what is left is what should be in it. It also means
--     the payments on an order still add up to exactly the bill, so nothing
--     downstream has to learn about over-tendering.
-- ============================================================================

alter table public.pos_payments add column if not exists currency_code text;
alter table public.pos_payments add column if not exists amount_ccy numeric;
alter table public.pos_payments add column if not exists fx_rate numeric;

comment on column public.pos_payments.amount_ccy is 'What physically crossed the counter, in currency_code. Negative for change handed back.';
comment on column public.pos_payments.fx_rate is 'Units of the company currency per 1 unit of currency_code on the day. amount = amount_ccy * fx_rate.';

-- Everything taken before today was in the company's own currency by definition.
update public.pos_payments p
   set currency_code = c.currency_code, amount_ccy = p.amount, fx_rate = 1
  from public.companies c
 where c.id = p.company_id and p.currency_code is null;

alter table public.pos_payments alter column fx_rate set default 1;

-- A cash session is counted per currency now: one number cannot describe a
-- drawer holding two. The existing columns stay as the home-currency totals.
alter table public.pos_sessions add column if not exists opening_ccy jsonb;   -- {"USD":100,"LBP":5000000}
alter table public.pos_sessions add column if not exists declared_ccy jsonb;

-- What should be in the drawer, per currency, for one session: every cash
-- tender in, every bit of change out, in the currency it happened in.
create or replace function public.session_drawer(p_session uuid)
returns table (currency_code text, expected numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  select coalesce(p.currency_code, c.currency_code) as currency_code,
         round(sum(coalesce(p.amount_ccy, p.amount)), 2) as expected
    from public.pos_payments p
    join public.pos_orders o on o.id = p.order_id
    join public.companies c on c.id = p.company_id
   where o.session_id = p_session
     and p.method in ('cash', 'change')
   group by 1
   having round(sum(coalesce(p.amount_ccy, p.amount)), 2) <> 0
   order by 1;
$fn$;

create index if not exists pos_payments_ccy_idx on public.pos_payments (company_id, currency_code);
