-- ============================================================================
--  Spacework ERP  -  FX CONVERSION CORE (the dependency posting relies on)
--  Migration 75 (post_invoice / register_payment) calls public.fx_convert(),
--  but that function was never created - so every multi-currency post failed
--  with "function public.fx_convert(...) does not exist". This creates it.
--
--  Data model (already live):
--    orgs.ref_currency        = the org's pivot currency (all orgs = USD today)
--    currency_rates(org_id, code, rate_date, rate)
--                             = value of 1 unit of `code` in the ref currency,
--                               on rate_date. The ref currency itself has rate 1.
--                               e.g. EUR rate 1.10  ->  1 EUR = 1.10 USD.
--
--  This migration also adds rate_type (spot | average | closing) so later phases
--  can translate the P&L at the period average and the balance sheet at the
--  closing rate. Existing rows backfill to 'spot'. fx_rate falls back to the
--  latest rate of any type when the requested type is missing, so nothing breaks.
-- ============================================================================

-- 1) rate_type dimension ------------------------------------------------------
alter table public.currency_rates add column if not exists rate_type text not null default 'spot';
update public.currency_rates set rate_type='spot' where rate_type is null or rate_type='';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='currency_rates_rate_type_chk') then
    alter table public.currency_rates
      add constraint currency_rates_rate_type_chk check (rate_type in ('spot','average','closing'));
  end if;
end $$;
create unique index if not exists currency_rates_uq
  on public.currency_rates(org_id, code, rate_date, rate_type);

-- 2) fx_rate: units of the org ref currency per 1 unit of p_code, on/before p_date
--    Prefers the requested rate_type, then falls back to the latest of any type.
create or replace function public.fx_rate(p_org uuid, p_code text, p_date date, p_type text default 'spot')
returns numeric language plpgsql stable as $fn$
declare ref text; r numeric;
begin
  p_code := upper(trim(coalesce(p_code,'')));
  select upper(ref_currency) into ref from public.orgs where id=p_org;
  if p_code = '' then return null; end if;
  if ref is not null and p_code = ref then return 1; end if;
  -- exact type on/before the date
  select rate into r from public.currency_rates
    where org_id=p_org and upper(code)=p_code and rate_date<=p_date and rate_type=p_type
    order by rate_date desc limit 1;
  if r is not null then return r; end if;
  -- fallback: latest of any type on/before the date (spot wins ties)
  select rate into r from public.currency_rates
    where org_id=p_org and upper(code)=p_code and rate_date<=p_date
    order by rate_date desc, (case when rate_type='spot' then 0 else 1 end) limit 1;
  return r;
end; $fn$;

-- 3) fx_convert: p_amount from p_from into p_to, triangulated through the ref
--    currency. Same-currency short-circuits (no rate needed). Missing rate raises
--    a clear, named error so a bad post fails loudly instead of silently wrong.
create or replace function public.fx_convert(p_org uuid, p_amount numeric, p_from text, p_to text, p_date date default current_date, p_type text default 'spot')
returns numeric language plpgsql stable as $fn$
declare rf numeric; rt numeric;
begin
  if p_amount is null then return 0; end if;
  if upper(trim(coalesce(p_from,''))) = upper(trim(coalesce(p_to,''))) then return p_amount; end if;
  rf := public.fx_rate(p_org, p_from, p_date, p_type);
  rt := public.fx_rate(p_org, p_to,   p_date, p_type);
  if rf is null then raise exception 'no FX rate for % on or before % (type %)', upper(trim(p_from)), p_date, p_type; end if;
  if rt is null then raise exception 'no FX rate for % on or before % (type %)', upper(trim(p_to)),   p_date, p_type; end if;
  return p_amount * rf / rt;
end; $fn$;

grant execute on function public.fx_rate(uuid,text,date,text) to authenticated, anon;
grant execute on function public.fx_convert(uuid,numeric,text,text,date,text) to authenticated, anon;

select 'fx_convert ready' as done;
