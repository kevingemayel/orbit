-- ============================================================================
-- 188-website-privacy-settings-fixes.sql  -  five small database fixes found in
-- the Website, Privacy and Settings screens, 2026-09-16.
--
--  1. Sites could not be archived. The Sites list offers Archive, which sets
--     sites.is_active = false, but the sites table never had that column, so
--     the update failed. The column is added, and an archived site is no longer
--     served or accepts form posts.
--  2. An archived job posting still showed on the public careers list, because
--     public_jobs() and job_apply() only looked at is_published. They now also
--     skip postings whose is_active is false.
--  3. A website form post was thanked even when it was refused. The page script
--     is fixed in the app; site_form_submit() now also refuses posts to a site
--     that is not published or is archived, so the refusal is real and visible.
--  4. Privacy tools (gdpr_export and gdpr_erase) never looked in website form
--     submissions, which hold the name, email and message a visitor typed.
--     Both functions now include site_submissions whose answers contain the
--     person's email, scoped to the requesting company. Export returns them;
--     erase replaces the answers with an "Erased" marker.
--  5. Custom fields refused Long text fields and every Appoint client-file field,
--     because the checks on custom_field_defs predate both (entity allowed only
--     partner, project, product; field_type had no textarea). The checks are
--     widened to what the app offers.
--  6. The webhook Last column was never set: webhook_fire() stamped
--     last_delivery_at but never last_status. It now records 202 when the
--     message was queued for sending and 0 when it could not be queued.
--
-- The app is safe before this runs: it hides Archive on Sites until the column
-- exists, unpublishes a job when it is archived, and explains a refused custom
-- field. Safe to re-run.
-- ============================================================================

-- 1) sites.is_active -----------------------------------------------------------
alter table public.sites add column if not exists is_active boolean not null default true;

create or replace function public.site_render(p_host text, p_path text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_site public.sites; v_page public.site_pages; v_host text; v_sub text; v_path text;
begin
  v_host := lower(coalesce(p_host, ''));
  v_path := coalesce(nullif(p_path, ''), '/');
  select s.* into v_site from public.sites s
    join public.site_hostnames h on h.site_id = s.id
    where lower(h.hostname) = v_host and h.status = 'active' and s.is_published and coalesce(s.is_active, true) limit 1;
  if v_site.id is null and v_host like '%.sites.spacework.ai' then
    v_sub := split_part(v_host, '.', 1);
    select s.* into v_site from public.sites s where s.slug = v_sub and s.is_published and coalesce(s.is_active, true) limit 1;
  end if;
  if v_site.id is null then return null; end if;
  select p.* into v_page from public.site_pages p where p.site_id = v_site.id and p.path = v_path and p.is_published limit 1;
  if v_page.id is null and v_path <> '/' then return null; end if;
  if v_page.id is null then
    select p.* into v_page from public.site_pages p where p.site_id = v_site.id and p.path = v_site.homepage_path and p.is_published limit 1;
  end if;
  if v_page.id is null then return null; end if;
  return jsonb_build_object(
    'site', jsonb_build_object('name', v_site.name, 'theme', v_site.theme, 'settings', v_site.settings),
    'page', jsonb_build_object('title', v_page.title, 'meta', v_page.meta, 'content', v_page.content, 'path', v_page.path),
    'nav',  (select coalesce(jsonb_agg(jsonb_build_object('title', pp.title, 'path', pp.path) order by pp.sort, pp.path), '[]'::jsonb)
             from public.site_pages pp where pp.site_id = v_site.id and pp.is_published and coalesce((pp.meta->>'hide_in_nav')::boolean, false) = false)
  );
end $$;
grant execute on function public.site_render(text, text) to anon, authenticated;

-- 3) a post to a draft or archived site is refused, and says so
create or replace function public.site_form_submit(p_host text, p_form text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_site public.sites; v_host text; v_sub text;
begin
  v_host := lower(coalesce(p_host, ''));
  select s.* into v_site from public.sites s join public.site_hostnames h on h.site_id = s.id where lower(h.hostname) = v_host and h.status = 'active' limit 1;
  if v_site.id is null and v_host like '%.sites.spacework.ai' then
    v_sub := split_part(v_host, '.', 1);
    select s.* into v_site from public.sites s where s.slug = v_sub limit 1;
  end if;
  if v_site.id is null then return jsonb_build_object('ok', false, 'error', 'unknown site'); end if;
  if not coalesce(v_site.is_published, false) or not coalesce(v_site.is_active, true) then
    return jsonb_build_object('ok', false, 'error', 'site not published');
  end if;
  insert into public.site_submissions (company_id, site_id, form_key, data) values (v_site.company_id, v_site.id, coalesce(p_form, 'contact'), coalesce(p_data, '{}'::jsonb));
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.site_form_submit(text, text, jsonb) to anon, authenticated;

-- 2) archived job postings leave the public careers list -----------------------
alter table public.job_postings add column if not exists is_active boolean default true;

create or replace function public.public_jobs(p_company uuid)
returns table (id uuid, title text, location text, employment_type text, department text, description text, apply_url text)
language sql stable security definer set search_path = public as $$
  select id, title, location, employment_type, department, description, apply_url
  from public.job_postings
  where company_id = p_company and is_published = true and coalesce(is_active, true)
  order by sort, created_at desc
$$;

create or replace function public.job_apply(p_company uuid, p_job uuid, p_data jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_job is not null and not exists (
    select 1 from public.job_postings where id = p_job and company_id = p_company and is_published = true and coalesce(is_active, true)
  ) then
    raise exception 'unknown job';
  end if;
  insert into public.job_applications(company_id, job_id, name, email, phone, cv_url, message, data)
  values (p_company, p_job,
          nullif(p_data->>'name',''), nullif(p_data->>'email',''), nullif(p_data->>'phone',''),
          nullif(p_data->>'cv_url',''), nullif(p_data->>'message',''), coalesce(p_data,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.public_jobs(uuid) to anon, authenticated;
grant execute on function public.job_apply(uuid, uuid, jsonb) to anon, authenticated;

-- 5) custom field checks match what the app offers -----------------------------
do $$
declare c record;
begin
  for c in select con.conname from pg_constraint con
            where con.conrelid = 'public.custom_field_defs'::regclass and con.contype = 'c'
              and (pg_get_constraintdef(con.oid) ilike '%entity%' or pg_get_constraintdef(con.oid) ilike '%field_type%')
  loop
    execute format('alter table public.custom_field_defs drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.custom_field_defs add constraint custom_field_defs_entity_check
  check (entity in ('partner', 'project', 'product', 'appt_client'));
alter table public.custom_field_defs add constraint custom_field_defs_field_type_check
  check (field_type in ('text', 'number', 'date', 'select', 'checkbox', 'textarea'));

-- 6) the webhook Last column ---------------------------------------------------
create or replace function public.webhook_fire(p_company uuid, p_event text, p_payload jsonb)
returns void language plpgsql security definer set search_path=public, extensions as $$
declare w record; body text; sig text;
begin
  for w in select * from public.webhook_endpoints where company_id=p_company and active and (p_event = any(events)) loop
    body := jsonb_build_object('event',p_event,'company_id',p_company,'created_at',now(),'data',p_payload)::text;
    sig := encode(hmac(body, w.secret, 'sha256'),'hex');
    begin
      perform net.http_post(url:=w.url,
        headers:=jsonb_build_object('Content-Type','application/json','X-Orbit-Event',p_event,'X-Orbit-Signature','sha256='||sig),
        body:=body::jsonb);
      update public.webhook_endpoints set last_delivery_at=now(), last_status=202 where id=w.id;
      insert into public.webhook_deliveries(company_id,endpoint_id,event,status_code) values (p_company,w.id,p_event,202);
    exception when others then
      update public.webhook_endpoints set last_delivery_at=now(), last_status=0 where id=w.id;
      insert into public.webhook_deliveries(company_id,endpoint_id,event,status_code) values (p_company,w.id,p_event,0);
    end;
  end loop;
end $$;

-- 4) privacy: website form submissions -----------------------------------------
-- A submission's answers are free-form jsonb, so a row belongs to the person
-- when any answer equals their email. Only this company's submissions count.
create or replace function public.privacy_submission_matches(p_data jsonb, p_email text)
returns boolean language sql immutable set search_path = public as $fn$
  select case
    when p_email is null or btrim(p_email) = '' or p_data is null or jsonb_typeof(p_data) <> 'object' then false
    else exists (select 1 from jsonb_each_text(p_data) kv where lower(btrim(kv.value)) = lower(btrim(p_email)))
  end
$fn$;
revoke all on function public.privacy_submission_matches(jsonb, text) from public, anon;

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
    'note', 'Every row this company holds that carries this person''s email address, including website form submissions that contain it, and the documents that name them as a party. Financial documents are included: they are kept for tax law and cannot be deleted, only anonymised.',
    'records', '{}'::jsonb);

  for m in select * from public.privacy_email_map() where email_col is not null loop
    if em is null then continue; end if;
    scope := public.privacy_company_scope(m.tbl);
    if scope is null then continue; end if;
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

  -- what they typed into this company's website forms
  if em is not null then
    begin
      select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb), count(*)
        into part, n
        from public.site_submissions s
       where s.company_id = p_company and public.privacy_submission_matches(s.data, em);
      if n > 0 then
        out := jsonb_set(out, '{records,site_submissions_by_email}', part, true);
        total := total + n;
      end if;
    exception when undefined_table then null;
    end;
  end if;

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

  -- website form answers go first: they are matched on the email, which the
  -- loop below clears from the person's other records
  if em is not null then
    begin
      update public.site_submissions s
         set data = jsonb_build_object('erased', tomb)
       where s.company_id = p_company and public.privacy_submission_matches(s.data, em);
      get diagnostics n = row_count;
      if n > 0 then touched := touched || jsonb_build_object('site_submissions.data', n); end if;
    exception when undefined_table then null;
    end;
  end if;

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
          'Identifying fields removed, and website form answers containing their email replaced. Invoices, ledger entries and payments were kept: retention for tax law, Article 17(3)(b).');

  return jsonb_build_object('erased', label, 'tables', touched,
    'kept', 'Financial documents are retained by law and now point at an anonymous record.');
end $function$;

revoke all on function public.gdpr_export(uuid, text, uuid) from public, anon;
revoke all on function public.gdpr_erase(uuid, text, uuid) from public, anon;
grant execute on function public.gdpr_export(uuid, text, uuid) to authenticated, service_role;
grant execute on function public.gdpr_erase(uuid, text, uuid) to authenticated, service_role;

select '188 website, privacy and settings fixes ready' as done;
