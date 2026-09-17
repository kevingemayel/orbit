-- 206: an email leaves Orbit only to an address the company already knows, and every
-- send is recorded.
--
-- The invoice sender took the recipient from the request, so any signed-in person could
-- send a convincing invoice email, in their own words, to any address in the world, from
-- a domain with valid SPF and DKIM, with nothing written down. That is a reputation and
-- phishing problem rather than a data leak, and it is the kind of thing that ends an
-- enterprise security review.
--
-- From now on the database answers three questions before anything is sent: is this
-- person in that company, is this address one the company holds on file, and has this
-- company or this person already sent more than the hour allows. Every answer, yes or
-- no, is written to email_log. Safe to re-run.

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind text not null,
  to_email text not null,
  doc_id uuid,
  subject text,
  sent_by uuid,
  sent_by_email text,
  allowed boolean not null default true,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists email_log_company_time on public.email_log (company_id, created_at desc);
alter table public.email_log enable row level security;

drop policy if exists email_log_r on public.email_log;
create policy email_log_r on public.email_log for select to authenticated
  using (company_id in (select public.my_view_company_ids('{settings,accounting}'::text[])));
-- rows are written by the checking function, never straight from a browser
drop policy if exists email_log_w on public.email_log;

-- is this address already known to this company
create or replace function public.email_on_file(p_company uuid, p_email text) returns boolean
  language sql stable security definer set search_path = public as $fn$
  select case when p_company is null or coalesce(btrim(p_email), '') = '' then false else exists (
    select 1 from public.partners x where x.company_id = p_company and lower(x.email) = lower(btrim(p_email))
    union all select 1 from public.hr_employees x where x.company_id = p_company and lower(x.work_email) = lower(btrim(p_email))
    union all select 1 from public.crm_leads x where x.company_id = p_company and lower(x.email) = lower(btrim(p_email))
    union all select 1 from public.crm_lead_contacts x where lower(x.email) = lower(btrim(p_email))
         and exists (select 1 from public.crm_leads l where l.id = x.lead_id and l.company_id = p_company)
    union all select 1 from public.portal_access x where x.company_id = p_company and lower(x.email) = lower(btrim(p_email))
    union all select 1 from public.stores x where x.company_id = p_company and lower(x.email) = lower(btrim(p_email))
    union all select 1 from public.companies c where c.id = p_company and lower(coalesce(c.profile ->> 'email', '')) = lower(btrim(p_email))
    union all select 1 from auth.users u where u.id = auth.uid() and lower(u.email) = lower(btrim(p_email))
    union all select 1 from public.org_members m join public.companies c on c.org_id = m.org_id
               join auth.users u on u.id = m.user_id
              where c.id = p_company and coalesce(m.status,'active') = 'active' and lower(u.email) = lower(btrim(p_email))
  ) end
$fn$;
revoke all on function public.email_on_file(uuid, text) from public, anon;
grant execute on function public.email_on_file(uuid, text) to authenticated, service_role;

-- may this person send this, and write it down either way
create or replace function public.email_send_check(p_company uuid, p_kind text, p_to text, p_doc uuid, p_subject text)
  returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  uid uuid := auth.uid(); em text; n_co int; n_me int; why text := null; ok boolean := true;
  cap_co int := 200; cap_me int := 60;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'Sign in first.'); end if;
  select email into em from auth.users where id = uid;
  if p_company is null or p_company not in (select public.my_company_ids()) then
    ok := false; why := 'That company is not yours to send from.';
  elsif not public.email_on_file(p_company, p_to) then
    ok := false; why := 'Orbit only sends to an address the company already holds. Add ' || coalesce(btrim(p_to), 'it') || ' to the contact first, then send.';
  else
    select count(*) into n_co from public.email_log
     where company_id = p_company and allowed and created_at > now() - interval '1 hour';
    select count(*) into n_me from public.email_log
     where sent_by = uid and allowed and created_at > now() - interval '1 hour';
    if n_co >= cap_co then ok := false; why := 'This company has sent ' || n_co || ' emails in the last hour, which is the limit. Try again later.';
    elsif n_me >= cap_me then ok := false; why := 'You have sent ' || n_me || ' emails in the last hour, which is the limit. Try again later.';
    end if;
  end if;
  insert into public.email_log (company_id, kind, to_email, doc_id, subject, sent_by, sent_by_email, allowed, reason)
  values (p_company, coalesce(p_kind, 'other'), coalesce(btrim(p_to), ''), p_doc, left(coalesce(p_subject, ''), 200), uid, em, ok, why);
  return jsonb_build_object('ok', ok, 'reason', why);
end $fn$;
revoke all on function public.email_send_check(uuid, text, text, uuid, text) from public, anon;
grant execute on function public.email_send_check(uuid, text, text, uuid, text) to authenticated, service_role;
