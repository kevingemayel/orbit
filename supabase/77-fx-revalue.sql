-- ============================================================================
--  Spacework ERP  -  PERIOD-END FX REVALUATION (Phase 3)   AFTER 76
--  IAS 21 / ASC 830: at period end, open MONETARY balances denominated in a
--  foreign currency are restated to the closing rate, the movement recognised as
--  an UNREALIZED FX gain/loss.
--
--  fx_revalue(company, as_of_date):
--    * scope = monetary balance-sheet accounts only (reconcilable AR/AP, cash, or
--      any liability). Income/expense/equity/fixed/inventory are never touched.
--    * per (account, foreign currency):
--        net_fc   = open balance still in that foreign currency (sum amount_currency)
--        net_func = functional value CURRENTLY on the books      (sum debit-credit),
--                   already including any prior revaluation because those lines are
--                   tagged with the same foreign currency_code (amount_currency 0)
--        target   = fx_convert(net_fc -> functional @ closing on as_of_date)
--        adj      = target - net_func
--    * posts one balanced entry: each account moved by adj (currency_code = the
--      foreign ccy, amount_currency 0 so the FC balance is unchanged), net counter
--      to unrealized FX gain (7660) / loss (6660).
--    * self-reversing & idempotent: when an item settles net_fc -> 0, so target -> 0
--      and the next run posts adj = -(prior revaluation) = a full reversal. Re-running
--      on the same rate posts nothing.
--  Realized FX at settlement is unaffected: register_payment relieves at the
--  invoice's OWN entry rate; revaluation lives in a separate entry.
-- ============================================================================

create or replace function public.fx_revalue(p_company uuid, p_date date default current_date)
returns jsonb language plpgsql security definer set search_path=public as $fn$
declare cid uuid:=p_company; oid uuid; co_ccy text; jrn uuid; eid uuid;
  fx_gain uuid; fx_loss uuid; total_adj numeric; nlines int;
begin
  if auth.uid() is not null and not public.can_write_company(cid) then raise exception 'not allowed'; end if;
  select currency_code, org_id, fx_gain_account_id, fx_loss_account_id
    into co_ccy, oid, fx_gain, fx_loss from public.companies where id=cid;
  if co_ccy is null then raise exception 'company not found'; end if;
  if fx_gain is null or fx_loss is null then raise exception 'set the FX gain/loss accounts in company settings first'; end if;
  jrn := coalesce(
    (select id from public.journals where company_id=cid and code='MISC'),
    (select id from public.journals where company_id=cid and code='OD'),
    (select id from public.journals where company_id=cid order by code limit 1));
  if jrn is null then raise exception 'no journal available'; end if;

  insert into public.journal_entries(company_id,journal_id,date,ref,narration,currency_code,state,source_type,source_id)
    values (cid,jrn,p_date,'FX-REVAL '||to_char(p_date,'YYYY-MM-DD'),
            'Unrealized FX revaluation '||to_char(p_date,'YYYY-MM-DD'),co_ccy,'draft','fx_revaluation',p_date::text)
    returning id into eid;

  insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code)
  select eid, cid, t.account_id, 'FX revaluation '||t.ccy,
         case when t.adj>0 then t.adj else 0 end,
         case when t.adj<0 then -t.adj else 0 end,
         0, t.ccy
  from (
    select g.account_id, g.ccy,
           round(public.fx_convert(oid, g.net_fc, g.ccy, co_ccy, p_date, 'closing'),2) - round(g.net_func,2) as adj
    from (
      select jl.account_id, jl.currency_code as ccy,
             sum(jl.debit)-sum(jl.credit) as net_func,
             sum(coalesce(jl.amount_currency,0)) as net_fc
      from public.journal_lines jl
      join public.journal_entries je on je.id=jl.entry_id
      join public.accounts a on a.id=jl.account_id
      where jl.company_id=cid
        and je.state='posted' and je.date<=p_date
        and jl.currency_code is not null and upper(jl.currency_code)<>upper(co_ccy)
        and (a.reconcilable or a.type_code='asset_cash' or a.type_code like 'liability%')
      group by jl.account_id, jl.currency_code
    ) g
  ) t
  where abs(t.adj) > 0.005;
  get diagnostics nlines = row_count;

  if nlines = 0 then
    delete from public.journal_entries where id=eid;
    return jsonb_build_object('status','no_change','date',p_date,'company',cid);
  end if;

  select coalesce(sum(debit)-sum(credit),0) into total_adj from public.journal_lines where entry_id=eid;
  if total_adj > 0.005 then
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code)
      values (eid,cid,fx_gain,'Unrealized FX gain',0,total_adj,0,co_ccy);
  elsif total_adj < -0.005 then
    insert into public.journal_lines(entry_id,company_id,account_id,label,debit,credit,amount_currency,currency_code)
      values (eid,cid,fx_loss,'Unrealized FX loss',-total_adj,0,0,co_ccy);
  end if;

  perform public.post_entry(eid);
  return jsonb_build_object('status','posted','entry',eid,'date',p_date,'lines',nlines,
    'net',round(total_adj,2),'functional',co_ccy);
end; $fn$;
grant execute on function public.fx_revalue(uuid,date) to authenticated;

select 'fx_revalue ready' as done;
