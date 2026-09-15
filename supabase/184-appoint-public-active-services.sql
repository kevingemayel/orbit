-- ============================================================================
-- 184-appoint-public-active-services.sql
--
-- Why: the public booking page (book.html) listed every Appoint service, including
-- ones switched Off in Appoint > Services, and public_book_appointment accepted a
-- booking for an Off service. The page only gets what public_appt_info returns, so
-- the fix has to be in the two portal functions:
--   * public_appt_info lists only active services.
--   * public_book_appointment refuses a service that is Off (a client may still
--     have the page open from before it was switched Off).
-- Everything else is unchanged from 89-counter-void-appt-portal.sql and
-- 91-finalize.sql (capacity / double-book guard included).
--
-- Safe to re-run.
-- ============================================================================

create or replace function public.public_appt_info(p_slug text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_comp uuid; v_name text; v_set record; v_services jsonb; v_avail jsonb;
begin
  select company_id into v_comp from public.appt_settings where public_slug = p_slug and coalesce(public_slug,'') <> '';
  if v_comp is null then return null; end if;
  select name into v_name from public.companies where id = v_comp;
  select * into v_set from public.appt_settings where company_id = v_comp;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'duration_min',duration_min,'price',price,'currency_code',currency_code,'location_type',location_type) order by sort, name), '[]'::jsonb)
    into v_services from public.appt_services where company_id = v_comp and coalesce(is_active, true);
  select coalesce(jsonb_agg(jsonb_build_object('weekday',weekday,'start_min',start_min,'end_min',end_min) order by weekday), '[]'::jsonb)
    into v_avail from public.appt_availability where company_id = v_comp and staff_id is null;
  return jsonb_build_object(
    'business', v_name,
    'term_client', coalesce(v_set.term_client, 'Client'),
    'term_appointment', coalesce(v_set.term_appointment, 'Appointment'),
    'currency', (select currency_code from public.companies where id = v_comp),
    'services', v_services,
    'availability', v_avail
  );
end $$;
grant execute on function public.public_appt_info(text) to anon, authenticated;

create or replace function public.public_book_appointment(p_slug text, p_service uuid, p_start timestamptz, p_name text, p_email text, p_phone text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_comp uuid; v_org uuid; v_dur int; v_price numeric; v_cur text; v_loc text; v_cap int; v_client uuid; v_num text; v_end timestamptz; v_taken int;
begin
  select company_id into v_comp from public.appt_settings where public_slug = p_slug and coalesce(public_slug,'') <> '';
  if v_comp is null then raise exception 'This booking link is not active.'; end if;
  if p_name is null or length(trim(p_name)) < 2 then raise exception 'Please enter your name.'; end if;
  if p_start is null or p_start < now() then raise exception 'Please pick a time in the future.'; end if;
  select duration_min, price, currency_code, location_type, coalesce(capacity,1)
    into v_dur, v_price, v_cur, v_loc, v_cap
    from public.appt_services where id = p_service and company_id = v_comp and coalesce(is_active, true);
  if v_dur is null then raise exception 'Please choose a service. The one chosen is no longer offered.'; end if;
  v_end := p_start + (v_dur || ' minutes')::interval;

  -- capacity / double-book guard: overlapping, non-cancelled bookings of the same service
  select count(*) into v_taken from public.appt_appointments
    where company_id = v_comp and service_id = p_service and status <> 'cancelled'
      and starts_at < v_end and ends_at > p_start;
  if v_taken >= v_cap then
    raise exception 'Sorry, that time is no longer available. Please choose another slot.';
  end if;

  select org_id into v_org from public.companies where id = v_comp;
  if p_email is not null and length(trim(p_email)) > 3 then
    select id into v_client from public.partners where company_id = v_comp and lower(email) = lower(trim(p_email)) limit 1;
  end if;
  if v_client is null then
    insert into public.partners(org_id, company_id, name, is_company, is_customer, email, mobile)
      values (v_org, v_comp, trim(p_name), false, true, nullif(trim(p_email),''), nullif(trim(p_phone),'')) returning id into v_client;
  end if;
  v_num := 'APT/' || to_char(now(),'YYYY') || '/' || lpad(((select count(*) from public.appt_appointments where company_id = v_comp) + 1)::text, 4, '0');
  insert into public.appt_appointments(company_id, number, client_id, service_id, starts_at, ends_at, status, location_type, price, currency_code, source, notes)
    values (v_comp, v_num, v_client, p_service, p_start, v_end, 'booked', coalesce(v_loc,'in_person'), coalesce(v_price,0), coalesce(v_cur, (select currency_code from public.companies where id = v_comp)), 'portal', 'Booked online');
  return jsonb_build_object('ok', true, 'number', v_num);
end $$;
grant execute on function public.public_book_appointment(text, uuid, timestamptz, text, text, text) to anon, authenticated;

select '184 public booking offers active services only' as done;
