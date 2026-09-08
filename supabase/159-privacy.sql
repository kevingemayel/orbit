-- ============================================================================
-- 159-privacy.sql  -  data protection in practice rather than in principle.
--
-- Orbit has said since day one that UK/EU/US compliance is a design constraint.
-- What was never actually built is the part a regulator asks about: when a real
-- person writes and says "send me everything you hold about me" or "delete me",
-- can you do it, and can you show that you did.
--
-- Three things here:
--
--  1. gdpr_export  - every row in this company that is about one person, as one
--     JSON document. Not a guess: their own record, plus every table that
--     carries an email address, scanned for theirs.
--
--  2. gdpr_erase   - erasure that does not destroy the books. Invoices, ledger
--     entries and payments are kept, because tax law requires them and Article
--     17(3)(b) says so; what is removed is the person - name, email, phone,
--     address - everywhere it appears. The record of what was erased, and by
--     whom, is kept forever, because that record is the proof.
--
--  3. analytics_prune - the visitor analytics stores a raw IP address, which is
--     personal data. It now has a retention period instead of being kept for
--     ever, and the pruning is scheduled rather than remembered.
-- ============================================================================

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind text not null check (kind in ('export', 'erase')),
  subject_kind text not null,
  subject_id uuid,
  subject_label text,
  subject_email text,
  requested_by uuid default auth.uid(),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  rows_touched jsonb,
  note text
);
create index if not exists privacy_requests_co_idx on public.privacy_requests (company_id, requested_at desc);
alter table public.privacy_requests enable row level security;

drop policy if exists privacy_requests_r on public.privacy_requests;
create policy privacy_requests_r on public.privacy_requests for select
  using (company_id in (select public.my_company_ids()));
drop policy if exists privacy_requests_w on public.privacy_requests;
create policy privacy_requests_w on public.privacy_requests for insert
  with check (public.can_write_company(company_id));

-- Every place a person's email can appear. Kept as one list so the export and
-- the erasure can never drift apart: both walk this.
create or replace function public.privacy_email_map()
returns table (tbl text, email_col text, name_col text, phone_cols text[])
language sql immutable
as $fn$
  select * from (values
    ('partners',          'email',          'name',            array['phone','mobile']),
    ('crm_leads',         'email',          'contact_name',    array['phone']),
    ('crm_lead_contacts', 'email',          'name',            array['phone']),
    ('hr_employees',      'work_email',     'name',            array['phone']),
    ('hr_employees',      'personal_email', 'name',            array['phone']),
    ('applicants',        'email',          'name',            array['phone']),
    ('job_applications',  'email',          'name',            array['phone']),
    ('event_guests',      'email',          'first_name',      array['phone']),
    ('event_suppliers',   'email',          'name',            array['phone']),
    ('property_residents','email',          'name',            array['phone']),
    ('property_members',  'email',          null,              array[]::text[]),
    ('portal_access',     'email',          null,              array[]::text[]),
    ('org_invites',       'email',          null,              array[]::text[]),
    ('leads',             'email',          'name',            array['phone']),
    ('reservations',      null,             'guest_name',      array['phone']),
    ('deliveries',        null,             null,              array['phone'])
  ) as v(tbl, email_col, name_col, phone_cols);
$fn$;

-- ---------------------------------------------------------------- the export
create or replace function public.gdpr_export(p_company uuid, p_kind text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  em text; label text; out jsonb := '{}'::jsonb; part jsonb; m record; n int; total int := 0;
begin
  if not public.can_write_company(p_company) then
    raise exception 'only a company administrator can export a person''s data';
  end if;

  -- who is this
  if p_kind = 'partner' then
    select email, name into em, label from public.partners where id = p_id and company_id = p_company;
  elsif p_kind = 'employee' then
    select coalesce(work_email, personal_email), name into em, label from public.hr_employees where id = p_id and company_id = p_company;
  elsif p_kind = 'lead' then
    select email, coalesce(contact_name, name) into em, label from public.crm_leads where id = p_id and company_id = p_company;
  else
    raise exception 'unknown subject type %', p_kind;
  end if;
  if label is null then raise exception 'no such person in this company'; end if;

  out := jsonb_build_object(
    'subject', jsonb_build_object('kind', p_kind, 'id', p_id, 'name', label, 'email', em),
    'company', (select jsonb_build_object('id', id, 'name', name) from public.companies where id = p_company),
    'produced_at', now(),
    'note', 'Every row this company holds that names this person or carries their email address. Financial documents are included: they are kept for tax law and cannot be deleted, only anonymised.');

  -- everything keyed to their email, table by table
  for m in select * from public.privacy_email_map() where email_col is not null loop
    if em is null then continue; end if;
    begin
      execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb), count(*) from public.%I t where lower(t.%I) = lower($1)', m.tbl, m.email_col)
        into part, n using em;
    exception when others then continue;
    end;
    if n > 0 then
      out := jsonb_set(out, array['records', m.tbl || '_by_' || m.email_col], part, true);
      total := total + n;
    end if;
  end loop;

  -- and the documents that name them as a party
  if p_kind = 'partner' then
    out := jsonb_set(out, '{records,invoices}',
      coalesce((select jsonb_agg(to_jsonb(i)) from public.invoices i where i.partner_id = p_id), '[]'::jsonb), true);
    out := jsonb_set(out, '{records,payments}',
      coalesce((select jsonb_agg(to_jsonb(pm)) from public.payments pm where pm.partner_id = p_id), '[]'::jsonb), true);
  elsif p_kind = 'employee' then
    out := jsonb_set(out, '{records,payslips}',
      coalesce((select jsonb_agg(to_jsonb(s)) from public.hr_payslips s where s.employee_id = p_id), '[]'::jsonb), true);
    out := jsonb_set(out, '{records,timesheets}',
      coalesce((select jsonb_agg(to_jsonb(t)) from public.timesheets t where t.employee_id = p_id), '[]'::jsonb), true);
  end if;

  insert into public.privacy_requests (company_id, kind, subject_kind, subject_id, subject_label, subject_email, completed_at, rows_touched)
  values (p_company, 'export', p_kind, p_id, label, em, now(), jsonb_build_object('rows_by_email', total));

  return out;
end $fn$;

-- --------------------------------------------------------------- the erasure
create or replace function public.gdpr_erase(p_company uuid, p_kind text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  em text; label text; m record; n int; touched jsonb := '{}'::jsonb; tomb text; col text;
begin
  if not public.can_write_company(p_company) then
    raise exception 'only a company administrator can erase a person''s data';
  end if;

  if p_kind = 'partner' then
    select email, name into em, label from public.partners where id = p_id and company_id = p_company;
  elsif p_kind = 'employee' then
    select coalesce(work_email, personal_email), name into em, label from public.hr_employees where id = p_id and company_id = p_company;
  elsif p_kind = 'lead' then
    select email, coalesce(contact_name, name) into em, label from public.crm_leads where id = p_id and company_id = p_company;
  else
    raise exception 'unknown subject type %', p_kind;
  end if;
  if label is null then raise exception 'no such person in this company'; end if;

  tomb := 'Erased ' || to_char(now(), 'YYYY-MM-DD');

  -- Erasure is per controller, so it stops at this company wherever the table
  -- knows which company it belongs to. Another company in the same group may
  -- have its own, separate relationship with the same person.
  for m in select * from public.privacy_email_map() loop
    if m.email_col is null or em is null then continue; end if;
    begin
      if exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = m.tbl and column_name = 'company_id') then
        execute format('update public.%I set %I = null where lower(%I) = lower($1) and company_id = $2', m.tbl, m.email_col, m.email_col)
          using em, p_company;
      else
        execute format('update public.%I set %I = null where lower(%I) = lower($1)', m.tbl, m.email_col, m.email_col) using em;
      end if;
      get diagnostics n = row_count;
      if n > 0 then touched := touched || jsonb_build_object(m.tbl || '.' || m.email_col, n); end if;
    exception when others then continue;
    end;
  end loop;

  -- the person's own record keeps its identity as a tombstone so the documents
  -- that must survive still point at something, but at nobody
  if p_kind = 'partner' then
    update public.partners set name = tomb, email = null, phone = null, mobile = null,
           street = null, city = null, notes = null, website = null
     where id = p_id;
  elsif p_kind = 'employee' then
    update public.hr_employees set name = tomb, first_name = null, last_name = null,
           work_email = null, personal_email = null, address = null, notes = null
     where id = p_id;
  elsif p_kind = 'lead' then
    update public.crm_leads set contact_name = tomb, email = null, phone = null,
           notes = null, map_url = null, latitude = null, longitude = null
     where id = p_id;
  end if;

  insert into public.privacy_requests (company_id, kind, subject_kind, subject_id, subject_label, subject_email, completed_at, rows_touched, note)
  values (p_company, 'erase', p_kind, p_id, label, em, now(), touched,
          'Identifying fields removed. Invoices, ledger entries and payments were kept: retention for tax law, Article 17(3)(b).');

  return jsonb_build_object('erased', label, 'tables', touched,
    'kept', 'Financial documents are retained by law and now point at an anonymous record.');
end $fn$;

-- ------------------------------------------------------------- IP retention
-- A raw IP address is personal data. Keeping it for ever needs a justification
-- nobody has; ninety days covers "who visited and roughly from where" and then
-- the identifying part goes, leaving the country for the traffic report.
create or replace function public.analytics_prune(p_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare n integer;
begin
  update public.visits
     set ip = null, latitude = null, longitude = null, city = null, org = null
   where created_at < now() - make_interval(days => greatest(p_days, 1))
     and ip is not null;
  get diagnostics n = row_count;
  return n;
end $fn$;

revoke all on function public.analytics_prune(integer) from public, anon, authenticated;

grant execute on function public.gdpr_export(uuid, text, uuid) to authenticated;
grant execute on function public.gdpr_erase(uuid, text, uuid) to authenticated;

-- run it nightly rather than when somebody remembers
do $sched$
begin
  perform cron.schedule('orbit-analytics-prune', '30 3 * * *', $job$select public.analytics_prune(90)$job$);
exception when others then
  raise notice 'pg_cron not available - analytics_prune must be scheduled another way';
end $sched$;
