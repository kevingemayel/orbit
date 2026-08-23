-- ============================================================================
--  Spacework ERP  -  editable print template per company  (AFTER 69)
--  Branding for printed pages/reports: logo (data URL), header company line +
--  address, footer text, accent colour, show-logo flag. One JSON column so it
--  stays flexible. RLS on companies already applies. Additive.
-- ============================================================================

alter table public.companies add column if not exists print_settings jsonb;

select 'print template ready' as done;
