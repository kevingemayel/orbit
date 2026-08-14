-- ============================================================================
--  Spacework ERP  -  FIX: subcontracts was created (09-contractor.sql) without a
--  `created_at` column, but cfgSubcontracts (the Subcontracts list) and
--  renderSubcontractCertForm both `.order("created_at")`, so those reads errored
--  (42703) and returned nothing -> the Subcontracts list looked empty and the
--  Subcontract Certificate form always said "No subcontracts yet".
-- ============================================================================
alter table public.subcontracts add column if not exists created_at timestamptz default now();
