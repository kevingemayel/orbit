-- ============================================================================
--  Spacework ERP  -  APPROVALS + AUTOMATION  (run AFTER 01-25)
--   approval_rules : "when a <doc_type> is >= <min_amount>, require sign-off"
--   approvals      : one request per gated document; approve/reject in the inbox
--   run_orbit_automations(): scheduled job that raises reminder notifications for
--                            overdue execution tasks and overdue invoices.
--  Company-scoped RLS. Automation is best-effort (skips if pg_cron absent).
-- ============================================================================

create table if not exists public.approval_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Rule',
  doc_type text not null default 'purchase_order',   -- purchase_order | sales_order | vendor_bill | customer_invoice | subcontract | variation | expense
  min_amount numeric(20,4) default 0,
  approver_employee_id uuid references public.hr_employees(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_approval_rules on public.approval_rules(company_id, doc_type, is_active);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  rule_id uuid references public.approval_rules(id) on delete set null,
  doc_type text not null default '', doc_id uuid, doc_number text default '',
  doc_amount numeric(20,4) default 0,
  requested_by text default '', status text default 'pending',   -- pending | approved | rejected
  approver_note text default '', decided_by text default '', decided_at timestamptz,
  link_action text, created_at timestamptz default now()
);
create index if not exists idx_approvals on public.approvals(company_id, status, created_at desc);
create index if not exists idx_approvals_doc on public.approvals(doc_type, doc_id);

do $rls$ declare t text;
begin
  foreach t in array array['approval_rules','approvals'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_r on public.%I;', t, t);
    execute format('drop policy if exists %I_w on public.%I;', t, t);
    execute format($f$create policy %I_r on public.%I for select using (company_id in (select public.my_company_ids()));$f$, t, t);
    execute format($f$create policy %I_w on public.%I for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));$f$, t, t);
  end loop;
end $rls$;

-- ---- automation: reminder notifications for overdue work ----
create or replace function public.run_orbit_automations() returns void
language plpgsql security definer set search_path = public as $auto$
begin
  -- overdue execution tasks (not done), one reminder per task per ~day
  insert into public.notifications (company_id, employee_id, kind, title, body, link_action, link_id, actor_name)
  select t.company_id, t.assignee_id, 'reminder', 'Task overdue: ' || t.name,
         'Due ' || to_char(t.date_deadline, 'DD Mon'), 'task', t.id, 'Orbit'
  from public.project_tasks t
  where t.is_agile = true and coalesce(t.board_stage,'') <> 'done'
    and t.date_deadline is not null and t.date_deadline < current_date
    and not exists (select 1 from public.notifications n
                    where n.link_id = t.id and n.kind = 'reminder'
                      and n.created_at > now() - interval '20 hours');

  -- overdue customer invoices with a balance
  insert into public.notifications (company_id, kind, title, body, link_action, link_id, actor_name)
  select i.company_id, 'reminder', 'Invoice overdue: ' || coalesce(i.number,''),
         'Balance ' || coalesce(i.currency_code,'') || ' ' || to_char(coalesce(i.amount_residual,0),'FM999G999G990D00'),
         'inv.out', i.id, 'Orbit'
  from public.invoices i
  where i.move_type = 'out_invoice' and coalesce(i.state,'') = 'posted'
    and coalesce(i.amount_residual,0) > 0
    and i.due_date is not null and i.due_date < current_date
    and not exists (select 1 from public.notifications n
                    where n.link_id = i.id and n.kind = 'reminder'
                      and n.created_at > now() - interval '20 hours');
end $auto$;

-- schedule daily (best-effort; ignore if pg_cron is not available)
do $sched$ begin
  begin execute 'create extension if not exists pg_cron'; exception when others then null; end;
  begin
    perform cron.schedule('orbit-daily-automations', '0 6 * * *', 'select public.run_orbit_automations()');
  exception when others then null; end;
end $sched$;

select 'approval_rules' t, count(*) n from public.approval_rules
union all select 'approvals', count(*) from public.approvals;
