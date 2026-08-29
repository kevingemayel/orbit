-- ============================================================================
--  Orbit ERP  -  Finalization migration (2026-08-29)
--  Server-side items from the QA audit that the app can't do on its own.
--  Safe to run in the Supabase SQL editor (Dashboard > SQL). Idempotent.
-- ============================================================================

-- 1) Public booking portal: reject double-books and respect service capacity.
--    The in-app booking already warns on overlap; the anonymous portal did not.
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
    from public.appt_services where id = p_service and company_id = v_comp;
  if v_dur is null then raise exception 'Please choose a service.'; end if;
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

-- 2) One running employment contract per employee (defense in depth; the app already blocks this).
--    Wrapped so a pre-existing duplicate doesn't abort the whole migration - it just skips the index.
do $$
begin
  begin
    create unique index if not exists idx_hr_contracts_one_running
      on public.hr_contracts(company_id, employee_id) where state = 'running';
  exception when unique_violation or others then
    raise notice 'Skipped unique running-contract index (existing duplicates?). Set extra running contracts to Expired, then re-run.';
  end;
end $$;

-- 3) Columns ready for the reference / employee-code features (harmless if unused yet).
alter table public.cash_movements add column if not exists reference text;
alter table public.hr_employees   add column if not exists employee_no text;

select 'finalize migration applied' as done;
