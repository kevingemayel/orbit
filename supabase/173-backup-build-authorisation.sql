-- ============================================================================
-- 173-backup-build-authorisation.sql  -  a backup is only for its own company.
--
-- backup_build runs with the database's own rights, so it reads every table
-- whatever the row-level policies say. It never checked who was asking, and it
-- was executable by the anonymous role: anyone holding the public app key and
-- a company id could download every row of that company. It now asks the same
-- question as backup_log beside it, and no function in the backup and privacy
-- set can be called without signing in.
-- Found while writing the in-app help for the Backups screen, 2026-09-14.
-- ============================================================================
create or replace function public.backup_build(p_company uuid)
 returns table(table_count integer, row_count integer, size_bytes bigint, checksum text, manifest jsonb, payload jsonb)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  pl record; doc jsonb := '{}'::jsonb; man jsonb := '{}'::jsonb;
  rows_json jsonb; n integer; total integer := 0; tcount integer := 0;
  ids uuid[]; sz bigint; sql text;
begin
  if not public.can_write_company(p_company) then
    raise exception 'Only an owner, administrator or accountant of this company can take its backup.';
  end if;

  create temp table if not exists _bk_ids (tbl text primary key, ids uuid[]) on commit drop;
  truncate _bk_ids;

  for pl in select * from public.backup_table_plan() loop
    begin
      if pl.depth = 0 then
        sql := format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb), count(*) from public.%I t where t.company_id = $1', pl.tbl);
        execute sql into rows_json, n using p_company;
      else
        select i.ids into ids from _bk_ids i where i.tbl = pl.parent;
        if ids is null or array_length(ids, 1) is null then
          rows_json := '[]'::jsonb; n := 0;
        else
          sql := format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb), count(*) from public.%I t where t.%I = any($1)', pl.tbl, pl.fk_col);
          execute sql into rows_json, n using ids;
        end if;
      end if;
    exception when others then
      rows_json := '[]'::jsonb; n := 0;
    end;

    -- remember this table's own ids so its children can be found next round
    begin
      execute format('select array_agg(x.id) from jsonb_to_recordset($1) as x(id uuid)') into ids using rows_json;
      insert into _bk_ids (tbl, ids) values (pl.tbl, ids) on conflict (tbl) do update set ids = excluded.ids;
    exception when others then
      insert into _bk_ids (tbl, ids) values (pl.tbl, null) on conflict (tbl) do nothing;
    end;

    if n > 0 then
      doc := doc || jsonb_build_object(pl.tbl, rows_json);
      man := man || jsonb_build_object(pl.tbl, n);
      total := total + n; tcount := tcount + 1;
    end if;
  end loop;

  -- the company's own row, so a restore has something to build from
  doc := doc || jsonb_build_object('_company', (select to_jsonb(c) from public.companies c where c.id = p_company));
  doc := doc || jsonb_build_object('_meta', jsonb_build_object(
    'taken_at', now(), 'company_id', p_company, 'format', 1,
    'note', 'Every row of every table belonging to this company. File attachments are stored separately and are not inside this document.'));

  sz := length(doc::text);
  return query select tcount, total, sz, md5(doc::text), man, doc;
end $function$;

-- nothing in the backup and privacy set is for a caller who has not signed in
do $g$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f' and p.proname ~ '^(backup_|gdpr_)' and p.proname <> 'backup_reminder_tick' loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $g$;
