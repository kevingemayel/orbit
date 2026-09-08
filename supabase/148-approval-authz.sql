-- ============================================================================
-- 148-approval-authz.sql  -  make an approval mean something.
--
-- The rule names an approver. The email link is correctly bound to that one
-- person. The IN-APP path was not: the approvals table had a single write
-- policy, can_write_company(company_id), for every command. So anyone who
-- could raise a purchase order could also approve it, whoever the rule named,
-- and the inbox showed every pending item to everybody.
--
-- An approval control that anyone can wave through is worse than none, because
-- the audit trail says a named person signed it off.
--
-- After this:
--   * anyone who can write may REQUEST an approval (that is just raising a doc)
--   * only the NAMED APPROVER, an org owner/admin, or anyone at all when the
--     rule names nobody, may decide it
--   * only an org owner/admin may delete one
--   * the requester may withdraw their own pending request
--
-- Enforced in the database, not in the browser, so it holds for the REST API
-- and for anyone with the anon key and a text editor.
--
-- Safe to re-run.
-- ============================================================================

-- Who am I, as an employee of this company? The link is hr_employees.user_id.
create or replace function public.my_employee_id(p_company uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select e.id from public.hr_employees e
   where e.company_id = p_company and e.user_id = auth.uid()
     and coalesce(e.is_active, true)
   limit 1;
$$;

-- May I decide this particular approval?
create or replace function public.can_decide_approval(p_approval uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.approvals a
      left join public.approval_rules r on r.id = a.rule_id
     where a.id = p_approval
       and a.company_id in (select public.my_company_ids())
       and (
         -- the rule names nobody, so any member of the company may sign it off
         r.approver_employee_id is null
         -- or it names me
         or exists (select 1 from public.hr_employees e
                     where e.id = r.approver_employee_id and e.user_id = auth.uid())
         -- or I run the place
         or public.can_manage_team((select c.org_id from public.companies c where c.id = a.company_id))
       )
  );
$$;

-- Is this approval waiting on ME? Used by the inbox so that Awaiting you is
-- true rather than decorative.
create or replace function public.approval_is_mine(p_approval uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.approvals a
      left join public.approval_rules r on r.id = a.rule_id
     where a.id = p_approval and a.status = 'pending'
       and (r.approver_employee_id is null
            or exists (select 1 from public.hr_employees e
                        where e.id = r.approver_employee_id and e.user_id = auth.uid()))
  );
$$;

grant execute on function public.my_employee_id(uuid) to authenticated;
grant execute on function public.can_decide_approval(uuid) to authenticated;
grant execute on function public.approval_is_mine(uuid) to authenticated;

-- ---------------------------------------------------------------- policies
-- Replace the single catch-all write policy with one per command. Note that
-- multiple permissive policies OR together, so each command gets exactly one.
drop policy if exists approvals_w on public.approvals;
drop policy if exists approvals_ins on public.approvals;
drop policy if exists approvals_upd on public.approvals;
drop policy if exists approvals_del on public.approvals;

-- Requesting is not deciding: raising a document may create the request.
create policy approvals_ins on public.approvals
  for insert to authenticated
  with check (public.can_write_company(company_id) and status = 'pending');

-- Deciding is the controlled act. A requester may also withdraw their own
-- request while it is still pending, which is not a sign-off.
create policy approvals_upd on public.approvals
  for update to authenticated
  using (
    public.can_decide_approval(id)
    or (status = 'pending' and requested_by = coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    public.can_decide_approval(id)
    or (status in ('pending', 'withdrawn') and requested_by = coalesce(auth.jwt() ->> 'email', ''))
  );

create policy approvals_del on public.approvals
  for delete to authenticated
  using (public.can_manage_team((select c.org_id from public.companies c where c.id = approvals.company_id)));

-- Record who actually decided, from the token rather than from the browser.
create or replace function public.approval_decide(p_approval uuid, p_decision text, p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare a public.approvals%rowtype;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected';
  end if;
  select * into a from public.approvals where id = p_approval;
  if not found then return 'not found'; end if;
  if a.status <> 'pending' then return 'already ' || a.status; end if;
  if not public.can_decide_approval(p_approval) then
    return 'not yours to decide';
  end if;
  update public.approvals
     set status = p_decision,
         approver_note = nullif(p_note, ''),
         decided_by = coalesce(auth.jwt() ->> 'email', 'unknown'),
         decided_at = now()
   where id = p_approval;
  return 'ok';
end $$;

grant execute on function public.approval_decide(uuid, text, text) to authenticated;

-- An index for the inbox, which reads pending-by-company on every open.
create index if not exists approvals_pending_idx
  on public.approvals (company_id, status, created_at desc);
