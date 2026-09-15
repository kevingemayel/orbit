-- ============================================================================
-- 187-salaries-payable-and-restored-company-settings.sql
--
-- Why this exists
--
-- 1. Payroll and the Counter disagreed about where salaries are owed. A posted
--    payslip credited net pay to a liability found by its name (salary, payroll
--    or personnel, otherwise code 4000), while a Salary payment in Counter
--    started on account code 4200. Paying a salary did not clear what the
--    payslip had put there. Both now use one company pointer,
--    companies.salary_payable_account_id, chosen in Settings, Companies. It is
--    filled here with the account payroll has been posting net pay to, so
--    posted payslips and the salaries paid against them meet in one account.
--    A company where neither exists is left empty: payroll then refuses to post
--    and says to choose the account, instead of guessing one.
--
-- 2. A company restored from a backup came back with only its name, legal
--    name, currency and country. companies.profile (address, phones, logo, WPS
--    codes, localisation), the print settings, the tax number and the accounts
--    chosen in Settings, Companies were left behind. Both restore functions now
--    carry them across, each account pointed at its restored copy. The two
--    functions below are the versions from 161-backups.sql (backup_restore) and
--    163b-restore-into-rebuild.sql (backup_restore_doc), unchanged except for
--    the one call that restores those settings.
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Salaries payable
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists salary_payable_account_id uuid references public.accounts(id) on delete set null;

update public.companies c
   set salary_payable_account_id = coalesce(
         (select a.id from public.accounts a
           where a.company_id = c.id
             and coalesce(a.is_active, true)
             and coalesce(a.type_code, '') like 'liability%'
             and a.name ~* '(salar|payroll|personnel)'
           order by a.code, a.id
           limit 1),
         (select a.id from public.accounts a
           where a.company_id = c.id
             and coalesce(a.is_active, true)
             and coalesce(a.type_code, '') like 'liability%'
             and a.code = '4000'
           order by a.id
           limit 1))
 where c.salary_payable_account_id is null;

-- ---------------------------------------------------------------------------
-- 2. The company's own settings, carried into a restored copy
-- ---------------------------------------------------------------------------
-- p_co is the "_company" section of the backup. Called at the end of a restore,
-- after every row is back, while the restore's _bk_map (old id -> new id) is
-- still there, so an account pointer can be moved onto the restored account.
create or replace function public.backup_restore_company_settings(p_newco uuid, p_co jsonb)
returns void
language plpgsql
set search_path = public
as $fn$
declare col record; v text; mapped uuid;
begin
  if p_newco is null or p_co is null then return; end if;

  -- the Company Profile from the file, with the restore markers kept on top
  if jsonb_typeof(p_co -> 'profile') = 'object' then
    update public.companies c
       set profile = (p_co -> 'profile') || coalesce(c.profile, '{}'::jsonb)
     where c.id = p_newco;
  end if;

  -- plain settings kept on the company row
  for col in
    select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'companies'
       and column_name in ('print_settings', 'tax_id')
  loop
    if p_co ? col.column_name then
      begin
        execute format('update public.companies set %I = (jsonb_populate_record(null::public.companies, $1)).%I where id = $2',
                       col.column_name, col.column_name)
          using p_co, p_newco;
      exception when others then null;   -- a value that no longer fits is left as it is
      end;
    end if;
  end loop;

  -- account and journal pointers, moved onto the restored rows
  for col in
    select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'companies'
       and data_type = 'uuid'
       and (column_name like '%\_account\_id' or column_name like '%\_journal\_id')
  loop
    v := p_co ->> col.column_name;
    continue when v is null or v !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    mapped := null;
    begin
      select m.new into mapped from _bk_map m where m.old = v::uuid;
      if mapped is not null then
        execute format('update public.companies set %I = $1 where id = $2', col.column_name) using mapped, p_newco;
      end if;
    exception when others then null;   -- no map, or the account did not come back
    end;
  end loop;
end $fn$;

revoke all on function public.backup_restore_company_settings(uuid, jsonb) from public;
revoke all on function public.backup_restore_company_settings(uuid, jsonb) from anon;
revoke all on function public.backup_restore_company_settings(uuid, jsonb) from authenticated;

-- ---------------------------------------------------------------------------
-- backup_restore_doc: as in 163b-restore-into-rebuild.sql, plus the settings
-- ---------------------------------------------------------------------------
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
  if not public.is_org_admin(orgid) then
    raise exception 'you cannot write to that organisation';
  end if;
  if p_new_name is null or length(trim(p_new_name)) < 2 then raise exception 'give the restored company a name'; end if;

  create temp table if not exists _bk_map (old uuid primary key, new uuid) on commit drop;
  truncate _bk_map;
  create temp table if not exists _bk_retry (tbl text, row_json jsonb, why text) on commit drop;
  truncate _bk_retry;

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

  -- the company's own settings: profile, print settings, tax number, account pointers
  perform public.backup_restore_company_settings(newco, co);

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


-- backup_restore(uuid, text), the older restore from a stored backup, is not
-- recreated here: 162-backup-zip.sql dropped it on purpose, and backup_restore_doc
-- above is the only restore path the app uses.
