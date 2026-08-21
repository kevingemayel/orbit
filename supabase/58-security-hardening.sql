-- ============================================================================
--  Spacework ERP  -  GO-LIVE SECURITY HARDENING  (run AFTER 57)
--  Two SECURITY DEFINER functions returned another tenant's data with no
--  caller-authorization check. Both are locked down here.
-- ============================================================================

-- 1) trial_balance -----------------------------------------------------------
--    Was: any authenticated (or anon) caller could read ANY company's full
--    account balances just by passing its id. Now the caller must be a member
--    of that company's org (or a platform admin). Legit app calls only ever
--    pass a company the user already belongs to, so nothing breaks.
create or replace function public.trial_balance(p_company uuid, p_date date default current_date)
returns table(code text, name text, type_code text, debit numeric, credit numeric, balance numeric)
language sql stable security definer set search_path=public as $$
  select a.code, a.name, a.type_code,
         coalesce(sum(l.debit),0), coalesce(sum(l.credit),0),
         coalesce(sum(l.debit),0) - coalesce(sum(l.credit),0)
  from public.accounts a
  left join public.journal_lines l on l.account_id = a.id
       and l.company_id = p_company
       and exists (select 1 from public.journal_entries e where e.id=l.entry_id and e.state='posted' and e.date<=p_date)
  where a.company_id = p_company
    and (p_company in (select public.my_company_ids()) or public.is_platform_admin())
  group by a.code, a.name, a.type_code
  order by a.code;
$$;
revoke execute on function public.trial_balance(uuid,date) from anon, public;
grant  execute on function public.trial_balance(uuid,date) to authenticated;

-- 2) event_people_emails -----------------------------------------------------
--    Only the reminder scheduler needs this, and that runs as a SECURITY
--    DEFINER function (owner), which can call it regardless of grants. No
--    client should be able to read event participants' emails, so drop the
--    default PUBLIC grant and the earlier authenticated grant.
revoke execute on function public.event_people_emails(uuid) from public, anon, authenticated;

select 'security hardening ready' as done;
