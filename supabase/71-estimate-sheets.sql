-- ============================================================================
--  Spacework ERP  -  Excel-like breakdown sheets for estimates & IPCs (AFTER 70)
--  A "sheet" is a small spreadsheet stored as JSON: column definitions + a tree
--  of rows (each row carries an indent level for unlimited nesting, plus a cell
--  per column that holds either a literal value or an =formula). The client-side
--  engine evaluates the formulas (A1 cell references, SUM/AVG/MIN/MAX, +-*/ ()),
--  rolls up nested section totals, and derives the headline numbers.
--    * tenders.cost_sheet            -> the estimate cost buildup (our costs)
--    * project_certificates.claim_sheet -> the IPC client-valuation breakdown,
--      kept independent from cost because what we certify is not always our cost
--  One JSON column each so the shape stays flexible. RLS on both tables already
--  applies. Fully additive - existing tenders keep working (the app migrates
--  their old flat lines into a sheet on first open).
-- ============================================================================

alter table public.tenders               add column if not exists cost_sheet  jsonb;
alter table public.project_certificates  add column if not exists claim_sheet jsonb;

select 'estimate sheets ready' as done;
