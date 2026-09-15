-- ============================================================================
-- 181-project-codes.sql  -  a project code is a short, unique abbreviation.
--
-- Suppliers are never told a project's real name. RFQs and purchase orders
-- carry the project's code instead, so a supplier can follow up by code. The
-- column existed but was optional and mostly an empty string. Empty codes are
-- cleared, codes are kept in upper case, and no two projects of one company can
-- share a code, so a code always points at exactly one project.
-- ============================================================================
update public.projects set code = null where code is not null and btrim(code) = '';
update public.projects set code = upper(btrim(code)) where code is not null and code <> upper(btrim(code));
create unique index if not exists projects_company_code_uq
  on public.projects (company_id, upper(btrim(code))) where code is not null and btrim(code) <> '';
