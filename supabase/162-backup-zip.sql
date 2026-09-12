-- ============================================================================
-- 162-backup-zip.sql  -  the backup becomes a file you hold.
--
-- Two things were wrong with the first version, and both are fair:
--
--  1. A backup WITHOUT THE FILES is not the company. Half of what a facade job
--     or a site visit consists of is photographs and drawings, and an index of
--     them is not a copy of them.
--
--  2. A backup stored INSIDE the database it protects is not a backup. It
--     survives a person deleting a record and it does not survive anything
--     else, which is the case it exists for.
--
-- So the backup is now a zip file built in the browser and saved to the
-- machine of whoever pressed the button: the data as one JSON document, every
-- attachment beside it, and a readme. Nothing is kept in the cloud.
--
-- What stays here is the LOG: when a backup was taken, by whom, how many rows
-- and files were in it, and its checksum. That is the part a database is
-- actually good for, and it is what lets Orbit say "you have not taken one for
-- eleven days" instead of quietly hoarding copies.
-- ============================================================================

-- The payload no longer lives here. Existing ones go: they are the thing this
-- migration exists to stop doing.
alter table public.backups drop column if exists payload;
alter table public.backups add column if not exists file_count integer;
alter table public.backups add column if not exists files_bytes bigint;
alter table public.backups add column if not exists taken_by_email text;
alter table public.backups add column if not exists filename text;
alter table public.backups drop column if exists verified_at;
alter table public.backups drop column if exists verify_result;

comment on table public.backups is 'A record that a backup was taken and downloaded. The backup itself is a zip file on the person''s own machine, deliberately not here.';

-- Record one. Called by the browser once the zip has actually been saved, so
-- the log only ever contains backups that really left the building.
create or replace function public.backup_log(
  p_company uuid, p_tables integer, p_rows integer, p_files integer,
  p_bytes bigint, p_files_bytes bigint, p_checksum text, p_manifest jsonb, p_filename text)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare bid uuid; em text;
begin
  if not public.can_write_company(p_company) then raise exception 'not your company'; end if;
  select email into em from auth.users where id = auth.uid();
  insert into public.backups (company_id, kind, table_count, row_count, file_count, size_bytes, files_bytes, checksum, manifest, filename, taken_by_email)
  values (p_company, 'manual', p_tables, p_rows, p_files, p_bytes, p_files_bytes, p_checksum, p_manifest, p_filename, em)
  returning id into bid;
  update public.backup_settings
     set last_run_at = now(), last_error = null, next_run_at = now() + make_interval(hours => every_hours)
   where company_id = p_company;
  -- the log is small, but there is no reason to keep every line for ever
  delete from public.backups b
   where b.company_id = p_company
     and b.id not in (select b2.id from public.backups b2 where b2.company_id = p_company order by b2.created_at desc limit 60);
  return bid;
end $fn$;
grant execute on function public.backup_log(uuid, integer, integer, integer, bigint, bigint, text, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Restore from a document the browser read out of a zip, rather than from
-- something stored here. Same engine as before: a NEW company, every
-- identifier remapped, parents before children, three retry passes.
-- ---------------------------------------------------------------------------
create or replace function public.backup_restore_doc(p_payload jsonb, p_new_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  co jsonb; newco uuid; k text; r jsonb; v text; nk text; orgid uuid;
  ordered text[]; t text; i integer; pass integer; rr record;
  inserted integer := 0; failed integer := 0; perTable jsonb := '{}'::jsonb; cnt integer;
  fixed jsonb; firstErr text; errs jsonb := '{}'::jsonb;
begin
  if p_payload is null or not (p_payload ? '_company') then
    raise exception 'that file is not an Orbit backup';
  end if;
  co := p_payload -> '_company';
  orgid := (co ->> 'org_id')::uuid;
  if not exists (select 1 from public.org_members m where m.org_id = orgid and m.user_id = auth.uid() and m.role in ('owner','admin','accountant')) then
    raise exception 'this backup belongs to an organisation you cannot write to';
  end if;
  if p_new_name is null or length(trim(p_new_name)) < 2 then raise exception 'give the restored company a name'; end if;

  create temp table if not exists _bk_map (old uuid primary key, new uuid) on commit drop;
  truncate _bk_map;
  create temp table if not exists _bk_retry (tbl text, row_json jsonb, why text) on commit drop;
  truncate _bk_retry;

  newco := gen_random_uuid();
  insert into _bk_map (old, new) values ((co ->> 'id')::uuid, newco);
  insert into public.companies (id, org_id, name, legal_name, currency_code, country, profile)
  values (newco, orgid, trim(p_new_name), co ->> 'legal_name', co ->> 'currency_code', co ->> 'country',
          jsonb_build_object('restored_from_backup', coalesce(p_payload -> '_meta' ->> 'taken_at', 'a file'), 'restored_at', now()));

  for k in select jsonb_object_keys(p_payload) loop
    if k like '\_%' then continue; end if;
    for r in select jsonb_array_elements(p_payload -> k) loop
      if r ? 'id' and (r ->> 'id') ~* '^[0-9a-f-]{36}$' then
        insert into _bk_map (old, new) values ((r ->> 'id')::uuid, gen_random_uuid()) on conflict (old) do nothing;
      end if;
    end loop;
  end loop;

  select array_agg(tname) into ordered from (select jsonb_object_keys(p_payload) tname) x where tname not like '\_%';
  ordered := public.backup_restore_order(coalesce(ordered, '{}'));

  for i in reverse array_length(ordered, 1) .. 1 loop
    begin
      execute format('delete from public.%I where company_id = $1', ordered[i]) using newco;
    exception when others then null;
    end;
  end loop;

  foreach t in array coalesce(ordered, '{}') loop
    cnt := 0;
    for r in select jsonb_array_elements(p_payload -> t) loop
      fixed := '{}'::jsonb;
      for nk in select jsonb_object_keys(r) loop
        v := r ->> nk;
        if v is not null and v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           and exists (select 1 from _bk_map m where m.old = v::uuid) then
          fixed := fixed || jsonb_build_object(nk, (select m.new from _bk_map m where m.old = v::uuid));
        else
          fixed := fixed || jsonb_build_object(nk, r -> nk);
        end if;
      end loop;
      begin
        execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)', t, t) using fixed;
        cnt := cnt + 1; inserted := inserted + 1;
      exception when others then
        insert into _bk_retry (tbl, row_json) values (t, fixed);
      end;
    end loop;
    if cnt > 0 then perTable := perTable || jsonb_build_object(t, cnt); end if;
  end loop;

  for pass in 1..3 loop
    exit when not exists (select 1 from _bk_retry);
    for rr in select ctid, tbl, row_json from _bk_retry loop
      begin
        execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)', rr.tbl, rr.tbl) using rr.row_json;
        inserted := inserted + 1;
        perTable := jsonb_set(perTable, array[rr.tbl], to_jsonb(coalesce((perTable ->> rr.tbl)::integer, 0) + 1), true);
        delete from _bk_retry where ctid = rr.ctid;
      exception when others then
        update _bk_retry set why = left(SQLERRM, 200) where ctid = rr.ctid;
      end;
    end loop;
  end loop;

  for rr in select tbl, count(*) n, min(why) why from _bk_retry group by tbl loop
    failed := failed + rr.n;
    errs := errs || jsonb_build_object(rr.tbl, jsonb_build_object('failed', rr.n, 'why', rr.why));
    if firstErr is null then firstErr := rr.tbl || ': ' || rr.why; end if;
  end loop;

  return jsonb_build_object(
    'restored_into', newco, 'name', trim(p_new_name),
    'rows_restored', inserted, 'rows_failed', failed,
    'per_table', perTable, 'failures', errs, 'first_error', firstErr,
    'id_map_size', (select count(*) from _bk_map),
    'verdict', case when failed = 0 then 'Every row came back.' else 'Restored with failures. Check failures.' end);
end $fn$;
grant execute on function public.backup_restore_doc(jsonb, text) to authenticated;

-- After the rows are back, the browser re-uploads the files and tells Orbit
-- where each one went. Paths carry the company and the record, and both are
-- new, so the old path is meaningless in the restored copy.
create or replace function public.backup_fix_media_path(p_media uuid, p_path text)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare cid uuid;
begin
  select company_id into cid from public.media where id = p_media;
  if cid is null then return false; end if;
  if not public.can_write_company(cid) then raise exception 'not your company'; end if;
  update public.media set path = p_path where id = p_media;
  return true;
end $fn$;
grant execute on function public.backup_fix_media_path(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- No more silent cloud copies. What the schedule does now is NOTICE that
-- nobody has taken one, and say so, which is the only thing a server can
-- honestly do about a file that is supposed to live on your machine.
-- ---------------------------------------------------------------------------
drop function if exists public.backup_tick();
drop function if exists public.backup_due(text);
drop function if exists public.backup_verify(uuid);
drop function if exists public.backup_run(uuid, text);
drop function if exists public.backup_restore(uuid, text);
drop function if exists public.backup_prune(uuid);

create or replace function public.backup_reminder_tick()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare s record; n integer := 0; days integer; co text;
begin
  for s in select bs.*, c.name from public.backup_settings bs
             join public.companies c on c.id = bs.company_id
            where bs.enabled loop
    days := case when s.last_run_at is null then 999 else extract(day from now() - s.last_run_at)::integer end;
    if s.last_run_at is not null and s.last_run_at > now() - make_interval(hours => s.every_hours) then continue; end if;
    insert into public.notifications (company_id, kind, title, body, link_action, actor_name, dedupe_key)
    values (s.company_id, 'backup',
            case when s.last_run_at is null then 'No backup has ever been taken' else 'Time to take a backup' end,
            case when s.last_run_at is null
                 then 'Settings, Backups. It downloads as one file with every record and every attachment in it. Keep it somewhere that is not this computer.'
                 else 'The last one was ' || days || ' day(s) ago. Settings, Backups, then keep the file somewhere that is not this computer.' end,
            'settings.backups', 'Orbit',
            'backup-' || s.company_id::text || '-' || to_char(now(), 'YYYY-MM-DD'))
    on conflict do nothing;
    n := n + 1;
  end loop;
  return n;
end $fn$;
revoke all on function public.backup_reminder_tick() from public, anon, authenticated;

do $sched$
begin
  perform cron.unschedule('orbit-backups');
exception when others then null;
end $sched$;
do $sched$
begin
  perform cron.schedule('orbit-backup-reminder', '30 8 * * *', 'select public.backup_reminder_tick()');
exception when others then
  raise notice 'pg_cron not available';
end $sched$;
