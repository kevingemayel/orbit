-- ============================================================================
-- 115-report-scheduler-rpc.sql  -  Harden the scheduler RPCs (they are SECURITY
-- DEFINER, so they must verify the shared cron secret exactly like
-- due_reminders_for_send does) and compute the report figures server-side so the
-- Cloudflare function only has to format and send. Safe to re-run.
-- ============================================================================

-- Replace the unsecured versions from 114 with secret-checked ones.
drop function if exists public.due_report_schedules();
drop function if exists public.mark_report_schedule_sent(uuid);

create or replace function public.due_report_schedules(p_secret text)
returns table (id uuid, company_id uuid, report_id uuid, name text, recipients text, cadence text)
language plpgsql security definer set search_path = public as $fn$
begin
  if p_secret is null or p_secret <> (select value from public.app_secrets where key = 'reminder_cron_secret') then
    raise exception 'not authorized';
  end if;
  return query
    select s.id, s.company_id, s.report_id, s.name, s.recipients, s.cadence
    from public.report_schedules s
    where s.active
      and coalesce(s.recipients,'') <> ''
      and extract(hour from now() at time zone 'utc')::int = s.hour
      and (s.last_sent_at is null or s.last_sent_at < date_trunc('hour', now()))
      and (
        s.cadence = 'daily'
        or (s.cadence = 'weekly'  and extract(dow from now() at time zone 'utc')::int = coalesce(s.day_of_week,1))
        or (s.cadence = 'monthly' and extract(day from now() at time zone 'utc')::int = coalesce(s.day_of_month,1))
      );
end $fn$;

create or replace function public.mark_report_schedule_sent(p_secret text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if p_secret is null or p_secret <> (select value from public.app_secrets where key = 'reminder_cron_secret') then
    raise exception 'not authorized';
  end if;
  update public.report_schedules set last_sent_at = now() where id = p_id;
end $fn$;

-- Compute the scheduled report's figures (mirrors the dashboard's report engine).
create or replace function public.report_schedule_payload(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  s record; r record; tbl text; amt text; grp text; base text; q text; res jsonb; tot numeric; cur text; agg text;
begin
  if p_secret is null or p_secret <> (select value from public.app_secrets where key = 'reminder_cron_secret') then
    raise exception 'not authorized';
  end if;
  select * into s from public.report_schedules where id = p_id;
  if not found then return null; end if;
  select * into r from public.reports where id = s.report_id;
  if not found then return jsonb_build_object('name', s.name, 'error', 'report missing'); end if;
  select currency_code into cur from public.companies where id = s.company_id;

  if r.source = 'inv_out' then
    tbl := 'public.invoices'; base := ' and t.move_type = ''out_invoice'' ';
    amt := case r.measure when 'total' then 't.amount_total' when 'due' then 't.amount_residual' else null end;
    grp := case r.group_by when 'status' then 'coalesce(t.state,''draft'')'
                           when 'month' then 'to_char(t.invoice_date,''YYYY-MM'')'
                           when 'customer' then 'coalesce((select p.name from public.partners p where p.id = t.partner_id),''None'')' else null end;
  elsif r.source = 'po' then
    tbl := 'public.purchase_orders'; base := '';
    amt := case r.measure when 'total' then 't.amount_total' else null end;
    grp := case r.group_by when 'status' then 'coalesce(t.state,''draft'')'
                           when 'month' then 'to_char(t.date_order,''YYYY-MM'')'
                           when 'vendor' then 'coalesce((select p.name from public.partners p where p.id = t.partner_id),''None'')' else null end;
  elsif r.source = 'projects' then
    tbl := 'public.projects'; base := '';
    amt := case r.measure when 'contract' then 't.contract_value' else null end;
    grp := case r.group_by when 'status' then '(case when t.is_active then ''Active'' else ''Closed'' end)'
                           when 'customer' then 'coalesce((select p.name from public.partners p where p.id = t.partner_id),''None'')' else null end;
  elsif r.source = 'tasks' then
    tbl := 'public.project_tasks'; base := ' and t.is_agile = true ';
    amt := case r.measure when 'points' then 't.points' else null end;
    grp := case r.group_by when 'stage' then 'coalesce(t.board_stage,''backlog'')'
                           when 'priority' then 'coalesce(t.priority,''medium'')' else null end;
  else
    return jsonb_build_object('name', s.name, 'error', 'unknown source');
  end if;

  agg := case when amt is null then 'count(*)' else 'sum(' || amt || ')' end;

  if grp is null then
    q := 'select coalesce(' || agg || ',0)::numeric from ' || tbl || ' t where t.company_id = $1' || base;
    execute q into tot using s.company_id;
    return jsonb_build_object('name', s.name, 'report', r.name, 'single', true, 'total', coalesce(tot,0), 'currency', cur, 'money', amt is not null);
  else
    q := 'select coalesce(jsonb_agg(x), ''[]''::jsonb) from (select ' || grp || ' as label, coalesce(' || agg || ',0)::numeric as value from '
         || tbl || ' t where t.company_id = $1' || base || ' group by 1 order by 2 desc limit 12) x';
    execute q into res using s.company_id;
    return jsonb_build_object('name', s.name, 'report', r.name, 'single', false, 'rows', coalesce(res,'[]'::jsonb), 'currency', cur, 'money', amt is not null);
  end if;
end $fn$;
