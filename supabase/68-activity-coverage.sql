-- ============================================================================
--  Spacework ERP  -  broaden the audit trail for the Activity log  (AFTER 67)
--  The audit trigger (public.audit_row, from migration 38/39) only covered
--  invoices, payments, projects and purchase_orders. The new Activity log wants
--  "who did what" per app, so we attach the SAME trigger to the main business
--  table of each app. Guarded by to_regclass so a missing table is skipped, and
--  audit_row already swallows any error (e.g. a table without company_id) so it
--  can never block the real operation. Re-running is idempotent (drop+create).
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'partners','crm_leads','tenders','sale_orders','invoices','payments',
    'purchase_orders','rfqs','material_requisitions','subcontracts','subcontract_certificates',
    'projects','project_tasks','project_certificates','project_variations','timesheets',
    'project_items','stock_moves','products','production_runs','work_orders',
    'inspections','site_incidents','site_diaries','site_snags','install_jobs',
    'hr_employees','hr_expenses','hr_leaves','event_events','tools'
  ] loop
    if to_regclass('public.'||t) is not null then
      execute format('drop trigger if exists trg_audit on public.%I;', t);
      execute format('create trigger trg_audit after insert or update or delete on public.%I for each row execute function public.audit_row();', t);
    end if;
  end loop;
end $$;

select 'activity coverage ready' as done;
