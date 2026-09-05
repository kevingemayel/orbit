-- ============================================================================
--  Orbit ERP  -  FINAL database step
--  Paste this ENTIRE file into the Supabase SQL editor (project: orbit) and Run.
--  It bundles the last two migrations that could not be auto-applied:
--    * 92-appt-reminders.sql  (appointment reminder emails + hourly scheduler)
--    * 93-country-coa.sql     (country-aware chart of accounts + VAT on signup)
--  Both blocks are IDEMPOTENT - safe to run once or many times. Nothing is
--  deleted, nothing is duplicated. Expected result: a few "Success. No rows
--  returned" messages and two final rows saying "ready".
-- ============================================================================


-- ====================  PART 1 of 2 : APPOINTMENT REMINDERS  =================
-- Hourly scheduler calls the Cloudflare function /api/run-appt-reminders, which
-- emails each client whose appointment falls inside the company's reminder
-- window (Appoint > Settings) via Resend, then stamps reminder_sent_at so no
-- one is emailed twice.

create table if not exists public.app_secrets (
  key text primary key, value text not null, updated_at timestamptz default now()
);
insert into public.app_secrets(key, value)
  values ('reminder_cron_secret', encode(gen_random_bytes(24),'hex'))
  on conflict (key) do nothing;

-- 1) appointments due for a reminder now (per-company window from appt_settings)
create or replace function public.due_appt_reminders(p_secret text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare k text;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret is null or p_secret <> k then raise exception 'unauthorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',          a.id,
      'to',          pt.email,
      'client_name', pt.name,
      'business',    co.name,
      'service',     sv.name,
      'starts_at',   a.starts_at,
      'location',    a.location_type,
      'term_appt',   coalesce(st.term_appointment, 'Appointment'),
      'currency',    co.currency_code,
      'price',       a.price
    ) order by a.starts_at)
    from public.appt_appointments a
    join public.appt_settings st on st.company_id = a.company_id
    join public.companies     co on co.id = a.company_id
    left join public.partners     pt on pt.id = a.client_id
    left join public.appt_services sv on sv.id = a.service_id
    where st.reminders_enabled = true
      and a.reminder_sent_at is null
      and coalesce(a.status,'booked') not in ('cancelled','completed','no_show')
      and a.starts_at > now()
      and a.starts_at <= now() + (coalesce(st.reminder_hours, 24) || ' hours')::interval
      and pt.email is not null and pt.email like '%@%.%'
  ), '[]'::jsonb);
end $$;
grant execute on function public.due_appt_reminders(text) to anon, authenticated;

-- 2) stamp the appointments we emailed
create or replace function public.mark_appt_reminders_sent(p_secret text, p_ids uuid[])
returns int language plpgsql security definer set search_path=public as $$
declare k text; n int;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret <> k then raise exception 'unauthorized'; end if;
  update public.appt_appointments set reminder_sent_at = now() where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.mark_appt_reminders_sent(text, uuid[]) to anon, authenticated;

-- 3) hourly scheduler: pg_cron -> pg_net POST to the Cloudflare function
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('appt-reminders');
exception when others then null;
end $$;

select cron.schedule('appt-reminders', '0 * * * *', $cron$
  select net.http_post(
    url     := 'https://orbit.spacework.ai/api/run-appt-reminders',
    headers := jsonb_build_object(
                 'Content-Type','application/json',
                 'x-cron-secret', (select value from public.app_secrets where key='reminder_cron_secret')),
    body    := '{}'::jsonb
  );
$cron$);

select 'appointment reminders ready' as done;


-- ====================  PART 2 of 2 : COUNTRY-AWARE SETUP  ===================
-- setup_company used to hardcode the Lebanon chart + Lebanon VAT 11% for every
-- new company. Now it picks a country-specific chart-of-accounts template when
-- one exists (falls back to the universal chart) and seeds the correct VAT rate
-- for the company's country. VAT is only seeded when the company has none yet,
-- so re-running never duplicates.

create or replace function public.setup_company(p_company uuid, p_template uuid default null)
returns void language plpgsql security definer set search_path=public as $$
declare tmpl uuid; cur text; ctry text; vat_rate numeric; vat_name text;
begin
  if auth.uid() is not null and not public.can_write_company(p_company) then raise exception 'not allowed'; end if;
  select currency_code, lower(coalesce(country,'')) into cur, ctry from public.companies where id=p_company;

  -- pick a country-specific COA template if one exists, else the universal (LB) chart
  tmpl := coalesce(
    p_template,
    (select id from public.coa_templates where lower(country) = ctry and org_id is null limit 1),
    (select id from public.coa_templates where country='LB' and org_id is null limit 1));

  insert into public.accounts(company_id, code, name, type_code, reconcilable)
  select p_company, l.code, l.name, l.type_code, l.reconcilable
  from public.coa_template_lines l where l.template_id = tmpl
  on conflict (company_id, code) do nothing;

  update public.companies c set
    retained_earnings_account_id = (select id from public.accounts where company_id=p_company and code='1100'),
    current_earnings_account_id  = (select id from public.accounts where company_id=p_company and code='1200'),
    fx_gain_account_id           = (select id from public.accounts where company_id=p_company and code='7660'),
    fx_loss_account_id           = (select id from public.accounts where company_id=p_company and code='6660')
  where c.id = p_company;

  insert into public.journals(company_id, code, name, type, default_account_id, seq_prefix)
  values
    (p_company,'INV','Customer Invoices','sale',   (select id from public.accounts where company_id=p_company and code='7000'), 'INV/'),
    (p_company,'BILL','Vendor Bills','purchase',   (select id from public.accounts where company_id=p_company and code='6000'), 'BILL/'),
    (p_company,'BNK','Bank','bank',                (select id from public.accounts where company_id=p_company and code='5100'), 'BNK/'),
    (p_company,'CSH','Cash','cash',                (select id from public.accounts where company_id=p_company and code='5300'), 'CSH/'),
    (p_company,'MISC','Miscellaneous','general',   null, 'MISC/')
  on conflict (company_id, code) do nothing;

  -- country VAT (only when the company has no tax set up yet, so re-running never duplicates)
  vat_rate := case
    when ctry like '%united arab emirates%' or ctry = 'uae' then 5
    when ctry like '%saudi%' then 15
    when ctry like '%egypt%' then 14
    when ctry like '%united kingdom%' or ctry = 'uk' then 20
    when ctry like '%france%' then 20
    when ctry like '%germany%' then 19
    when ctry like '%lebanon%' then 11
    when ctry like '%qatar%' or ctry like '%kuwait%' or ctry like '%united states%' or ctry = 'usa' then 0
    else 11 end;   -- default to the universal 11% when the country is unknown

  if not exists (select 1 from public.taxes where company_id = p_company) then
    vat_name := 'VAT ' || vat_rate || '%';
    insert into public.taxes(company_id, name, scope, amount_type, amount, account_id) values
      (p_company, vat_name, 'sale', 'percent', vat_rate,               (select id from public.accounts where company_id=p_company and code='4457')),
      (p_company, vat_name || ' (purchase)', 'purchase', 'percent', vat_rate, (select id from public.accounts where company_id=p_company and code='4456')),
      (p_company, 'Exempt 0%', 'sale', 'percent', 0, null);
  end if;

  insert into public.currencies(org_id, code, name, symbol, decimals)
  select c.org_id, x.code, x.name, x.symbol, 2
  from public.companies c, (values ('USD','US Dollar','$'),('EUR','Euro','EUR'),('LBP','Lebanese Pound','LBP'),('AED','UAE Dirham','AED'),('SAR','Saudi Riyal','SAR'),('GBP','Pound Sterling','GBP')) as x(code,name,symbol)
  where c.id = p_company
  on conflict (org_id, code) do nothing;
end; $$;
grant execute on function public.setup_company(uuid, uuid) to authenticated;

select 'country-aware setup_company ready' as done;
