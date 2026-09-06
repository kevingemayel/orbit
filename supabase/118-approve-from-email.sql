-- ============================================================================
-- 118-approve-from-email.sql  -  One-click Approve / Reject from an email.
--
-- Shape follows rsvp_respond (54-events-public.sql): a token in the link plus
-- SECURITY DEFINER RPCs granted to anon. Approvals move money, so it is
-- hardened past that precedent, the way 63-event-collab-bind and
-- 115-report-scheduler-rpc hardened theirs:
--   * only the SHA-256 of the token is stored, never the token itself, so a
--     database read (or an old backup) cannot forge a working link - the same
--     trick api_keys already uses for API credentials
--   * 32 random bytes, and the RPCs refuse anything that is not 64 hex chars
--   * expires after 14 days
--   * single use: a decided approval is refused, so a forwarded email cannot be
--     replayed. The hash is deliberately KEPT after the decision so that an
--     approver who clicks their email twice - which they will - gets "already
--     approved by you on Tuesday" instead of a dead link. It stays a read
--     handle on facts the email already showed them, and expiry still ends it.
--   * the decision is recorded against the approver address the token was
--     minted for, so the audit trail names a person
--
-- Semantics match the in-app button exactly (decideApproval, js/app.js:2126):
-- deciding sets the approvals row and notifies; it does NOT post the document.
-- The requester still re-triggers the action, and approvalGate then lets it
-- through. Approving by email must not do more than approving in the app.
--
-- Safe to re-run.
-- ============================================================================

alter table public.approvals add column if not exists decide_token_hash text;
alter table public.approvals add column if not exists token_expires_at timestamptz;
alter table public.approvals add column if not exists approver_email text;
alter table public.approvals add column if not exists notified_at timestamptz;

create unique index if not exists idx_approvals_token on public.approvals(decide_token_hash) where decide_token_hash is not null;

-- ---------------------------------------------------------------------------
-- Mint a decision token and hand the raw value back exactly once, to the
-- Cloudflare function that is about to put it in an email. SECURITY INVOKER on
-- purpose: RLS still decides whether this caller may touch this approval.
-- Re-sending mints a fresh token, so only the newest email works.
-- ---------------------------------------------------------------------------
create or replace function public.mint_approval_token(p_id uuid)
returns jsonb language plpgsql security invoker set search_path = public, extensions as $fn$
declare a record; em text; comp text; cur text; rname text; raw text;
begin
  select * into a from public.approvals where id = p_id;
  if not found then return jsonb_build_object('error','not found'); end if;
  if a.status is distinct from 'pending' then
    return jsonb_build_object('status', a.status, 'error', 'already decided');
  end if;

  select c.name, c.currency_code into comp, cur from public.companies c where c.id = a.company_id;
  select r.name, e.work_email into rname, em
    from public.approval_rules r
    left join public.hr_employees e on e.id = r.approver_employee_id
   where r.id = a.rule_id;

  -- A rule with no named approver has nobody to email; fall back to whoever runs
  -- the company, preferring an owner over an admin over anyone else. Membership
  -- is org_members scoped by company_ids, exactly as my_company_ids() reads it.
  if em is null or em = '' then
    select u.email into em
      from public.org_members m
      join public.companies c on c.org_id = m.org_id
      join auth.users u on u.id = m.user_id
     where c.id = a.company_id
       and coalesce(m.status,'active') = 'active'
       and (m.company_ids is null or array_length(m.company_ids,1) is null or c.id = any(m.company_ids))
     order by case lower(coalesce(m.role,''))
                when 'owner' then 1 when 'admin' then 2 else 3 end, m.created_at, u.email
     limit 1;
  end if;

  raw := encode(gen_random_bytes(32), 'hex');
  update public.approvals
     set decide_token_hash = encode(digest(raw, 'sha256'), 'hex'),
         token_expires_at = now() + interval '14 days',
         approver_email = em
   where id = p_id;

  return jsonb_build_object(
    'token', raw, 'status', a.status, 'approver_email', em,
    'doc_type', a.doc_type, 'doc_number', a.doc_number, 'doc_amount', a.doc_amount,
    'requested_by', a.requested_by, 'company_name', comp, 'currency_code', cur, 'rule_name', rname);
end $fn$;

-- ---------------------------------------------------------------------------
-- What the public page may see. Readable by whoever holds the link and nobody
-- else, and it returns only what the email already told them.
-- ---------------------------------------------------------------------------
create or replace function public.approval_lookup(p_token text)
returns table (doc_type text, doc_number text, doc_amount numeric, requested_by text,
               status text, decided_by text, decided_at timestamptz, created_at timestamptz,
               company_name text, currency_code text, rule_name text, approver_email text, expired boolean)
language sql stable security definer set search_path = public, extensions as $fn$
  select a.doc_type, a.doc_number, a.doc_amount, a.requested_by,
         a.status, a.decided_by, a.decided_at, a.created_at,
         c.name, c.currency_code, r.name, a.approver_email,
         (a.token_expires_at is not null and a.token_expires_at < now())
    from public.approvals a
    left join public.companies c on c.id = a.company_id
    left join public.approval_rules r on r.id = a.rule_id
   where p_token is not null and p_token ~ '^[0-9a-f]{64}$'
     and a.decide_token_hash = encode(digest(p_token, 'sha256'), 'hex');
$fn$;

-- ---------------------------------------------------------------------------
-- Record the decision. Writes exactly the columns decideApproval writes, and
-- drops the same approval_result notification, so an email decision and an
-- in-app decision are indistinguishable afterwards apart from decided_by.
-- ---------------------------------------------------------------------------
create or replace function public.approval_decide(p_token text, p_decision text, p_note text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $fn$
declare a record; who text; note text; lbl text;
begin
  if p_decision not in ('approved','rejected') then
    return jsonb_build_object('ok', false, 'reason', 'bad decision');
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'reason', 'bad token');
  end if;

  select * into a from public.approvals
   where decide_token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if not found then return jsonb_build_object('ok', false, 'reason', 'not found'); end if;
  if a.status is distinct from 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'already', 'status', a.status);
  end if;
  if a.token_expires_at is not null and a.token_expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  who := coalesce(nullif(a.approver_email,''), 'email link');
  note := nullif(btrim(coalesce(p_note,'')), '');
  lbl := coalesce(nullif(a.doc_number,''), a.doc_type, 'request');

  -- The hash is kept (see the header): the status check above is what makes this
  -- single-use, and keeping it lets a second click show a proper answer.
  update public.approvals
     set status = p_decision,
         decided_by = who,
         decided_at = now(),
         approver_note = coalesce(note, '')
   where id = a.id;

  insert into public.notifications (company_id, kind, title, body, link_action, link_id, actor_name, dedupe_key)
  values (a.company_id, 'approval_result',
          (case when p_decision = 'approved' then 'Approved: ' else 'Rejected: ' end) || lbl,
          coalesce(note, 'Decided by email.'),
          a.link_action, a.doc_id, who, 'appr-' || a.id::text || '-' || p_decision)
  on conflict do nothing;

  return jsonb_build_object('ok', true, 'status', p_decision);
end $fn$;

revoke all on function public.mint_approval_token(uuid) from public, anon;
grant execute on function public.mint_approval_token(uuid) to authenticated;
grant execute on function public.approval_lookup(text) to anon, authenticated;
grant execute on function public.approval_decide(text, text, text) to anon, authenticated;
