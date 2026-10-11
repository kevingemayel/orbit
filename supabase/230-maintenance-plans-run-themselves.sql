-- 230: a maintenance plan that only fires when somebody presses Generate is a
-- reminder, not a plan.
--
-- Service holds planned maintenance: this air handler, every 90 days, this
-- technician. The schedule was real and the ticket was not: nothing happened
-- until a human opened the screen and pressed Generate. Miss a month and the
-- customer's quarterly service simply did not happen, which is the one thing a
-- maintenance contract is sold on.
--
-- It now runs itself every morning, the same way the daily reminders do, and
-- the button stays for anyone who wants to pull a ticket forward. The function
-- is the same logic either way, so the two cannot drift apart: a plan that is
-- active and due gets one ticket, dated the day it was due, and its next date
-- moves on by its own frequency. A plan whose ticket is still open gets no
-- second one, so a customer who has not been visited yet is not buried in
-- duplicates.
create or replace function public.svc_generate_due_tickets(p_company uuid default null)
returns int
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare p record; made int := 0; tid uuid; n int;
begin
  for p in
    select * from public.service_maintenance_plans
     where coalesce(active, true)
       and next_due is not null and next_due <= current_date
       and (p_company is null or company_id = p_company)
     order by next_due
  loop
    -- one open ticket per plan at a time
    if exists (select 1 from public.service_tickets t
                where t.maintenance_plan_id = p.id
                  and coalesce(t.status, '') not in ('closed', 'cancelled', 'done')) then
      continue;
    end if;

    select count(*) + 1 into n from public.service_tickets where company_id = p.company_id;
    insert into public.service_tickets
      (company_id, number, title, partner_id, product_id, equipment_id, serial_no, assigned_to,
       priority, status, channel, problem, scheduled_at, maintenance_plan_id, opened_at)
    values (p.company_id, 'T-' || to_char(now(), 'YYMMDD') || '-' || lpad(n::text, 3, '0'),
            coalesce(p.title, 'Planned maintenance'), p.partner_id, p.product_id, p.equipment_id, p.serial_no,
            p.assigned_to, coalesce(p.priority, 'normal'),
            case when p.assigned_to is not null then 'assigned' else 'new' end,
            'internal', p.problem, (p.next_due + time '09:00'), p.id, now())
    returning id into tid;

    update public.service_maintenance_plans
       set next_due = p.next_due + (coalesce(p.frequency_days, 90) || ' days')::interval,
           last_generated_at = now()
     where id = p.id;
    made := made + 1;
  end loop;
  return made;
end $fn$;

grant execute on function public.svc_generate_due_tickets(uuid) to authenticated;

-- every morning, just after the other daily automations
select cron.unschedule('svc-maintenance-plans') where exists (select 1 from cron.job where jobname = 'svc-maintenance-plans');
select cron.schedule('svc-maintenance-plans', '15 6 * * *', 'select public.svc_generate_due_tickets()');

select jobname, schedule, active from cron.job where jobname = 'svc-maintenance-plans';
