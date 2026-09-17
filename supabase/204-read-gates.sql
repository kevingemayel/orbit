-- ============================================================================
-- 204-read-gates.sql  -  a role reads only the apps it has been given.
--
-- Until now the roles model governed writing. Reading was governed by one thing:
-- are you an active member of this company. A security review put it plainly: a
-- junior sales role with Accounting set to None could pull the general ledger,
-- the bank statements and the payroll out of the API with a single request, and
-- the "hide costs" and "hide bank" switches only hid them on screen.
--
-- This adds a restrictive read rule to each table that belongs to an app: to read
-- a row you need that app at View or better (Own records is covered as well, and
-- 201 narrows those rows to your own). Reference data everyone needs to read a
-- screen at all stays open to any member: the chart of accounts, products,
-- contacts, projects, warehouses, units, taxes and the like.
--
-- The tables that every posting app may WRITE are read by fewer: the ledger is
-- read by Accounting and Insights, invoices and payments by the apps that raise
-- and settle them. A supplier's bank details need the bank switch as well.
--
-- Nothing here changes who may write. Salary tables keep their own rule from 191.
-- Safe to re-run.
-- ============================================================================

create or replace function public.can_view_app(cid uuid, p_mods text[]) returns boolean
  language plpgsql stable security definer set search_path = public as $fn$
declare r public.roles; x text;
begin
  if public.is_platform_writer() then return true; end if;
  if cid is null then return false; end if;
  select * into r from public.my_role_in(cid);
  if r.slug is null then return false; end if;
  if r.full_access then return true; end if;
  foreach x in array coalesce(p_mods, '{}'::text[]) loop
    if public.perm_level(r.permissions, x) <> '-' then return true; end if;
  end loop;
  return false;
end $fn$;
revoke all on function public.can_view_app(uuid, text[]) from public, anon;
grant execute on function public.can_view_app(uuid, text[]) to authenticated, service_role;

-- The same question asked once per statement instead of once per row: a read rule
-- that names a row column is evaluated for every row, and my_role_in is a join.
create or replace function public.my_view_company_ids(p_mods text[]) returns setof uuid
  language sql stable security definer set search_path = public as $fn$
  select c.id from public.companies c
   where c.id in (select public.my_company_ids())
     and public.can_view_app(c.id, p_mods)
$fn$;
revoke all on function public.my_view_company_ids(text[]) from public, anon;
grant execute on function public.my_view_company_ids(text[]) to authenticated, service_role;

do $gates$
declare g record;
begin
  for g in select * from (values
    ('aggregator_accounts', '{kitchen,pos}'::text[], 'company_id'),
    ('aggregator_disputes', '{kitchen,pos}'::text[], 'company_id'),
    ('aggregator_orders', '{kitchen,pos}'::text[], 'company_id'),
    ('aggregator_payouts', '{kitchen,pos}'::text[], 'company_id'),
    ('applicants', '{recruitment,employees}'::text[], 'company_id'),
    ('appraisals', '{employees}'::text[], 'company_id'),
    ('approved_suppliers', '{purchase}'::text[], 'company_id'),
    ('appt_appointments', '{appoint}'::text[], 'company_id'),
    ('appt_availability', '{appoint}'::text[], 'company_id'),
    ('appt_files', '{appoint}'::text[], 'company_id'),
    ('appt_notes', '{appoint}'::text[], 'company_id'),
    ('appt_services', '{appoint}'::text[], 'company_id'),
    ('appt_settings', '{appoint}'::text[], 'company_id'),
    ('ar_followups', '{accounting,sales}'::text[], 'company_id'),
    ('articles', '{knowledge,website}'::text[], 'company_id'),
    ('asset_lines', '{accounting}'::text[], 'company_id'),
    ('assets', '{accounting}'::text[], 'company_id'),
    ('backup_settings', '{settings}'::text[], 'company_id'),
    ('bank_statement_lines', '{accounting}'::text[], 'company_id'),
    ('bank_statements', '{accounting}'::text[], 'company_id'),
    ('bom_lines', '{manufacturing}'::text[], 'company_id'),
    ('boms', '{manufacturing}'::text[], 'company_id'),
    ('budget_lines', '{accounting,projects}'::text[], 'company_id'),
    ('budgets', '{accounting,projects}'::text[], 'company_id'),
    ('cash_accounts', '{counter}'::text[], 'company_id'),
    ('cash_counts', '{counter}'::text[], 'company_id'),
    ('cash_drops', '{counter,pos,kitchen}'::text[], 'company_id'),
    ('cash_handovers', '{counter}'::text[], 'company_id'),
    ('cash_movements', '{counter}'::text[], 'company_id'),
    ('certifications', '{employees}'::text[], 'company_id'),
    ('checklist_results', '{kitchen,site,service,pos}'::text[], 'company_id'),
    ('checklist_runs', '{kitchen,site,service,pos}'::text[], 'company_id'),
    ('checklist_template_items', '{kitchen,site,service,pos}'::text[], 'company_id'),
    ('checklist_templates', '{kitchen,site,service,pos}'::text[], 'company_id'),
    ('compliance_documents', '{kitchen,site,documents,pos}'::text[], 'company_id'),
    ('consolidation_adjustments', '{accounting}'::text[], 'company_id'),
    ('consolidation_group_companies', '{accounting}'::text[], 'company_id'),
    ('consolidation_runs', '{accounting}'::text[], '(select g.company_id from public.consolidation_group_companies g where g.group_id = consolidation_runs.group_id and public.can_view_app(g.company_id, array[''accounting'']) limit 1)'),
    ('contact_tags', '{contacts}'::text[], 'company_id'),
    ('crm_activities', '{crm,sales}'::text[], 'company_id'),
    ('crm_lead_contacts', '{crm,sales}'::text[], 'company_id'),
    ('crm_leads', '{crm,sales}'::text[], 'company_id'),
    ('crm_stages', '{crm}'::text[], 'company_id'),
    ('deliveries', '{kitchen,pos,sales,inventory}'::text[], 'company_id'),
    ('delivery_methods', '{inventory,sales}'::text[], 'company_id'),
    ('delivery_note_lines', '{inventory,purchase,sales,manufacturing,projects,site,pos,kitchen,service}'::text[], '(select n.company_id from public.delivery_notes n where n.id = note_id)'),
    ('delivery_notes', '{inventory,sales,site,projects}'::text[], 'company_id'),
    ('delivery_zones', '{kitchen,pos}'::text[], 'company_id'),
    ('dies', '{manufacturing}'::text[], 'company_id'),
    ('drawing_revisions', '{documents,projects,site}'::text[], 'company_id'),
    ('drawings', '{documents,projects,site}'::text[], 'company_id'),
    ('einvoice_docs', '{accounting,sales}'::text[], 'company_id'),
    ('employee_availability', '{employees,kitchen,appoint,service}'::text[], 'company_id'),
    ('employee_skills', '{employees}'::text[], 'company_id'),
    ('equipment', '{manufacturing,service,site}'::text[], 'company_id'),
    ('equipment_events', '{manufacturing,service,site}'::text[], 'company_id'),
    ('event_events', '{events}'::text[], 'company_id'),
    ('feedback', '{events,kitchen,pos,service}'::text[], 'company_id'),
    ('fiscal_periods', '{accounting}'::text[], 'company_id'),
    ('fiscal_years', '{accounting}'::text[], 'company_id'),
    ('followup_levels', '{accounting}'::text[], 'company_id'),
    ('franchise_pipeline', '{kitchen,pos}'::text[], 'company_id'),
    ('franchise_sales_reports', '{kitchen,pos}'::text[], 'company_id'),
    ('franchisees', '{kitchen,pos}'::text[], 'company_id'),
    ('green_lots', '{kitchen,manufacturing,inventory}'::text[], 'company_id'),
    ('grinder_logs', '{kitchen,manufacturing}'::text[], 'company_id'),
    ('hr_attendances', '{employees}'::text[], 'company_id'),
    ('hr_contracts', '{employees}'::text[], 'company_id'),
    ('hr_departments', '{employees}'::text[], 'company_id'),
    ('hr_employees', '{employees,recruitment}'::text[], 'company_id'),
    ('hr_expenses', '{employees}'::text[], 'company_id'),
    ('hr_jobs', '{employees,recruitment}'::text[], 'company_id'),
    ('hr_leave_allocations', '{employees}'::text[], 'company_id'),
    ('hr_leaves', '{employees}'::text[], 'company_id'),
    ('hr_onboarding', '{employees,recruitment}'::text[], 'company_id'),
    ('hr_payslip_lines', '{employees}'::text[], 'company_id'),
    ('hr_payslip_runs', '{employees}'::text[], 'company_id'),
    ('hr_payslips', '{employees}'::text[], 'company_id'),
    ('hr_roster', '{employees,kitchen}'::text[], 'company_id'),
    ('hr_salary_heads', '{employees}'::text[], 'company_id'),
    ('hr_salary_structures', '{employees}'::text[], 'company_id'),
    ('hr_shifts', '{employees,kitchen}'::text[], 'company_id'),
    ('inspection_items', '{site,manufacturing,projects}'::text[], 'company_id'),
    ('inspection_template_items', '{site,manufacturing,projects}'::text[], 'company_id'),
    ('inspection_templates', '{site,manufacturing,projects}'::text[], 'company_id'),
    ('inspections', '{site,manufacturing,projects}'::text[], 'company_id'),
    ('install_jobs', '{site,projects}'::text[], 'company_id'),
    ('install_logs', '{site,projects}'::text[], 'company_id'),
    ('invoice_lines', '{accounting,sales,purchase,counter,plot,events,appoint,service,projects,site,insights}'::text[], 'company_id'),
    ('invoices', '{accounting,sales,purchase,counter,plot,events,appoint,service,projects,site,insights}'::text[], 'company_id'),
    ('job_postings', '{recruitment,website}'::text[], 'company_id'),
    ('journal_entries', '{accounting,insights}'::text[], 'company_id'),
    ('journal_lines', '{accounting,insights}'::text[], 'company_id'),
    ('labour_standards', '{kitchen,pos,employees}'::text[], 'company_id'),
    ('loyalty_accounts', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('loyalty_programs', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('loyalty_transactions', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('maintenance_logs', '{manufacturing,service,site,kitchen}'::text[], 'company_id'),
    ('maintenance_schedules', '{manufacturing,service,site,kitchen}'::text[], 'company_id'),
    ('marketing_fund_entries', '{kitchen,pos}'::text[], 'company_id'),
    ('material_requisition_lines', '{purchase,projects,site,inventory,manufacturing}'::text[], 'company_id'),
    ('material_requisitions', '{purchase,projects,site,inventory,manufacturing}'::text[], 'company_id'),
    ('menu_items', '{kitchen,pos}'::text[], 'company_id'),
    ('menus', '{kitchen,pos}'::text[], 'company_id'),
    ('modifier_groups', '{kitchen,pos}'::text[], 'company_id'),
    ('modifiers', '{kitchen,pos}'::text[], 'company_id'),
    ('package_types', '{inventory}'::text[], 'company_id'),
    ('panels', '{manufacturing,site,projects}'::text[], 'company_id'),
    ('partial_reconciles', '{accounting,counter,sales,purchase,inventory,employees,projects,site,manufacturing,pos,kitchen,plot,events,service,appoint,estimation}'::text[], 'company_id'),
    ('partner_bank_accounts', '{accounting,purchase}'::text[], 'company_id'),
    ('payment_methods', '{counter,pos,kitchen,accounting}'::text[], 'company_id'),
    ('payments', '{accounting,sales,purchase,counter,plot,insights}'::text[], 'company_id'),
    ('planning_shifts', '{employees,projects,site,kitchen,service}'::text[], 'company_id'),
    ('plant_equipment', '{site,projects,manufacturing}'::text[], 'company_id'),
    ('portal_access', '{plot,sales,settings,crm}'::text[], 'company_id'),
    ('pos_call_counters', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_exceptions', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_order_lines', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_orders', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_payments', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_promotions', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_reason_codes', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_sessions', '{kitchen,pos}'::text[], 'company_id'),
    ('pos_vouchers', '{kitchen,pos}'::text[], 'company_id'),
    ('privacy_requests', '{settings}'::text[], 'company_id'),
    ('product_barcodes', '{inventory,sales,purchase,manufacturing,kitchen,pos,estimation,projects,site}'::text[], 'company_id'),
    ('product_kit_components', '{inventory,sales,purchase,manufacturing,kitchen,pos,estimation,projects,site}'::text[], 'company_id'),
    ('product_modifier_groups', '{kitchen,pos}'::text[], 'company_id'),
    ('product_prices', '{inventory,sales,purchase,manufacturing,kitchen,pos,estimation,projects,site}'::text[], 'company_id'),
    ('product_supplier_prices', '{purchase,inventory,estimation}'::text[], 'company_id'),
    ('production_consumption', '{manufacturing,kitchen}'::text[], '(select r.company_id from public.production_runs r where r.id = run_id)'),
    ('production_runs', '{manufacturing,kitchen}'::text[], 'company_id'),
    ('project_boq', '{projects,site,estimation}'::text[], 'company_id'),
    ('project_budgets', '{projects,site,estimation}'::text[], 'company_id'),
    ('project_certificate_lines', '{projects,site}'::text[], 'company_id'),
    ('project_certificates', '{projects,site}'::text[], 'company_id'),
    ('project_items', '{projects,site,estimation,manufacturing,purchase}'::text[], 'company_id'),
    ('project_milestones', '{projects,site}'::text[], 'company_id'),
    ('project_stages', '{projects}'::text[], 'company_id'),
    ('project_tasks', '{projects,site,service,employees,crm,documents,plot}'::text[], 'company_id'),
    ('project_variations', '{projects,site}'::text[], 'company_id'),
    ('properties', '{plot}'::text[], 'company_id'),
    ('property_activity', '{plot}'::text[], 'company_id'),
    ('property_announcements', '{plot}'::text[], 'company_id'),
    ('property_bids', '{plot}'::text[], 'company_id'),
    ('property_budget_lines', '{plot}'::text[], 'company_id'),
    ('property_budgets', '{plot}'::text[], 'company_id'),
    ('property_charge_runs', '{plot}'::text[], 'company_id'),
    ('property_charges', '{plot}'::text[], 'company_id'),
    ('property_checkins', '{plot}'::text[], 'company_id'),
    ('property_checklist_items', '{plot}'::text[], 'company_id'),
    ('property_documents', '{plot}'::text[], 'company_id'),
    ('property_meeting_items', '{plot}'::text[], 'company_id'),
    ('property_meeting_votes', '{plot}'::text[], 'company_id'),
    ('property_meetings', '{plot}'::text[], 'company_id'),
    ('property_members', '{plot}'::text[], 'company_id'),
    ('property_notices', '{plot}'::text[], 'company_id'),
    ('property_ownerships', '{plot}'::text[], 'company_id'),
    ('property_projects', '{plot}'::text[], 'company_id'),
    ('property_residents', '{plot}'::text[], 'company_id'),
    ('property_resolutions', '{plot}'::text[], 'company_id'),
    ('property_suggestions', '{plot}'::text[], 'company_id'),
    ('property_tasks', '{plot}'::text[], 'company_id'),
    ('property_tenancies', '{plot}'::text[], 'company_id'),
    ('property_units', '{plot}'::text[], 'company_id'),
    ('purchase_order_lines', '{purchase,projects,site,manufacturing,inventory,events}'::text[], 'company_id'),
    ('purchase_orders', '{purchase,projects,site,manufacturing,inventory,events}'::text[], 'company_id'),
    ('putaway_rules', '{inventory}'::text[], 'company_id'),
    ('quote_template_lines', '{sales}'::text[], 'company_id'),
    ('quote_templates', '{sales}'::text[], 'company_id'),
    ('recurring_invoice_lines', '{accounting,sales}'::text[], 'company_id'),
    ('recurring_invoices', '{accounting,sales}'::text[], 'company_id'),
    ('regions', '{kitchen,pos,settings}'::text[], 'company_id'),
    ('reordering_rules', '{inventory,purchase}'::text[], 'company_id'),
    ('report_schedules', '{insights,accounting}'::text[], 'company_id'),
    ('reports', '{insights,accounting}'::text[], 'company_id'),
    ('reservations', '{kitchen,pos,events}'::text[], 'company_id'),
    ('retention_releases', '{projects,site,accounting}'::text[], 'company_id'),
    ('rfis', '{documents,projects,site}'::text[], 'company_id'),
    ('rfq_bids', '{purchase,projects,site,estimation}'::text[], 'company_id'),
    ('rfq_lines', '{purchase,projects,site,estimation}'::text[], 'company_id'),
    ('rfq_vendors', '{purchase,projects,site,estimation}'::text[], 'company_id'),
    ('rfqs', '{purchase,projects,site,estimation}'::text[], 'company_id'),
    ('roast_batches', '{kitchen,manufacturing}'::text[], 'company_id'),
    ('royalty_invoices', '{kitchen,pos,accounting}'::text[], 'company_id'),
    ('royalty_schemes', '{kitchen,pos}'::text[], 'company_id'),
    ('sale_order_lines', '{sales,crm,projects,site,service,events}'::text[], 'company_id'),
    ('sale_orders', '{sales,crm,projects,site,service,events}'::text[], 'company_id'),
    ('sales_channels', '{sales,kitchen,pos}'::text[], 'company_id'),
    ('sales_forecasts', '{sales,crm,kitchen,pos}'::text[], 'company_id'),
    ('sales_teams', '{sales,crm}'::text[], 'company_id'),
    ('schedule_tasks', '{projects,site}'::text[], 'company_id'),
    ('service_maintenance_plans', '{service}'::text[], 'company_id'),
    ('service_ticket_lines', '{service}'::text[], 'company_id'),
    ('service_tickets', '{service}'::text[], 'company_id'),
    ('service_warranties', '{service}'::text[], 'company_id'),
    ('shift_swaps', '{employees,kitchen}'::text[], 'company_id'),
    ('shift_templates', '{employees,kitchen}'::text[], 'company_id'),
    ('shipment_items', '{purchase,inventory}'::text[], 'company_id'),
    ('shipments', '{purchase,inventory}'::text[], 'company_id'),
    ('sign_requests', '{sign,documents,sales,employees,projects}'::text[], 'company_id'),
    ('sign_signatures', '{sign,documents,sales,employees,projects}'::text[], 'company_id'),
    ('site_diaries', '{site,projects}'::text[], 'company_id'),
    ('site_hostnames', '{website}'::text[], 'company_id'),
    ('site_incidents', '{site,projects}'::text[], 'company_id'),
    ('site_pages', '{website}'::text[], 'company_id'),
    ('site_submissions', '{website,crm}'::text[], 'company_id'),
    ('sites', '{website}'::text[], 'company_id'),
    ('skills', '{employees}'::text[], 'company_id'),
    ('snags', '{site,projects,plot}'::text[], 'company_id'),
    ('sprints', '{projects,site}'::text[], 'company_id'),
    ('standing_orders', '{kitchen,purchase}'::text[], 'company_id'),
    ('stock_count_lines', '{inventory,kitchen}'::text[], 'company_id'),
    ('stock_counts', '{inventory,kitchen}'::text[], 'company_id'),
    ('stock_lots', '{inventory,purchase,sales,manufacturing,projects,site,pos,kitchen,service}'::text[], 'company_id'),
    ('stock_move_lines', '{inventory,purchase,sales,manufacturing,projects,site,pos,kitchen,service}'::text[], 'company_id'),
    ('stock_moves', '{inventory,purchase,sales,manufacturing,projects,site,pos,kitchen,service}'::text[], 'company_id'),
    ('stock_pickings', '{inventory,purchase,sales}'::text[], 'company_id'),
    ('stock_reservations', '{inventory,purchase,projects,site,manufacturing}'::text[], 'company_id'),
    ('stock_transfer_lines', '{inventory,kitchen}'::text[], 'company_id'),
    ('stock_transfers', '{inventory,kitchen}'::text[], 'company_id'),
    ('stock_valuation_layers', '{inventory,purchase,sales,manufacturing,projects,site,pos,kitchen,service}'::text[], 'company_id'),
    ('storage_categories', '{inventory}'::text[], 'company_id'),
    ('store_access', '{kitchen,pos,settings}'::text[], 'company_id'),
    ('store_audits', '{kitchen,pos}'::text[], 'company_id'),
    ('store_item_availability', '{kitchen,pos}'::text[], 'company_id'),
    ('store_tables', '{kitchen,pos}'::text[], 'company_id'),
    ('stored_value_accounts', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('stored_value_transactions', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('stores', '{kitchen,pos}'::text[], 'company_id'),
    ('subcontract_certificates', '{projects,site,purchase}'::text[], 'company_id'),
    ('subcontracts', '{projects,site,purchase}'::text[], 'company_id'),
    ('submittals', '{documents,projects,site}'::text[], 'company_id'),
    ('subscription_plans', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('subscription_redemptions', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('subscriptions', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('task_activity', '{projects,site,service,employees,crm,documents,plot}'::text[], 'company_id'),
    ('task_checklists', '{projects,site,service,employees,crm,documents,plot}'::text[], 'company_id'),
    ('task_comments', '{projects,site,service,employees,crm,documents,plot}'::text[], 'company_id'),
    ('task_labels', '{projects}'::text[], 'company_id'),
    ('task_stages', '{projects}'::text[], 'company_id'),
    ('task_watchers', '{projects,site,service,employees,crm,documents,plot}'::text[], 'company_id'),
    ('tender_lines', '{estimation,sales}'::text[], 'company_id'),
    ('tenders', '{estimation,sales}'::text[], 'company_id'),
    ('timesheets', '{projects,site,service,employees}'::text[], 'company_id'),
    ('tip_allocations', '{kitchen,pos,employees}'::text[], 'company_id'),
    ('tip_pools', '{kitchen,pos,employees}'::text[], 'company_id'),
    ('tool_movements', '{manufacturing,site}'::text[], '(select t.company_id from public.tools t where t.id = tool_id)'),
    ('tools', '{manufacturing,site}'::text[], 'company_id'),
    ('trace_seals', '{accounting,purchase,inventory}'::text[], 'company_id'),
    ('training_bookings', '{employees}'::text[], 'company_id'),
    ('training_courses', '{employees}'::text[], 'company_id'),
    ('transmittal_items', '{documents,projects,site}'::text[], 'company_id'),
    ('transmittals', '{documents,projects,site}'::text[], 'company_id'),
    ('user_company_access', '{settings}'::text[], 'company_id'),
    ('waste_entries', '{kitchen,pos,inventory}'::text[], 'company_id'),
    ('waste_reasons', '{kitchen,pos,inventory}'::text[], 'company_id'),
    ('wholesale_accounts', '{kitchen,pos,sales}'::text[], 'company_id'),
    ('work_order_operations', '{manufacturing}'::text[], 'company_id'),
    ('work_orders', '{manufacturing,site,projects}'::text[], 'company_id')
  ) as v(tbl, mods, cexpr) loop
    if to_regclass('public.' || g.tbl) is null then
      raise notice '204: %, not in this database, skipped', g.tbl;
      continue;
    end if;
    execute format('drop policy if exists rg_sel on public.%I', g.tbl);
    execute format('create policy rg_sel on public.%I as restrictive for select to authenticated using (%s in (select public.my_view_company_ids(%L::text[])))',
                   g.tbl, g.cexpr, g.mods);
  end loop;
end $gates$;

-- The people list is read by the apps that assign work to a person, and everybody
-- can always read their own record.
drop policy if exists rg_sel on public.hr_employees;
create policy rg_sel on public.hr_employees as restrictive for select to authenticated
  using (public.can_view_app(company_id, '{employees,recruitment,projects,site,service,kitchen,pos,manufacturing,installation}'::text[])
         or user_id = auth.uid());

-- A supplier's bank details also need the bank switch, not only the app.
drop policy if exists rg_bank on public.partner_bank_accounts;
create policy rg_bank on public.partner_bank_accounts as restrictive for select to authenticated
  using (public.can_see(company_id, 'bank'));