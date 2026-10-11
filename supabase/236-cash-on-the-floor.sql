-- 236: cash on the floor. Drops to the safe, and tips that reach the staff.
--
-- Two tables had rows in them that no screen could show and no figure could
-- read. 52 cash drops and the tip pools behind a shift's tips, both written by
-- something that no longer exists.
--
-- Why it matters, in one sentence each:
--
--   A cash drop is money taken out of the drawer and put in the safe, which
--   every busy till does two or three times a day so there is never a day's
--   takings sitting in an open drawer. If the close does not know about the
--   drops, the drawer counts short by exactly what was dropped, and a night's
--   real cash variance cannot be told apart from a drop nobody deducted.
--
--   Tips taken on card are the company's money until they are handed over, so
--   they are a liability, not income. They were posting to the suppliers
--   control account, which is where you look for what you owe suppliers. Tips
--   now have their own account, a pool can pull what was actually taken over a
--   period, split it by hours worked, points or evenly, and paying it out is a
--   posting rather than a note.
--
-- What is deliberately not automated: the cash tips staff declare. Nothing in
-- any till knows what went into a jar, so that figure is typed, and the screen
-- says so.

-- ---------------------------------------------------------- 1. the two accounts
alter table public.companies add column if not exists tips_payable_account_id uuid references public.accounts(id) on delete set null;

create or replace function public.company_account(p_company uuid, p_kind text)
returns uuid language sql stable security definer set search_path = public as $ca$
  select coalesce(
    (select case p_kind
              when 'receivable'         then c.receivable_account_id
              when 'payable'            then c.payable_account_id
              when 'sale_tax'           then c.sale_tax_account_id
              when 'purchase_tax'       then c.purchase_tax_account_id
              when 'income'             then c.income_account_id
              when 'expense'            then c.expense_account_id
              when 'cheques_receivable' then c.cheques_receivable_account_id
              when 'cheques_payable'    then c.cheques_payable_account_id
              when 'tips_payable'       then c.tips_payable_account_id
              when 'salary_payable'     then c.salary_payable_account_id
            end
       from public.companies c where c.id = p_company),
    (select a.id from public.accounts a
      where a.company_id = p_company
        and a.code = case p_kind
                       when 'receivable' then '4100' when 'payable' then '4000'
                       when 'sale_tax' then '4457' when 'purchase_tax' then '4456'
                       when 'income' then '7000' when 'expense' then '6000'
                       when 'cheques_receivable' then '5113' when 'cheques_payable' then '4030'
                       when 'tips_payable' then '4280'
                     end
      limit 1));
$ca$;
grant execute on function public.company_account(uuid, text) to authenticated;

insert into public.accounts (company_id, code, name, type_code, reconcilable, is_active)
select c.id, '4280', 'Tips owed to staff', 'liability_current', false, true
  from public.companies c
 where not exists (select 1 from public.accounts a where a.company_id = c.id and a.code = '4280');
update public.companies c set tips_payable_account_id = coalesce(c.tips_payable_account_id,
  (select a.id from public.accounts a where a.company_id = c.id and a.code = '4280' limit 1));

-- the till posted tips to the suppliers control account, which is where you look
-- for what you owe suppliers. Rewriting the lookup in place is the same trick
-- 171 used on the payment functions: the rest of the posting is untouched.
do $rewrite$
declare d text; marker text := 'tip_acc   := public.company_account(cid, ''payable'');';
begin
  select pg_get_functiondef(p.oid) into d
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'post_pos_orders';
  if d is null then raise exception 'post_pos_orders is missing - run 229 first'; end if;
  if position(marker in d) = 0 then
    if position('tips_payable' in d) > 0 then return; end if;   -- already rewritten
    raise exception 'post_pos_orders no longer has the tip account lookup this migration rewrites';
  end if;
  d := replace(d, marker,
    'tip_acc   := coalesce(public.company_account(cid, ''tips_payable''), public.company_account(cid, ''payable''));');
  execute d;
end $rewrite$;

-- @chunk
-- ------------------------------------------------------------- 2. a cash drop
alter table public.cash_drops
  add column if not exists from_account_id uuid references public.cash_accounts(id) on delete set null,
  add column if not exists to_account_id uuid references public.cash_accounts(id) on delete set null,
  add column if not exists currency_code text,
  add column if not exists reference text,
  add column if not exists entry_id uuid references public.journal_entries(id) on delete set null,
  add column if not exists posted_at timestamptz,
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists created_at timestamptz default now();
create index if not exists cash_drops_session_idx on public.cash_drops (session_id);
create index if not exists cash_drops_company_idx on public.cash_drops (company_id, dropped_at);

-- A drop between two cash accounts is a real movement and posts. Where a
-- company keeps one cash account, the till and the safe are the same line in
-- the ledger and there is nothing to post: the drop is still recorded, because
-- the drawer count depends on it, and the function says so by returning null.
create or replace function public.cash_drop_post(p_drop uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_d public.cash_drops; v_cid uuid; v_from uuid; v_to uuid; v_jrn uuid; v_eid uuid; v_ccy text; v_when date;
begin
  select * into v_d from public.cash_drops where id = p_drop;
  if v_d.id is null then raise exception 'That drop no longer exists.'; end if;
  v_cid := v_d.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{counter,pos,kitchen}'::text[]) then
    raise exception 'Your role cannot record a cash drop. It needs Work in Counter, the till or Kitchen.';
  end if;
  if v_d.posted_at is not null then raise exception 'This drop is already in the books.'; end if;
  if coalesce(v_d.amount, 0) <= 0 then raise exception 'A drop needs an amount.'; end if;
  v_when := coalesce(v_d.dropped_at, now())::date;
  select a.gl_account_id into v_from from public.cash_accounts a where a.id = v_d.from_account_id and a.company_id = v_cid;
  select a.gl_account_id into v_to from public.cash_accounts a where a.id = v_d.to_account_id and a.company_id = v_cid;
  if v_from is null or v_to is null or v_from = v_to then
    update public.cash_drops set posted_at = now() where id = p_drop;
    return null;
  end if;
  select currency_code into v_ccy from public.companies where id = v_cid;
  select id into v_jrn from public.journals where company_id = v_cid and code = 'CSH';
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid and code = 'BNK'; end if;
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid order by code limit 1; end if;
  if v_jrn is null then raise exception 'This company has no journal to post a cash drop through.'; end if;
  insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
  values (v_cid, v_jrn, v_when, coalesce(v_d.reference, 'Cash drop'),
          'Cash drop to the safe' || coalesce(' by ' || v_d.dropped_by, ''), v_ccy, 'draft', 'cash_drop', p_drop::text)
  returning id into v_eid;
  insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
  values (v_eid, v_cid, v_to, 'Cash drop in', v_d.amount, 0, v_d.amount, v_ccy);
  insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
  values (v_eid, v_cid, v_from, 'Cash drop out', 0, v_d.amount, -v_d.amount, v_ccy);
  perform public.post_entry(v_eid);
  update public.cash_drops set entry_id = v_eid, posted_at = now() where id = p_drop;
  return v_eid;
end $fn$;
grant execute on function public.cash_drop_post(uuid) to authenticated;

-- The whole reason the drops matter: what the drawer should hold at close is
-- what came in, less what was taken out of it during the shift.
create or replace function public.session_drawer(p_session uuid)
returns table (currency_code text, expected numeric)
language sql
stable
set search_path to 'public'
as $sd$
  with took as (
    select coalesce(p.currency_code, c.currency_code) as ccy,
           sum(coalesce(p.amount_ccy, p.amount)) as amt
      from public.pos_payments p
      join public.pos_orders o on o.id = p.order_id
      join public.companies c on c.id = p.company_id
     where o.session_id = p_session and p.method in ('cash', 'change')
     group by 1),
  dropped as (
    select coalesce(d.currency_code, c.currency_code) as ccy, sum(coalesce(d.amount, 0)) as amt
      from public.cash_drops d
      join public.companies c on c.id = d.company_id
     where d.session_id = p_session
     group by 1)
  select ccy, round(sum(amt), 2) as expected
    from (select ccy, amt from took
          union all
          select ccy, -amt from dropped) x
   group by ccy
  having round(sum(amt), 2) <> 0
   order by ccy;
$sd$;
grant execute on function public.session_drawer(uuid) to authenticated;

-- @chunk
-- ------------------------------------------------------------- 3. a tip pool
alter table public.tip_pools
  add column if not exists share_service_charge boolean default true,
  add column if not exists paid_on date,
  add column if not exists paid_via text,
  add column if not exists entry_id uuid references public.journal_entries(id) on delete set null,
  add column if not exists created_by uuid default auth.uid();
alter table public.tip_allocations
  add column if not exists note text;
create index if not exists tip_allocations_pool_idx on public.tip_allocations (pool_id);

-- What the till actually took over the period. The cash jar is not in here
-- because nothing in any till knows what went into it: that figure is declared.
create or replace function public.tip_pool_pull(p_pool uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_p public.tip_pools; v_card numeric := 0; v_svc numeric := 0;
begin
  select * into v_p from public.tip_pools where id = p_pool;
  if v_p.id is null then raise exception 'That tip pool no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(v_p.company_id, '{employees,kitchen,pos,counter}'::text[]) then
    raise exception 'Your role cannot work on a tip pool. It needs Work in People, Kitchen or the till.';
  end if;
  if coalesce(v_p.status, '') = 'paid' then raise exception 'This pool has been paid out. Start a new one.'; end if;

  select coalesce(sum(coalesce(p.tip_amount, 0)), 0) into v_card
    from public.pos_payments p
    join public.pos_orders o on o.id = p.order_id
   where o.company_id = v_p.company_id
     and o.status = 'paid'
     and (v_p.store_id is null or o.store_id = v_p.store_id)
     and o.created_at::date between v_p.period_start and v_p.period_end
     and coalesce(p.method, '') <> 'cash';
  select coalesce(sum(coalesce(o.service_charge, 0)), 0) into v_svc
    from public.pos_orders o
   where o.company_id = v_p.company_id
     and o.status = 'paid'
     and (v_p.store_id is null or o.store_id = v_p.store_id)
     and o.created_at::date between v_p.period_start and v_p.period_end;

  update public.tip_pools
     set card_tips = round(v_card, 2), service_charge = round(v_svc, 2),
         status = case when coalesce(status, 'draft') = 'draft' then 'draft' else status end
   where id = p_pool;
  return jsonb_build_object('ok', true, 'card_tips', round(v_card, 2), 'service_charge', round(v_svc, 2));
end $fn$;
grant execute on function public.tip_pool_pull(uuid) to authenticated;

-- Splitting it. Hours worked is the usual rule and the only one a till can
-- fill in by itself, so an empty pool is seeded from the hours actually
-- clocked in the period. Points are for a house that weights a chef above a
-- runner, and are typed.
create or replace function public.tip_pool_allocate(p_pool uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_p public.tip_pools; v_total numeric; v_base numeric; v_n int; v_seeded int := 0;
begin
  select * into v_p from public.tip_pools where id = p_pool;
  if v_p.id is null then raise exception 'That tip pool no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(v_p.company_id, '{employees,kitchen,pos,counter}'::text[]) then
    raise exception 'Your role cannot work on a tip pool. It needs Work in People, Kitchen or the till.';
  end if;
  if coalesce(v_p.status, '') = 'paid' then raise exception 'This pool has been paid out and cannot be split again.'; end if;

  v_total := round(coalesce(v_p.card_tips, 0) + coalesce(v_p.cash_tips_declared, 0)
                   + case when coalesce(v_p.share_service_charge, true) then coalesce(v_p.service_charge, 0) else 0 end, 2);
  if v_total <= 0 then raise exception 'There is nothing in this pool yet. Pull the takings, or declare the cash tips.'; end if;

  select count(*) into v_n from public.tip_allocations where pool_id = p_pool;
  if v_n = 0 then
    insert into public.tip_allocations (company_id, pool_id, employee_id, hours, points, amount)
    select v_p.company_id, p_pool, a.employee_id,
           round(sum(coalesce(a.worked_hours, 0)), 2), 1, 0
      from public.hr_attendances a
     where a.company_id = v_p.company_id
       and (v_p.store_id is null or a.store_id = v_p.store_id)
       and a.check_in::date between v_p.period_start and v_p.period_end
       and a.employee_id is not null
     group by a.employee_id
    having round(sum(coalesce(a.worked_hours, 0)), 2) > 0;
    v_seeded := (select count(*) from public.tip_allocations where pool_id = p_pool);
    if v_seeded = 0 then
      raise exception 'Nobody has hours clocked in this period. Add the people who worked it, with their hours, and split again.';
    end if;
  end if;

  if coalesce(v_p.method, 'hours') = 'points' then
    select coalesce(sum(coalesce(points, 0)), 0) into v_base from public.tip_allocations where pool_id = p_pool;
    if v_base <= 0 then raise exception 'This pool splits by points and nobody has any. Give each person their points, or split by hours.'; end if;
    update public.tip_allocations set amount = round(v_total * coalesce(points, 0) / v_base, 2) where pool_id = p_pool;
  elsif coalesce(v_p.method, 'hours') = 'equal' then
    select count(*) into v_n from public.tip_allocations where pool_id = p_pool;
    update public.tip_allocations set amount = round(v_total / v_n, 2) where pool_id = p_pool;
  else
    select coalesce(sum(coalesce(hours, 0)), 0) into v_base from public.tip_allocations where pool_id = p_pool;
    if v_base <= 0 then raise exception 'This pool splits by hours and nobody has any. Enter the hours each person worked, or split evenly.'; end if;
    update public.tip_allocations set amount = round(v_total * coalesce(hours, 0) / v_base, 2) where pool_id = p_pool;
  end if;

  -- rounding has to land somewhere, and the honest place is the largest share
  update public.tip_allocations t
     set amount = t.amount + (v_total - (select sum(amount) from public.tip_allocations where pool_id = p_pool))
   where t.id = (select id from public.tip_allocations where pool_id = p_pool order by amount desc, id limit 1)
     and abs(v_total - (select sum(amount) from public.tip_allocations where pool_id = p_pool)) > 0.004;

  update public.tip_pools set status = 'allocated' where id = p_pool;
  return jsonb_build_object('ok', true, 'total', v_total, 'people', (select count(*) from public.tip_allocations where pool_id = p_pool),
                            'seeded', v_seeded, 'method', coalesce(v_p.method, 'hours'));
end $fn$;
grant execute on function public.tip_pool_allocate(uuid) to authenticated;

-- @chunk
-- ------------------------------------------------- 4. and the staff are paid
create or replace function public.tip_pool_post(p_pool uuid, p_via text default 'cash', p_cash_account uuid default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_p public.tip_pools; v_cid uuid; v_tips uuid; v_other uuid; v_total numeric; v_jrn uuid; v_eid uuid; v_ccy text; v_date date; l record;
begin
  select * into v_p from public.tip_pools where id = p_pool;
  if v_p.id is null then raise exception 'That tip pool no longer exists.'; end if;
  v_cid := v_p.company_id;
  if auth.uid() is not null and not public.can_write_app(v_cid, '{employees,kitchen,pos,counter}'::text[]) then
    raise exception 'Your role cannot pay out a tip pool. It needs Work in People, Kitchen or the till.';
  end if;
  if coalesce(v_p.status, '') = 'paid' then raise exception 'This pool has already been paid out.'; end if;
  select round(coalesce(sum(coalesce(amount, 0)), 0), 2) into v_total from public.tip_allocations where pool_id = p_pool;
  if v_total <= 0 then raise exception 'Split the pool before paying it out.'; end if;

  v_tips := public.company_account(v_cid, 'tips_payable');
  if v_tips is null then raise exception 'This company has no tips account. Set one in Settings, Companies, Accounting accounts.'; end if;

  if p_via = 'payroll' then
    v_other := public.company_account(v_cid, 'salary_payable');
    if v_other is null then raise exception 'This company has no salaries payable account, so tips cannot go through payroll. Pay them in cash, or set the account.'; end if;
  else
    if p_cash_account is not null then
      select a.gl_account_id into v_other from public.cash_accounts a where a.id = p_cash_account and a.company_id = v_cid;
      if v_other is null then
        select a.id into v_other from public.accounts a where a.id = p_cash_account and a.company_id = v_cid;
      end if;
      if v_other is null then raise exception 'That cash account does not belong to this company.'; end if;
    else
      select j.default_account_id into v_other from public.journals j where j.company_id = v_cid and j.code = 'CSH';
      if v_other is null then select a.id into v_other from public.accounts a where a.company_id = v_cid and a.code = '5300' limit 1; end if;
      if v_other is null then select a.id into v_other from public.accounts a where a.company_id = v_cid and a.code = '5100' limit 1; end if;
    end if;
    if v_other is null then raise exception 'Choose the till or the account the tips are being paid out of.'; end if;
  end if;

  select currency_code into v_ccy from public.companies where id = v_cid;
  v_date := coalesce(v_p.period_end, current_date);
  select id into v_jrn from public.journals where company_id = v_cid and code = case when p_via = 'payroll' then 'MISC' else 'CSH' end;
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid and type = 'general' order by code limit 1; end if;
  if v_jrn is null then select id into v_jrn from public.journals where company_id = v_cid order by code limit 1; end if;
  if v_jrn is null then raise exception 'This company has no journal to post a tip payout through.'; end if;

  insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
  values (v_cid, v_jrn, v_date, 'Tips ' || to_char(v_p.period_start, 'DD Mon') || ' to ' || to_char(v_p.period_end, 'DD Mon YYYY'),
          'Tip pool paid out to ' || (select count(*) from public.tip_allocations where pool_id = p_pool) || ' people',
          v_ccy, 'draft', 'tip_pool', p_pool::text)
  returning id into v_eid;
  -- one line per person on the tips side, so the ledger names who was paid what
  for l in select t.*, e.name from public.tip_allocations t
             left join public.hr_employees e on e.id = t.employee_id
            where t.pool_id = p_pool and coalesce(t.amount, 0) <> 0 order by t.amount desc
  loop
    insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
    values (v_eid, v_cid, v_tips, 'Tips to ' || coalesce(l.name, 'a member of staff'), l.amount, 0, l.amount, v_ccy);
  end loop;
  insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
  values (v_eid, v_cid, v_other, case when p_via = 'payroll' then 'Tips added to the payroll' else 'Tips paid out in cash' end,
          0, v_total, -v_total, v_ccy);
  perform public.post_entry(v_eid);
  update public.tip_pools set status = 'paid', paid_on = current_date, paid_via = coalesce(p_via, 'cash'), entry_id = v_eid
   where id = p_pool;
  return v_eid;
end $fn$;
grant execute on function public.tip_pool_post(uuid, text, uuid) to authenticated;

select 'cash drops and tip pools ready' as done,
       (select count(*) from public.accounts where code = '4280') as tip_accounts,
       (select count(*) from public.cash_drops) as drops,
       (select count(*) from public.tip_pools) as pools;
