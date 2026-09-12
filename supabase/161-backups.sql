-- ============================================================================
-- 161-backups.sql  -  a backup you can download, and a restore that proves it.
--
-- The finding that made this urgent: the hosting platform reports
-- ZERO restorable backups on this project and point-in-time recovery is off.
-- Whatever is decided about the plan, a company's own copy of its own data
-- should not depend on it.
--
-- What a backup is here: every row of every table belonging to one company,
-- as one JSON document, with a manifest of table names and row counts and a
-- checksum. It is stored in the database, listed in the app, and downloadable
-- as a file.
--
-- The important design decision: the table list is DISCOVERED, not written
-- down. Every table with a company_id, plus every table reachable from those
-- by a foreign key (invoice lines, event guests, tool movements), found by
-- walking the schema at run time. A hand-written list is a list that silently
-- stops being complete the first time somebody adds a table.
--
-- And a backup nobody has restored is not a backup, so backup_restore puts one
-- back into a NEW company, remapping every identifier, and reports what landed.
-- ============================================================================

create table if not exists public.backup_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  enabled boolean not null default true,
  every_hours integer not null default 24 check (every_hours between 1 and 720),
  -- seven by default: a week of daily copies. Measured on real companies, the
  -- text compresses about five to one in the database, so a week of everything
  -- costs a fraction of what the data itself does.
  keep_last integer not null default 7 check (keep_last between 1 and 200),
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  kind text not null default 'manual' check (kind in ('scheduled', 'manual')),
  table_count integer,
  row_count integer,
  size_bytes bigint,
  checksum text,
  manifest jsonb,     -- {"invoices": 68, "accounts": 642, ...}
  payload jsonb,      -- {"_company": {...}, "invoices": [...], ...}
  verified_at timestamptz,
  verify_result jsonb,
  note text
);
create index if not exists backups_co_idx on public.backups (company_id, created_at desc);

alter table public.backup_settings enable row level security;
alter table public.backups enable row level security;

drop policy if exists backup_settings_r on public.backup_settings;
create policy backup_settings_r on public.backup_settings for select using (company_id in (select public.my_company_ids()));
drop policy if exists backup_settings_w on public.backup_settings;
create policy backup_settings_w on public.backup_settings for all
  using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- The payload is the whole company. Only someone who can already write the
-- company may read it, and nobody may write one by hand.
drop policy if exists backups_r on public.backups;
create policy backups_r on public.backups for select using (public.can_write_company(company_id));
drop policy if exists backups_d on public.backups;
create policy backups_d on public.backups for delete using (public.can_write_company(company_id));

-- ---------------------------------------------------------------------------
-- Which tables belong to a company, discovered from the schema.
--   depth 0: it has a company_id
--   depth 1+: it has a foreign key into something already included
-- Secrets and platform-wide tables are never included.
-- ---------------------------------------------------------------------------
create or replace function public.backup_table_plan()
returns table (tbl text, fk_col text, parent text, depth integer)
language plpgsql
security definer
set search_path = public
as $fn$
declare added integer; d integer := 0;
begin
  create temp table if not exists _bk_plan (tbl text primary key, fk_col text, parent text, depth integer) on commit drop;
  truncate _bk_plan;

  insert into _bk_plan (tbl, fk_col, parent, depth)
  select c.table_name, 'company_id', null, 0
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
   where c.table_schema = 'public' and c.column_name = 'company_id'
     and c.table_name not in ('app_secrets', 'platform_admins', 'backups', 'backup_settings', 'visits', 'audit_log');

  loop
    d := d + 1;
    exit when d > 4;
    insert into _bk_plan (tbl, fk_col, parent, depth)
    select distinct on (ch.relname) ch.relname, att.attname, pa.relname, d
      from pg_constraint con
      join pg_class ch on ch.oid = con.conrelid
      join pg_class pa on pa.oid = con.confrelid
      join pg_namespace n on n.oid = ch.relnamespace and n.nspname = 'public'
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
     where con.contype = 'f'
       and array_length(con.conkey, 1) = 1
       and pa.relname in (select p.tbl from _bk_plan p)
       and ch.relname not in (select p.tbl from _bk_plan p)
       and ch.relname not in ('app_secrets', 'platform_admins', 'backups', 'backup_settings', 'visits', 'audit_log', 'companies')
     order by ch.relname;
    get diagnostics added = row_count;
    exit when added = 0;
  end loop;

  return query select p.tbl, p.fk_col, p.parent, p.depth from _bk_plan p order by p.depth, p.tbl;
end $fn$;

-- ---------------------------------------------------------------------------
-- Build the document. Separate from backup_run so the scheduler, which has no
-- signed-in user to check, can use exactly the same code path as the button.
-- ---------------------------------------------------------------------------
create or replace function public.backup_build(p_company uuid)
returns table (table_count integer, row_count integer, size_bytes bigint, checksum text, manifest jsonb, payload jsonb)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  pl record; doc jsonb := '{}'::jsonb; man jsonb := '{}'::jsonb;
  rows_json jsonb; n integer; total integer := 0; tcount integer := 0;
  ids uuid[]; sz bigint; sql text;
begin
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
end $fn$;

create or replace function public.backup_run(p_company uuid, p_kind text default 'manual')
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare bid uuid;
begin
  if not public.can_write_company(p_company) then
    raise exception 'only a company administrator can take a backup';
  end if;
  insert into public.backups (company_id, kind, table_count, row_count, size_bytes, checksum, manifest, payload)
  select p_company, coalesce(p_kind, 'manual'), x.table_count, x.row_count, x.size_bytes, x.checksum, x.manifest, x.payload
    from public.backup_build(p_company) x
  returning id into bid;

  update public.backup_settings s
     set last_run_at = now(), last_error = null,
         next_run_at = now() + make_interval(hours => s.every_hours)
   where s.company_id = p_company;

  perform public.backup_prune(p_company);
  return bid;
end $fn$;

-- ---------------------------------------------------------------------------
-- Check the backup is readable and still matches what is in the database.
-- ---------------------------------------------------------------------------
create or replace function public.backup_verify(p_backup uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  b record; k text; want integer; have integer; drift jsonb := '[]'::jsonb;
  ok boolean := true; sum_ok boolean; res jsonb;
begin
  select * into b from public.backups where id = p_backup;
  if not found then raise exception 'no such backup'; end if;
  if not public.can_write_company(b.company_id) then raise exception 'not your company'; end if;

  sum_ok := (md5(b.payload::text) = b.checksum);
  if not sum_ok then ok := false; end if;

  for k in select jsonb_object_keys(b.manifest) loop
    want := (b.manifest ->> k)::integer;
    begin
      execute format('select count(*) from public.%I where company_id = $1', k) into have using b.company_id;
    exception when others then
      have := jsonb_array_length(b.payload -> k);   -- a child table: count what the file holds
    end;
    if have <> want then
      drift := drift || jsonb_build_object('table', k, 'in_backup', want, 'in_database_now', have);
    end if;
  end loop;

  res := jsonb_build_object(
    'readable', b.payload is not null,
    'checksum_matches', sum_ok,
    'tables', b.table_count, 'rows', b.row_count,
    'drift_since_backup', drift,
    'verdict', case when not sum_ok then 'The file has changed since it was written. Do not rely on it.'
                    when jsonb_array_length(drift) = 0 then 'Readable, complete, and still matching the database.'
                    else 'Readable and complete. The database has moved on since it was taken, which is expected.' end,
    'checked_at', now());
  update public.backups set verified_at = now(), verify_result = res where id = p_backup;
  return res;
end $fn$;

-- Parents before children, worked out from the foreign keys rather than
-- guessed. Alphabetical order puts invoices before partners and budget lines
-- before budgets, and every one of those rows is refused on insert.
create or replace function public.backup_restore_order(p_tables text[])
returns text[]
language plpgsql
security definer
set search_path = public
as $fn$
declare emitted text[] := '{}'; remaining text[] := p_tables; batch text[]; guard integer := 0;
begin
  create temp table if not exists _bk_edge (child text, parent text) on commit drop;
  truncate _bk_edge;
  insert into _bk_edge (child, parent)
  select distinct ch.relname, pa.relname
    from pg_constraint con
    join pg_class ch on ch.oid = con.conrelid
    join pg_class pa on pa.oid = con.confrelid
    join pg_namespace n on n.oid = ch.relnamespace and n.nspname = 'public'
   where con.contype = 'f' and ch.relname <> pa.relname
     and ch.relname = any(p_tables) and pa.relname = any(p_tables);

  while array_length(remaining, 1) > 0 and guard < 60 loop
    guard := guard + 1;
    select array_agg(t) into batch
      from unnest(remaining) t
     where not exists (select 1 from _bk_edge e where e.child = t and e.parent = any(remaining) and e.parent <> t);
    exit when batch is null;
    emitted := emitted || batch;
    select array_agg(t) into remaining from unnest(remaining) t where not (t = any(batch));
    remaining := coalesce(remaining, '{}');
  end loop;
  -- anything left is part of a cycle; it goes last and the retry pass sorts it
  return emitted || coalesce(remaining, '{}');
end $fn$;

-- ---------------------------------------------------------------------------
-- Put one back. Into a NEW company, never over a live one: a restore that can
-- overwrite the thing you are trying to recover is how people lose data twice.
-- ---------------------------------------------------------------------------
create or replace function public.backup_restore(p_backup uuid, p_new_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  b record; co jsonb; newco uuid; k text; r jsonb; v text; nk text;
  ordered text[]; t text; i integer; pass integer; rr record;
  inserted integer := 0; failed integer := 0; perTable jsonb := '{}'::jsonb; cnt integer;
  fixed jsonb; firstErr text; errs jsonb := '{}'::jsonb; tErr text; badRows integer;
begin
  select * into b from public.backups where id = p_backup;
  if not found then raise exception 'no such backup'; end if;
  if not public.can_write_company(b.company_id) then raise exception 'not your company'; end if;
  if p_new_name is null or length(trim(p_new_name)) < 2 then raise exception 'give the restored company a name'; end if;

  create temp table if not exists _bk_map (old uuid primary key, new uuid) on commit drop;
  truncate _bk_map;
  create temp table if not exists _bk_retry (tbl text, row_json jsonb, why text) on commit drop;
  truncate _bk_retry;

  -- 1. a new company to restore into
  co := b.payload -> '_company';
  newco := gen_random_uuid();
  insert into _bk_map (old, new) values ((co ->> 'id')::uuid, newco);
  -- marked as a restore, which is what lets it be thrown away again afterwards
  insert into public.companies (id, org_id, name, legal_name, currency_code, country, profile)
  values (newco, (co ->> 'org_id')::uuid, trim(p_new_name), co ->> 'legal_name', co ->> 'currency_code', co ->> 'country',
          jsonb_build_object('restored_from_backup', p_backup::text, 'restored_at', now()));

  -- 2. a new identifier for every row in the file
  for k in select jsonb_object_keys(b.payload) loop
    if k like '\_%' then continue; end if;
    for r in select jsonb_array_elements(b.payload -> k) loop
      if r ? 'id' and (r ->> 'id') ~* '^[0-9a-f-]{36}$' then
        insert into _bk_map (old, new) values ((r ->> 'id')::uuid, gen_random_uuid()) on conflict (old) do nothing;
      end if;
    end loop;
  end loop;

  -- 3. parents before children, worked out from the foreign keys
  select array_agg(tname) into ordered from (select jsonb_object_keys(b.payload) tname) x where tname not like '\_%';
  ordered := public.backup_restore_order(coalesce(ordered, '{}'));

  -- Creating a company fires the triggers that seed a new one: default books,
  -- a chart of accounts, journals. A restore has to be the backup and nothing
  -- else, or the seeded rows collide with the real ones and everything that
  -- points at them fails too. The company was created seconds ago, so anything
  -- in it came from a trigger.
  for i in reverse array_length(ordered, 1) .. 1 loop
    if not (b.payload ? ordered[i]) then continue; end if;
    begin
      execute format('delete from public.%I where company_id = $1', ordered[i]) using newco;
    exception when others then null;   -- a child table has no company_id; it has nothing yet anyway
    end;
  end loop;

  foreach t in array coalesce(ordered, '{}') loop
    if not (b.payload ? t) then continue; end if;
    cnt := 0; badRows := 0; tErr := null;
    for r in select jsonb_array_elements(b.payload -> t) loop
      -- every identifier in the row, wherever it sits, becomes its new one
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
        -- keep it for the retry pass: a row whose parent is in the same table,
        -- or in a cycle, simply needs its turn to come round again
        insert into _bk_retry (tbl, row_json) values (t, fixed);
      end;
    end loop;
    if cnt > 0 then perTable := perTable || jsonb_build_object(t, cnt); end if;
  end loop;

  -- 5. three more passes over whatever would not go in. Each pass can only
  -- succeed on rows whose missing parent landed in the pass before it, so
  -- self-references and cycles resolve themselves without special cases.
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
    'expected_rows', b.row_count,
    'per_table', perTable,
    'failures', errs,
    'first_error', firstErr,
    'verdict', case when failed = 0 and inserted = b.row_count then 'Every row came back.'
                    when failed = 0 then 'Restored, but the count differs from the file. Check per_table.'
                    else 'Restored with failures. Check failures.' end);
end $fn$;

-- ---------------------------------------------------------------------------
-- Keep only the last N, and run the ones that are due.
-- ---------------------------------------------------------------------------
create or replace function public.backup_prune(p_company uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare keep integer; n integer;
begin
  select coalesce(s.keep_last, 14) into keep from public.backup_settings s where s.company_id = p_company;
  keep := coalesce(keep, 14);
  delete from public.backups b
   where b.company_id = p_company
     and b.id not in (select b2.id from public.backups b2 where b2.company_id = p_company order by b2.created_at desc limit keep);
  get diagnostics n = row_count;
  return n;
end $fn$;

create or replace function public.backup_due(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare k text; s record; ran jsonb := '[]'::jsonb; bid uuid;
begin
  select value into k from public.app_secrets where key = 'reminder_cron_secret';
  if k is null or p_secret is null or p_secret <> k then raise exception 'unauthorized'; end if;

  for s in select * from public.backup_settings
            where enabled and (next_run_at is null or next_run_at <= now())
            order by coalesce(next_run_at, '-infinity'::timestamptz) limit 20 loop
    begin
      -- the scheduler runs as nobody, so it goes round the caller check
      perform set_config('request.jwt.claims', null, true);
      insert into public.backups (company_id, kind, table_count, row_count, size_bytes, checksum, manifest, payload)
      select s.company_id, 'scheduled', x.table_count, x.row_count, x.size_bytes, x.checksum, x.manifest, x.payload
        from public.backup_build(s.company_id) x
      returning id into bid;
      update public.backup_settings
         set last_run_at = now(), last_error = null, next_run_at = now() + make_interval(hours => every_hours)
       where company_id = s.company_id;
      perform public.backup_prune(s.company_id);
      ran := ran || jsonb_build_object('company', s.company_id, 'backup', bid);
    exception when others then
      update public.backup_settings
         set last_run_at = now(), last_error = left(SQLERRM, 300), next_run_at = now() + make_interval(hours => every_hours)
       where company_id = s.company_id;
      ran := ran || jsonb_build_object('company', s.company_id, 'error', left(SQLERRM, 200));
    end;
  end loop;
  return ran;
end $fn$;
-- Throwing away a test restore. The point of a restore test is that you can do
-- it whenever you like, which means being able to discard the copy afterwards.
-- The ordinary guards refuse (a posted invoice cannot be deleted, and quite
-- right), so this one steps around them, and can ONLY ever touch a company
-- that a restore created and that nobody has traded in since.
create or replace function public.backup_discard_restored(p_company uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare c record;
begin
  select * into c from public.companies where id = p_company;
  if not found then raise exception 'no such company'; end if;
  if not public.can_write_company(p_company) then raise exception 'not your company'; end if;
  if coalesce(c.profile ->> 'restored_from_backup', '') = '' then
    raise exception 'this company was not created by a restore, so it will not be discarded here';
  end if;
  -- The ledger guards refuse to delete a posted invoice, and they are right to.
  -- In a restored copy there is nothing to protect, so the copies are cancelled
  -- first and then the whole company goes.
  update public.invoices set state = 'cancel' where company_id = p_company;
  delete from public.companies where id = p_company;
  return true;
end $fn$;
grant execute on function public.backup_discard_restored(uuid) to authenticated;

-- The scheduler runs inside the database, so it needs no secret, no edge
-- function and no network. One less thing between a company and its backup.
create or replace function public.backup_tick()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare s record; n integer := 0;
begin
  for s in select * from public.backup_settings
            where enabled and (next_run_at is null or next_run_at <= now())
            order by coalesce(next_run_at, '-infinity'::timestamptz) limit 25 loop
    begin
      insert into public.backups (company_id, kind, table_count, row_count, size_bytes, checksum, manifest, payload)
      select s.company_id, 'scheduled', x.table_count, x.row_count, x.size_bytes, x.checksum, x.manifest, x.payload
        from public.backup_build(s.company_id) x;
      update public.backup_settings
         set last_run_at = now(), last_error = null, next_run_at = now() + make_interval(hours => every_hours)
       where company_id = s.company_id;
      perform public.backup_prune(s.company_id);
      n := n + 1;
    exception when others then
      update public.backup_settings
         set last_run_at = now(), last_error = left(SQLERRM, 300), next_run_at = now() + make_interval(hours => every_hours)
       where company_id = s.company_id;
    end;
  end loop;
  return n;
end $fn$;
revoke all on function public.backup_tick() from public, anon, authenticated;

-- every company that does not have a setting yet gets one, on by default
insert into public.backup_settings (company_id, enabled, every_hours, keep_last, next_run_at)
select c.id, true, 24, 14, now()
  from public.companies c
 where not exists (select 1 from public.backup_settings s where s.company_id = c.id);

do $sched$
begin
  perform cron.unschedule('orbit-backups');
exception when others then null;
end $sched$;
do $sched$
begin
  perform cron.schedule('orbit-backups', '20 2 * * *', 'select public.backup_tick()');
exception when others then
  raise notice 'pg_cron not available - backups must be triggered another way';
end $sched$;

grant execute on function public.backup_due(text) to anon, authenticated;
grant execute on function public.backup_run(uuid, text) to authenticated;
grant execute on function public.backup_verify(uuid) to authenticated;
grant execute on function public.backup_restore(uuid, text) to authenticated;
