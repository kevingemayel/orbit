-- 232: somebody filling in the form on your website becomes a lead.
--
-- A customer website could carry a contact form, and a visitor filling it in
-- landed in site_submissions and nowhere else. Nobody is chased, nobody is
-- called back, and the one measurable thing a business website is for - an
-- enquiry reaching a salesperson - did not happen. A job application was worse:
-- it did not reach Recruitment either.
--
-- The submission is still stored, because it is the raw record. On top of that:
--
--   a form that carries a name, an email or a phone  ->  a lead in CRM
--   a form whose key says application or career      ->  an applicant
--
-- Both carry the whole submission in their notes, so nothing the visitor typed
-- is lost even when the form has fields Orbit has never heard of. A form that
-- is plainly neither (a newsletter sign-up with only an email, a feedback box)
-- still becomes a lead, because a business would rather delete one than miss
-- one. Nothing here can fail the submission: if the lead cannot be written the
-- visitor still gets their thank you, and the raw row is still there.
create or replace function public.site_form_submit(p_host text, p_form text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_site public.sites; v_host text; v_sub text; v_key text; d jsonb;
  v_name text; v_email text; v_phone text; v_msg text; v_stage uuid; v_body text;
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

  v_key := lower(coalesce(p_form, 'contact'));
  d := coalesce(p_data, '{}'::jsonb);
  insert into public.site_submissions (company_id, site_id, form_key, data)
  values (v_site.company_id, v_site.id, v_key, d);

  -- what the visitor told us, under whichever of the usual names the form used
  v_name  := nullif(btrim(coalesce(d->>'name', d->>'full_name', d->>'fullname', d->>'your_name', d->>'company', '')), '');
  v_email := nullif(btrim(coalesce(d->>'email', d->>'e_mail', d->>'your_email', '')), '');
  v_phone := nullif(btrim(coalesce(d->>'phone', d->>'telephone', d->>'mobile', d->>'tel', '')), '');
  v_msg   := nullif(btrim(coalesce(d->>'message', d->>'enquiry', d->>'comments', d->>'notes', '')), '');
  -- everything they typed, kept whatever the form called its fields
  select string_agg(k || ': ' || v, E'\n' order by k) into v_body
    from jsonb_each_text(d) as x(k, v) where btrim(coalesce(v, '')) <> '';

  if v_name is null and v_email is null and v_phone is null then
    return jsonb_build_object('ok', true);
  end if;

  begin
    if v_key like '%applic%' or v_key like '%career%' or v_key like '%job%' or v_key like '%cv%' then
      insert into public.applicants (company_id, name, email, phone, source, stage, notes)
      values (v_site.company_id, coalesce(v_name, v_email, 'Website applicant'), v_email, v_phone,
              'website', 'new', v_body);
    else
      select id into v_stage from public.crm_stages where company_id = v_site.company_id order by sequence nulls last, name limit 1;
      insert into public.crm_leads (company_id, name, contact_name, email, phone, source, stage_id, is_active, notes)
      values (v_site.company_id,
              coalesce(v_name, v_email, 'Website enquiry'),
              v_name, v_email, v_phone, 'website', v_stage, true,
              coalesce(v_msg, '') || case when v_body is null then '' else E'\n\n' || v_body end);
    end if;
  exception when others then
    -- a lead that cannot be written must never cost the visitor their message
    null;
  end;

  return jsonb_build_object('ok', true);
end $function$;

select 'website forms now reach CRM and Recruitment' as done;
