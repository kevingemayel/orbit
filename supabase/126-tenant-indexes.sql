-- ============================================================================
-- 126-tenant-indexes.sql
--
-- Every RLS policy in Orbit is "company_id in (select my_company_ids())", and
-- nearly every screen also filters on company_id explicitly. That column is
-- therefore evaluated on virtually every read in the system - but 113 of the
-- 215 tables carrying it had no index leading on it, so those reads were
-- sequential scans filtered in memory. Invisible on pilot data, not invisible
-- on a real company's history.
--
-- This indexes the 73 tables that BOTH lack the index AND are queried by
-- company_id from the app. Line-item tables that are only ever fetched by
-- their parent id are deliberately left alone: their parent index already
-- narrows the scan before RLS runs, so an extra index would only cost writes.
--
-- Safe to re-run.
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array['appraisals','boms','budgets','certifications','contact_tags','crm_leads','crm_stages','delivery_methods','employee_skills','hr_attendances','hr_departments','hr_employees','hr_expenses','hr_jobs','hr_leave_allocations','hr_leaves','hr_onboarding','hr_payslip_lines','hr_payslip_runs','hr_roster','hr_salary_heads','hr_salary_structures','hr_shifts','inspection_templates','journal_entries','material_requisitions','media','package_types','payment_terms','payments','portal_access','pricelists','product_categories','project_budgets','project_tasks','project_variations','projects','property_announcements','property_charge_runs','property_checkins','property_checklist_items','property_documents','property_meetings','property_members','property_notices','property_ownerships','property_projects','property_residents','property_resolutions','property_suggestions','property_tasks','property_tenancies','putaway_rules','quote_templates','reordering_rules','retention_releases','rfq_bids','shift_templates','sign_requests','skills','stock_locations','stock_lots','stock_move_lines','stock_moves','stock_pickings','storage_categories','subcontracts','task_labels','taxes','timesheets','transmittals','uoms','warehouses']
  loop
    execute format('create index if not exists %I on public.%I (company_id)', 'idx_' || t || '_company', t);
  end loop;
end $$;

analyze;
