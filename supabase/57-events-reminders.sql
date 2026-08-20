-- ============================================================================
--  Spacework ERP  -  EVENT PAYMENT REMINDERS + email delivery  (run AFTER 56)
--  Every event payment automatically gets 3 reminders: 2 weeks before, 1 week
--  before, and on the due date. A daily scheduler (pg_cron -> pg_net -> the
--  Cloudflare function /api/run-reminders -> Resend) emails the people involved
--  in the event. Reminders that fall in the past are created already-sent so
--  they never fire retroactively.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1) the reminders table ------------------------------------------------------
create table if not exists public.event_payment_reminders (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  event_id    uuid not null references public.event_events(id)   on delete cascade,
  payment_id  uuid not null references public.event_payments(id) on delete cascade,
  remind_on   date not null,
  offset_days int  not null,                 -- 14 | 7 | 0
  label       text,                          -- '2 weeks before' | '1 week before' | 'On due date'
  channel     text default 'email',
  sent        boolean default false,
  sent_at     timestamptz,
  recipients  text,                          -- snapshot of who was emailed
  created_at  timestamptz default now(),
  unique (payment_id, offset_days)
);
create index if not exists idx_evpayrem_due on public.event_payment_reminders(remind_on) where sent = false;

alter table public.event_payment_reminders enable row level security;
drop policy if exists evpayrem_r on public.event_payment_reminders;
create policy evpayrem_r on public.event_payment_reminders for select
  using (event_id in (select public.my_event_ids()));
drop policy if exists evpayrem_w on public.event_payment_reminders;
create policy evpayrem_w on public.event_payment_reminders for all
  using (event_id in (select public.my_event_ids()))
  with check (event_id in (select public.my_event_ids()));

-- 2) auto-generate the 3 reminders whenever a payment is saved ----------------
create or replace function public.gen_payment_reminders() returns trigger
language plpgsql security definer set search_path=public as $$
declare offs int; d date; lbl text;
begin
  delete from public.event_payment_reminders where payment_id = NEW.id and sent = false;
  if NEW.due_date is null or coalesce(NEW.paid,false) then
    return NEW;
  end if;
  foreach offs in array array[14,7,0] loop
    d   := NEW.due_date - offs;
    lbl := case offs when 14 then '2 weeks before' when 7 then '1 week before' else 'On due date' end;
    insert into public.event_payment_reminders(org_id,event_id,payment_id,remind_on,offset_days,label,sent)
      values (NEW.org_id, NEW.event_id, NEW.id, d, offs, lbl, (d < current_date))
    on conflict (payment_id, offset_days) do nothing;
  end loop;
  return NEW;
end $$;

drop trigger if exists trg_gen_payment_reminders on public.event_payments;
create trigger trg_gen_payment_reminders
  after insert or update of due_date, amount, paid on public.event_payments
  for each row execute function public.gen_payment_reminders();

-- 3) who are "the people involved in the event" (emails) ----------------------
--    creator + client contact + accepted collaborators + task assignees.
create or replace function public.event_people_emails(p_event uuid)
returns setof text language sql stable security definer set search_path=public as $$
  select distinct lower(btrim(e)) from (
    select u.email  as e from public.event_events ev join auth.users u on u.id = ev.created_by     where ev.id = p_event
    union all select pt.email from public.event_events ev join public.partners pt on pt.id = ev.partner_id where ev.id = p_event
    union all select ec.invited_email from public.event_collaborators ec where ec.event_id = p_event and ec.status = 'accepted'
    union all select t.assignee from public.event_tasks t where t.event_id = p_event and t.assignee like '%@%.%'
    union all select u.email from public.event_tasks t join auth.users u on u.id = t.assignee_id where t.event_id = p_event
  ) s(e)
  where e is not null and btrim(e) <> '' and e like '%@%.%';
$$;
grant execute on function public.event_people_emails(uuid) to authenticated;

-- 4) internal shared secret for the cron -> function -> RPC relay --------------
create table if not exists public.app_secrets (
  key text primary key, value text not null, updated_at timestamptz default now()
);
alter table public.app_secrets enable row level security;   -- no policies: only SECURITY DEFINER / service role can read
insert into public.app_secrets(key, value)
  values ('reminder_cron_secret', encode(gen_random_bytes(24),'hex'))
  on conflict (key) do nothing;

-- 5) scheduler-facing RPCs (called by the CF function with the shared secret) --
create or replace function public.due_reminders_for_send(p_secret text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare k text;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret is null or p_secret <> k then raise exception 'unauthorized'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'label', r.label, 'remind_on', r.remind_on, 'offset_days', r.offset_days,
      'amount', p.amount, 'currency', coalesce(ev.currency,'USD'), 'due_date', p.due_date,
      'payment_label', p.label, 'supplier', sup.name,
      'event_id', ev.id, 'event_name', ev.name, 'event_date', ev.event_date, 'venue', ev.venue,
      'recipients', (select coalesce(jsonb_agg(x), '[]'::jsonb) from public.event_people_emails(ev.id) x)
    ) order by r.remind_on)
    from public.event_payment_reminders r
    join public.event_payments p  on p.id  = r.payment_id
    join public.event_events   ev on ev.id = r.event_id
    left join public.event_suppliers sup on sup.id = p.supplier_id
    where r.sent = false and r.remind_on <= current_date and coalesce(p.paid,false) = false
  ), '[]'::jsonb);
end $$;
grant execute on function public.due_reminders_for_send(text) to anon, authenticated;

create or replace function public.mark_reminders_sent(p_secret text, p_ids uuid[], p_recipients text)
returns int language plpgsql security definer set search_path=public as $$
declare k text; n int;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret <> k then raise exception 'unauthorized'; end if;
  update public.event_payment_reminders
     set sent = true, sent_at = now(), recipients = coalesce(nullif(p_recipients,''), recipients)
   where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.mark_reminders_sent(text, uuid[], text) to anon, authenticated;

-- 6) backfill reminders for existing unpaid, dated payments -------------------
insert into public.event_payment_reminders(org_id,event_id,payment_id,remind_on,offset_days,label,sent)
select p.org_id, p.event_id, p.id, p.due_date - o.d, o.d,
       case o.d when 14 then '2 weeks before' when 7 then '1 week before' else 'On due date' end,
       (p.due_date - o.d) < current_date
from public.event_payments p
cross join (values (14),(7),(0)) o(d)
where p.due_date is not null and coalesce(p.paid,false) = false
on conflict (payment_id, offset_days) do nothing;

-- 7) daily scheduler: pg_cron -> pg_net POST to the Cloudflare function --------
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('event-payment-reminders');
exception when others then null;
end $$;

select cron.schedule('event-payment-reminders', '0 9 * * *', $cron$
  select net.http_post(
    url     := 'https://orbit.spacework.ai/api/run-reminders',
    headers := jsonb_build_object(
                 'Content-Type','application/json',
                 'x-cron-secret', (select value from public.app_secrets where key='reminder_cron_secret')),
    body    := '{}'::jsonb
  );
$cron$);

select 'event payment reminders ready' as done;
