-- ============================================================================
-- 174-privacy-requests-stay-in-company.sql  -  a data request never crosses
-- into another company.
--
-- gdpr_export and gdpr_erase find a person's rows by email across the tables in
-- privacy_email_map. The export searched them with no company filter at all, so
-- a company administrator exporting their own customer also received every row
-- any other tenant held under the same email: other companies' guest lists,
-- applicants, residents. The erase did filter where a table has company_id, but
-- blanked the email everywhere in the tables that do not (event guests, event
-- suppliers, organisation invites, the public website's leads).
--
-- Both now apply one scope per table: the row's own company where it has one,
-- the event's company for guests and suppliers, the company's organisation
-- (and its company list) for invites. A table with no path to a company, such
-- as the public website's leads, is not part of a company's request.
-- Testing it showed the export had never returned anything either: each result
-- went under out->'records' through jsonb_set, which does not create a missing
-- parent, so every export came back with no records. The key now starts empty.
-- Found while writing the in-app help for Privacy & data requests, 2026-09-14.
-- ============================================================================

-- the rows of a table that belong to one company, as a condition on alias t
-- with the company id as $2; null when the table has no path to a company
create or replace function public.privacy_company_scope(p_tbl text)
returns text language plpgsql stable set search_path = public as $fn$
begin
  if exists (select 1 from information_schema.columns c
              where c.table_schema = 'public' and c.table_name = p_tbl and c.column_name = 'company_id') then
    return 't.company_id = $2';
  elsif p_tbl in ('event_guests', 'event_suppliers') then
    return 't.event_id in (select e.id from public.event_events e where e.company_id = $2)';
  elsif p_tbl = 'org_invites' then
    return 't.org_id = (select c.org_id from public.companies c where c.id = $2) and (t.company_ids is null or $2 = any(t.company_ids))';
  end if;
  return null;
end $fn$;
revoke all on function public.privacy_company_scope(text) from public, anon;

create or replace function public.gdpr_export(p_company uuid, p_kind text, p_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  em text; label text; out jsonb := '{}'::jsonb; part jsonb; m record; n int; total int := 0; scope text;
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
    'note', 'Every row this company holds that carries this person''s email address, and the documents that name them as a party. Financial documents are included: they are kept for tax law and cannot be deleted, only anonymised.',
    -- jsonb_set only adds a key under a parent that exists; without this every
    -- record below was silently dropped and the export came back empty
    'records', '{}'::jsonb);

  -- everything this company holds under their email, table by table
  for m in select * from public.privacy_email_map() where email_col is not null loop
    if em is null then continue; end if;
    scope := public.privacy_company_scope(m.tbl);
    if scope is null then continue; end if;          -- no path to a company: not this company's data
    begin
      execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb), count(*) from public.%I t where lower(t.%I) = lower($1) and ', m.tbl, m.email_col) || scope
        into part, n using em, p_company;
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
      coalesce((select jsonb_agg(to_jsonb(i)) from public.invoices i where i.partner_id = p_id and i.company_id = p_company), '[]'::jsonb), true);
    out := jsonb_set(out, '{records,payments}',
      coalesce((select jsonb_agg(to_jsonb(pm)) from public.payments pm where pm.partner_id = p_id and pm.company_id = p_company), '[]'::jsonb), true);
  elsif p_kind = 'employee' then
    out := jsonb_set(out, '{records,payslips}',
      coalesce((select jsonb_agg(to_jsonb(s)) from public.hr_payslips s where s.employee_id = p_id), '[]'::jsonb), true);
    out := jsonb_set(out, '{records,timesheets}',
      coalesce((select jsonb_agg(to_jsonb(t)) from public.timesheets t where t.employee_id = p_id), '[]'::jsonb), true);
  end if;

  insert into public.privacy_requests (company_id, kind, subject_kind, subject_id, subject_label, subject_email, completed_at, rows_touched)
  values (p_company, 'export', p_kind, p_id, label, em, now(), jsonb_build_object('rows_by_email', total));

  return out;
end $function$;

create or replace function public.gdpr_erase(p_company uuid, p_kind text, p_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  em text; label text; m record; n int; touched jsonb := '{}'::jsonb; tomb text; scope text;
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

  -- Erasure is per controller, so it stops at this company in every table.
  -- Another company, in the same group or not, may have its own separate
  -- relationship with the same person, and its records are not ours to change.
  for m in select * from public.privacy_email_map() loop
    if m.email_col is null or em is null then continue; end if;
    scope := public.privacy_company_scope(m.tbl);
    if scope is null then continue; end if;
    begin
      execute format('update public.%I as t set %I = null where lower(t.%I) = lower($1) and ', m.tbl, m.email_col, m.email_col) || scope
        using em, p_company;
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
     where id = p_id and company_id = p_company;
  elsif p_kind = 'employee' then
    update public.hr_employees set name = tomb, first_name = null, last_name = null,
           work_email = null, personal_email = null, address = null, notes = null
     where id = p_id and company_id = p_company;
  elsif p_kind = 'lead' then
    update public.crm_leads set contact_name = tomb, email = null, phone = null,
           notes = null, map_url = null, latitude = null, longitude = null
     where id = p_id and company_id = p_company;
  end if;

  insert into public.privacy_requests (company_id, kind, subject_kind, subject_id, subject_label, subject_email, completed_at, rows_touched, note)
  values (p_company, 'erase', p_kind, p_id, label, em, now(), touched,
          'Identifying fields removed. Invoices, ledger entries and payments were kept: retention for tax law, Article 17(3)(b).');

  return jsonb_build_object('erased', label, 'tables', touched,
    'kept', 'Financial documents are retained by law and now point at an anonymous record.');
end $function$;

revoke all on function public.gdpr_export(uuid, text, uuid) from public, anon;
revoke all on function public.gdpr_erase(uuid, text, uuid) from public, anon;
grant execute on function public.gdpr_export(uuid, text, uuid) to authenticated, service_role;
grant execute on function public.gdpr_erase(uuid, text, uuid) to authenticated, service_role;
