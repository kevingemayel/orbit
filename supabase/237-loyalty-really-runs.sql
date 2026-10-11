-- 237: one loyalty engine, instead of two that never met.
--
-- Orbit had a Loyalty programmes screen where you set points per unit spent,
-- the value of a point, how many stamps make a reward and what the reward is.
-- The till read none of it. It read two numbers off the company profile, added
-- or subtracted a single running total on the contact, and that was loyalty:
-- no account, no history, no stamps, no tiers, no reward. Underneath sat
-- loyalty_accounts and loyalty_transactions with 84 rows between them that no
-- screen could show and nothing could write.
--
-- So a shop could configure "buy nine, get the tenth free", explain it at the
-- counter, and nothing would ever count to nine.
--
-- One engine now:
--
--   loyalty_rules(company)       what is actually in force: the active
--                                programme if there is one, otherwise the two
--                                profile numbers, so nothing changes for a
--                                shop that only ever set those.
--   loyalty_post(...)            one call at the end of a sale. It opens the
--                                customer's account if they have none, earns,
--                                redeems, counts the stamp, fills the card and
--                                says the reward is due, keeps the running
--                                total on the contact in step so every screen
--                                that reads it stays right, and writes a row
--                                per movement so the history exists.
--   loyalty_reverse(order)       a refund takes back exactly what that sale
--                                gave, from the rows it wrote, not from a
--                                recalculation that can drift.
--
-- Tiers are moved on spend, because that is the only tier rule a till can
-- apply without being told anything else: bronze, silver and gold at 0, 500
-- and 2,000 of lifetime spend. A house that wants its own thresholds says so
-- on the programme, and this reads them.
alter table public.loyalty_programs
  add column if not exists tier_1_at numeric,
  add column if not exists tier_2_at numeric,
  add column if not exists tier_1_name text,
  add column if not exists tier_2_name text,
  add column if not exists base_tier_name text;
alter table public.loyalty_accounts
  add column if not exists reward_due int default 0,
  add column if not exists last_activity_at timestamptz;
create unique index if not exists loyalty_accounts_one_per_partner
  on public.loyalty_accounts (company_id, partner_id);
create index if not exists loyalty_tx_account_idx on public.loyalty_transactions (account_id, created_at desc);
create index if not exists loyalty_tx_order_idx on public.loyalty_transactions (order_id);

create or replace function public.loyalty_rules(p_company uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select jsonb_build_object(
    'program_id', p.id,
    'name', p.name,
    'kind', coalesce(p.kind, 'points'),
    -- the programme first, the profile only where the programme is silent
    'earn_per_currency', coalesce(p.earn_per_currency,
        (c.profile ->> 'loyalty_earn_pct')::numeric / 100.0, 0),
    'redeem_value', coalesce(p.redeem_value, (c.profile ->> 'loyalty_point_value')::numeric, 0),
    'stamps_required', coalesce(p.stamps_required, 0),
    'reward_product_id', p.reward_product_id,
    'base_tier', coalesce(p.base_tier_name, 'Bronze'),
    'tier_1', coalesce(p.tier_1_name, 'Silver'),
    'tier_2', coalesce(p.tier_2_name, 'Gold'),
    'tier_1_at', coalesce(p.tier_1_at, 500),
    'tier_2_at', coalesce(p.tier_2_at, 2000))
    from public.companies c
    left join public.loyalty_programs p
           on p.company_id = c.id and coalesce(p.is_active, true)
          and (p.starts_on is null or p.starts_on <= current_date)
          and (p.ends_on is null or p.ends_on >= current_date)
   where c.id = p_company
   order by p.created_at desc nulls last
   limit 1;
$fn$;
grant execute on function public.loyalty_rules(uuid) to authenticated;

-- @chunk
-- ------------------------------------------- what a sale does to the account
create or replace function public.loyalty_post(
  p_company uuid, p_partner uuid, p_order uuid, p_spend numeric,
  p_redeem_points numeric default 0, p_store uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  r jsonb; v_acc public.loyalty_accounts; v_aid uuid; v_earn numeric := 0; v_stamp int := 0;
  v_reward int := 0; v_tier text; v_spend numeric; v_redeem numeric;
begin
  if p_company is null or p_partner is null then return jsonb_build_object('ok', false, 'reason', 'no customer'); end if;
  if auth.uid() is not null and not public.can_write_app(p_company, '{pos,kitchen,sales,counter}'::text[]) then
    raise exception 'Your role cannot record loyalty. It needs Work in the till, Kitchen or Sales.';
  end if;
  r := public.loyalty_rules(p_company);
  v_spend := round(coalesce(p_spend, 0), 2);
  v_redeem := round(coalesce(p_redeem_points, 0), 2);

  select * into v_acc from public.loyalty_accounts where company_id = p_company and partner_id = p_partner;
  if v_acc.id is null then
    insert into public.loyalty_accounts (company_id, program_id, partner_id, points_balance, stamps_balance,
                                         tier, lifetime_spend, visits, joined_on, reward_due)
    values (p_company, (r ->> 'program_id')::uuid, p_partner, 0, 0, r ->> 'base_tier', 0, 0, current_date, 0)
    returning * into v_acc;
  end if;
  v_aid := v_acc.id;

  -- earning. A points programme earns per unit spent; a stamp card counts the
  -- visit rather than the money, which is the whole point of a stamp card.
  if (r ->> 'kind') = 'stamp' then
    v_stamp := case when v_spend > 0 then 1 else 0 end;
  else
    v_earn := floor(v_spend * coalesce((r ->> 'earn_per_currency')::numeric, 0));
  end if;

  if v_redeem > 0 then
    if v_redeem > coalesce(v_acc.points_balance, 0) + v_earn then
      raise exception 'That customer has % points, not %.', coalesce(v_acc.points_balance, 0), v_redeem;
    end if;
    insert into public.loyalty_transactions (company_id, account_id, store_id, kind, points, stamps, order_id, note)
    values (p_company, v_aid, p_store, 'redeem', -v_redeem, 0, p_order, 'Redeemed on a sale');
  end if;
  if v_earn > 0 then
    insert into public.loyalty_transactions (company_id, account_id, store_id, kind, points, stamps, order_id, note)
    values (p_company, v_aid, p_store, 'earn', v_earn, 0, p_order, 'Earned on ' || v_spend);
  end if;
  if v_stamp > 0 then
    insert into public.loyalty_transactions (company_id, account_id, store_id, kind, points, stamps, order_id, note)
    values (p_company, v_aid, p_store, 'stamp', 0, v_stamp, p_order, 'A stamp for the visit');
  end if;

  -- the card filling up. Every time it reaches the number, one reward falls due
  -- and the card starts again, so a customer who never claims does not lose them.
  if (r ->> 'kind') = 'stamp' and coalesce((r ->> 'stamps_required')::int, 0) > 0 then
    v_reward := (coalesce(v_acc.stamps_balance, 0) + v_stamp) / (r ->> 'stamps_required')::int;
  end if;

  v_tier := case
    when v_spend + coalesce(v_acc.lifetime_spend, 0) >= coalesce((r ->> 'tier_2_at')::numeric, 2000) then r ->> 'tier_2'
    when v_spend + coalesce(v_acc.lifetime_spend, 0) >= coalesce((r ->> 'tier_1_at')::numeric, 500) then r ->> 'tier_1'
    else r ->> 'base_tier' end;

  update public.loyalty_accounts
     set points_balance = coalesce(points_balance, 0) + v_earn - v_redeem,
         stamps_balance = case when v_reward > 0
                               then (coalesce(stamps_balance, 0) + v_stamp) - v_reward * (r ->> 'stamps_required')::int
                               else coalesce(stamps_balance, 0) + v_stamp end,
         reward_due = coalesce(reward_due, 0) + v_reward,
         lifetime_spend = coalesce(lifetime_spend, 0) + v_spend,
         visits = coalesce(visits, 0) + case when v_spend > 0 then 1 else 0 end,
         tier = v_tier,
         program_id = coalesce(program_id, (r ->> 'program_id')::uuid),
         last_activity_at = now()
   where id = v_aid;

  -- the contact keeps the same running total it always had, so the till, the
  -- customer screen and every report that reads it stay right
  update public.partners set loyalty_points = (select points_balance from public.loyalty_accounts where id = v_aid)
   where id = p_partner;

  return jsonb_build_object('ok', true, 'account', v_aid, 'kind', r ->> 'kind',
    'earned', v_earn, 'redeemed', v_redeem, 'stamps', v_stamp, 'reward_due', v_reward,
    'points_balance', (select points_balance from public.loyalty_accounts where id = v_aid),
    'stamps_balance', (select stamps_balance from public.loyalty_accounts where id = v_aid),
    'tier', v_tier, 'program', r ->> 'name');
end $fn$;
grant execute on function public.loyalty_post(uuid, uuid, uuid, numeric, numeric, uuid) to authenticated;

-- @chunk
-- ----------------------------------------------- and what a refund takes back
create or replace function public.loyalty_reverse(p_order uuid, p_note text default 'Refunded')
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_aid uuid; v_pts numeric := 0; v_stamps int := 0; v_cid uuid; v_partner uuid; v_rules jsonb; v_req int;
begin
  select account_id, company_id, coalesce(sum(points), 0), coalesce(sum(stamps), 0)
    into v_aid, v_cid, v_pts, v_stamps
    from public.loyalty_transactions
   where order_id = p_order and kind <> 'reverse'
   group by account_id, company_id
   limit 1;
  if v_aid is null then return jsonb_build_object('ok', true, 'reason', 'that sale earned nothing'); end if;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{pos,kitchen,sales,counter}'::text[]) then
    raise exception 'Your role cannot reverse loyalty. It needs Work in the till, Kitchen or Sales.';
  end if;
  if exists (select 1 from public.loyalty_transactions where order_id = p_order and kind = 'reverse') then
    return jsonb_build_object('ok', true, 'reason', 'already taken back');
  end if;

  -- exactly what that sale wrote, with the sign turned round. Recalculating it
  -- from today's rules would take back a different number whenever the rules
  -- have changed since.
  insert into public.loyalty_transactions (company_id, account_id, store_id, kind, points, stamps, order_id, note)
  values (v_cid, v_aid, null, 'reverse', -v_pts, -v_stamps, p_order, p_note);

  select partner_id into v_partner from public.loyalty_accounts where id = v_aid;
  v_rules := public.loyalty_rules(v_cid);
  v_req := coalesce((v_rules ->> 'stamps_required')::int, 0);
  update public.loyalty_accounts
     set points_balance = greatest(coalesce(points_balance, 0) - v_pts, 0),
         stamps_balance = greatest(coalesce(stamps_balance, 0) - v_stamps, 0),
         last_activity_at = now()
   where id = v_aid;
  update public.partners set loyalty_points = (select points_balance from public.loyalty_accounts where id = v_aid)
   where id = v_partner;
  return jsonb_build_object('ok', true, 'points', -v_pts, 'stamps', -v_stamps);
end $fn$;
grant execute on function public.loyalty_reverse(uuid, text) to authenticated;

-- Claiming a filled stamp card. The free item itself is rung up at the till at
-- zero, the same as any other giveaway, so the one thing this has to do is use
-- up the entitlement and leave a record that it was used.
create or replace function public.loyalty_claim_reward(p_account uuid, p_order uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_a public.loyalty_accounts;
begin
  select * into v_a from public.loyalty_accounts where id = p_account;
  if v_a.id is null then raise exception 'That loyalty account no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(v_a.company_id, '{pos,kitchen,sales,counter}'::text[]) then
    raise exception 'Your role cannot give out a reward. It needs Work in the till, Kitchen or Sales.';
  end if;
  if coalesce(v_a.reward_due, 0) < 1 then raise exception 'That card is not full yet.'; end if;
  insert into public.loyalty_transactions (company_id, account_id, kind, points, stamps, order_id, note)
  values (v_a.company_id, p_account, 'reward', 0, 0, p_order, 'A full card claimed');
  update public.loyalty_accounts set reward_due = coalesce(reward_due, 0) - 1, last_activity_at = now() where id = p_account;
  return jsonb_build_object('ok', true, 'reward_due', (select reward_due from public.loyalty_accounts where id = p_account));
end $fn$;
grant execute on function public.loyalty_claim_reward(uuid, uuid) to authenticated;

-- @chunk
-- ------------------------------------------------ the 12 accounts already here
-- loyalty_accounts was written by something that no longer exists, so the
-- balances on it and the running total on the contact may disagree. The rows
-- are real history and are kept; where an account has a balance the contact
-- does not, the contact is brought up to it, because the account is the one
-- with the transactions behind it.
update public.partners p
   set loyalty_points = a.points_balance
  from public.loyalty_accounts a
 where a.partner_id = p.id and a.company_id = p.company_id
   and coalesce(a.points_balance, 0) <> coalesce(p.loyalty_points, 0);

-- and every customer with points but no account gets one, so the new engine
-- has something to write against from the first sale
insert into public.loyalty_accounts (company_id, program_id, partner_id, points_balance, stamps_balance, tier, lifetime_spend, visits, joined_on)
select p.company_id,
       (select lp.id from public.loyalty_programs lp where lp.company_id = p.company_id and coalesce(lp.is_active, true) order by lp.created_at desc limit 1),
       p.id, coalesce(p.loyalty_points, 0), 0, 'Bronze', 0, 0, current_date
  from public.partners p
 where coalesce(p.loyalty_points, 0) <> 0
   and not exists (select 1 from public.loyalty_accounts a where a.company_id = p.company_id and a.partner_id = p.id);

-- base policies, under the names 190 and 191 generate, so a regeneration
-- replaces them rather than doubling them
do $pol$
declare t text;
begin
  foreach t in array array['loyalty_accounts', 'loyalty_transactions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.can_write_company(company_id)) with check (public.can_write_company(company_id))', t || '_rw', t);
    execute format('drop policy if exists ly_r on public.%I', t);
    execute format('create policy ly_r on public.%I for select to authenticated using (company_id in (select public.my_company_ids()))', t);
    execute format('drop policy if exists rg_sel on public.%I', t);
    execute format('drop policy if exists rg_ins on public.%I', t);
    execute format('drop policy if exists rg_upd on public.%I', t);
    execute format('drop policy if exists rg_del on public.%I', t);
    execute format('create policy rg_sel on public.%I as restrictive for select to authenticated using (company_id in (select public.my_view_company_ids(''{pos,kitchen,sales,counter}''::text[])))', t);
    execute format('create policy rg_ins on public.%I as restrictive for insert to authenticated with check (public.can_write_app(company_id, ''{pos,kitchen,sales,counter}''::text[]))', t);
    execute format('create policy rg_upd on public.%I as restrictive for update to authenticated using (public.can_write_app(company_id, ''{pos,kitchen,sales,counter}''::text[])) with check (public.can_write_app(company_id, ''{pos,kitchen,sales,counter}''::text[]))', t);
    execute format('create policy rg_del on public.%I as restrictive for delete to authenticated using (public.can_manage_app(company_id, ''{pos,kitchen,sales,counter}''::text[]))', t);
  end loop;
end $pol$;

select 'loyalty engine ready' as done,
       (select count(*) from public.loyalty_accounts) as accounts,
       (select count(*) from public.loyalty_transactions) as movements,
       (select count(*) from public.loyalty_programs where coalesce(is_active, true)) as live_programmes;
