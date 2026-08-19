-- ============================================================================
--  Spacework ERP  -  STRUCTURE  (run AFTER 01-48)
--  * Subcompanies: a company may name a parent, so a group can model a holding
--    -> subsidiary tree. Purely organisational; each company keeps its own books
--    and its own row-level isolation (a child is NOT auto-visible to the parent).
--  * Split phone numbers: keep the single display string every screen already
--    uses, but also remember the parts (country code / area / number) so the
--    three-field editor round-trips without re-parsing.
-- ============================================================================

alter table public.companies add column if not exists parent_company_id uuid references public.companies(id) on delete set null;
create index if not exists idx_companies_parent on public.companies(parent_company_id);

alter table public.partners add column if not exists phone_cc   text;
alter table public.partners add column if not exists phone_area text;
alter table public.partners add column if not exists phone_num  text;

alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists phone_cc   text;
alter table public.profiles add column if not exists phone_area text;
alter table public.profiles add column if not exists phone_num  text;
alter table public.profiles add column if not exists avatar_path text;

select 'structure ready' as done;
