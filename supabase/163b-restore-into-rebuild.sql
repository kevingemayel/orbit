-- The restore no longer insists you belong to the organisation named in the
-- FILE, which is exactly the thing that stops existing after a disaster. If
-- that organisation is not in this database, this is a rebuild, and the data
-- goes into the caller's own organisation instead.
create or replace function public.backup_restore_doc(p_payload jsonb, p_new_name text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  co jsonb; newco uuid; k text; r jsonb; v text; nk text; orgid uuid; fileorg uuid;
  ordered text[]; t text; i integer; pass integer; rr record;
  inserted integer := 0; failed integer := 0; perTable jsonb := '{}'::jsonb; cnt integer;
  fixed jsonb; firstErr text; errs jsonb := '{}'::jsonb; rebuilt boolean := false;
begin
  if p_payload is null or not (p_payload ? '_company') then
    raise exception 'that file is not an Orbit backup';
  end if;
  co := p_payload -> '_company';
  fileorg := (co ->> 'org_id')::uuid;
  orgid := public.backup_target_org(fileorg);
  rebuilt := (orgid is distinct from fileorg);
  if orgid is null then raise exception 'you do not belong to an organisation this can be restored into'; end if;
  if not exists (select 1 from public.org_members m where m.org_id = orgid and m.user_id = auth.uid() and m.role in ('owner','admin','accountant')) then
    raise exception 'you cannot write to that organisation';
  end if;
  if p_new_name is null or length(trim(p_new_name)) < 2 then raise exception 'give the restored company a name'; end if;

  create temp table if not exists _bk_map (old uuid primary key, new uuid) on commit drop;
  delete from _bk_map;
  create temp table if not exists _bk_retry (tbl text, row_json jsonb, why text) on commit drop;
  delete from _bk_retry;

  newco := gen_random_uuid();
  insert into _bk_map (old, new) values ((co ->> 'id')::uuid, newco);
  if rebuilt and fileorg is not null then
    insert into _bk_map (old, new) values (fileorg, orgid) on conflict (old) do nothing;
  end if;
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
    'restored_into', newco, 'name', trim(p_new_name), 'org', orgid,
    'rebuilt_into_new_org', rebuilt,
    'rows_restored', inserted, 'rows_failed', failed,
    'per_table', perTable, 'failures', errs, 'first_error', firstErr,
    'verdict', case when failed = 0 then 'Every row came back.' else 'Restored with failures. Check failures.' end);
end $fn$;
grant execute on function public.backup_restore_doc(jsonb, text) to authenticated;