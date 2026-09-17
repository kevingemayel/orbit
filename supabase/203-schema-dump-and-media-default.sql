-- 203: two holes found by the security review.
--
-- 1. backup_schema_sql() writes out the entire database structure: every table, every
--    column, every function body and every security policy. It runs with the database's
--    own rights and was executable by any signed-in user of any tenant, with no caller
--    check at all. It is a backup tool, so it now asks for the same thing the backup
--    itself asks for: Manage in Settings, in at least one company the caller belongs to.
--
-- 2. media_visible(path) decided whether a stored file may be read, and it answered
--    "yes" for any path that had no row in media. That is allow by default: an object
--    that never got its media row, or whose row was deleted, was readable by anyone who
--    could guess the path inside an org folder. It now answers yes only for a file that
--    has a row belonging to a company the caller is in. Checked before writing: all 233
--    stored objects have a media row and every row has a company, so nothing that is
--    reachable today stops being reachable.
-- Safe to re-run.

create or replace function public.backup_schema_sql_allowed() returns boolean
  language sql stable security definer set search_path = public as $fn$
  select public.is_platform_admin() or exists (
    select 1 from public.companies c
     where c.id in (select public.my_company_ids())
       and public.can_manage_app(c.id, '{settings}'::text[]));
$fn$;
revoke all on function public.backup_schema_sql_allowed() from public, anon;
grant execute on function public.backup_schema_sql_allowed() to authenticated, service_role;

do $mig$
declare def text;
begin
  select pg_get_functiondef('public.backup_schema_sql()'::regprocedure) into def;
  if position('backup_schema_sql_allowed' in def) > 0 then
    raise notice '203: backup_schema_sql already gated, skipped';
  else
    def := replace(def,
      E'begin\n  out := out ||',
      E'begin\n  if not public.backup_schema_sql_allowed() then\n    raise exception ''Writing out the database structure needs Manage in Settings on your role.'';\n  end if;\n  out := out ||');
    if position('backup_schema_sql_allowed' in def) = 0 then
      raise exception '203: could not find where to add the caller check to backup_schema_sql';
    end if;
    execute def;
  end if;
end $mig$;

-- a stored file is readable only through a media row that belongs to one of your companies
create or replace function public.media_visible(p_path text) returns boolean
  language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.media m
                  where m.path = p_path
                    and m.company_id is not null
                    and m.company_id in (select public.my_company_ids()));
$fn$;
