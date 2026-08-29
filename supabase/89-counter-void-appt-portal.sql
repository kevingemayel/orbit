-- ============================================================================
--  Orbit ERP  -  Counter void + split tender, Appoint reminders + public portal
-- ============================================================================

-- Counter: split-tender breakdown + void bookkeeping
alter table public.cash_movements add column if not exists tenders jsonb default '[]'::jsonb;   -- [{method, amount, cash_account_id}]
alter table public.cash_movements add column if not exists void_of uuid references public.cash_movements(id) on delete set null;  -- this movement reverses that one
alter table public.cash_movements add column if not exists voided_at timestamptz;
alter table public.cash_movements add column if not exists voided_by uuid;

-- Appoint: reminders + a public booking slug
alter table public.appt_settings add column if not exists public_slug text;
alter table public.appt_settings add column if not exists reminders_enabled boolean default false;
alter table public.appt_settings add column if not exists reminder_hours int default 24;
create unique index if not exists idx_appt_settings_slug on public.appt_settings(public_slug) where public_slug is not null;
alter table public.appt_appointments add column if not exists reminder_sent_at timestamptz;

-- ---- public booking portal RPCs (callable by anon; SECURITY DEFINER so anon never touches tables) ----
create or replace function public.public_appt_info(p_slug text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_comp uuid; v_name text; v_set record; v_services jsonb; v_avail jsonb;
begin
  select company_id into v_comp from public.appt_settings where public_slug = p_slug and coalesce(public_slug,'') <> '';
  if v_comp is null then return null; end if;
  select name into v_name from public.companies where id = v_comp;
  select * into v_set from public.appt_settings where company_id = v_comp;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'duration_min',duration_min,'price',price,'currency_code',currency_code,'location_type',location_type) order by sort, name), '[]'::jsonb)
    into v_services from public.appt_services where company_id = v_comp;
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
declare v_comp uuid; v_org uuid; v_dur int; v_price numeric; v_cur text; v_loc text; v_client uuid; v_num text; v_end timestamptz;
begin
  select company_id into v_comp from public.appt_settings where public_slug = p_slug and coalesce(public_slug,'') <> '';
  if v_comp is null then raise exception 'This booking link is not active.'; end if;
  if p_name is null or length(trim(p_name)) < 2 then raise exception 'Please enter your name.'; end if;
  if p_start is null or p_start < now() then raise exception 'Please pick a time in the future.'; end if;
  select duration_min, price, currency_code, location_type into v_dur, v_price, v_cur, v_loc from public.appt_services where id = p_service and company_id = v_comp;
  if v_dur is null then raise exception 'Please choose a service.'; end if;
  select org_id into v_org from public.companies where id = v_comp;
  if p_email is not null and length(trim(p_email)) > 3 then
    select id into v_client from public.partners where company_id = v_comp and lower(email) = lower(trim(p_email)) limit 1;
  end if;
  if v_client is null then
    insert into public.partners(org_id, company_id, name, is_company, is_customer, email, mobile)
      values (v_org, v_comp, trim(p_name), false, true, nullif(trim(p_email),''), nullif(trim(p_phone),'')) returning id into v_client;
  end if;
  v_end := p_start + (v_dur || ' minutes')::interval;
  v_num := 'APT/' || to_char(now(),'YYYY') || '/' || lpad(((select count(*) from public.appt_appointments where company_id = v_comp) + 1)::text, 4, '0');
  insert into public.appt_appointments(company_id, number, client_id, service_id, starts_at, ends_at, status, location_type, price, currency_code, source, notes)
    values (v_comp, v_num, v_client, p_service, p_start, v_end, 'booked', coalesce(v_loc,'in_person'), coalesce(v_price,0), coalesce(v_cur, (select currency_code from public.companies where id = v_comp)), 'portal', 'Booked online');
  return jsonb_build_object('ok', true, 'number', v_num);
end $$;
grant execute on function public.public_book_appointment(text, uuid, timestamptz, text, text, text) to anon, authenticated;

select 'counter void + appt portal ready' as done;
