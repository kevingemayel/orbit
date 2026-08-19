-- ============================================================================
--  Spacework ERP  -  PROJECT lifecycle status  (run AFTER 01-50)
--  Projects had only an Active/Closed flag; add a real stage so the project list
--  can render a drag-to-move kanban. Existing rows are set to 'active'.
-- ============================================================================
alter table public.projects add column if not exists status text default 'active';

select 'project status ready' as done;
