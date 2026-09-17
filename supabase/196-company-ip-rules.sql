-- ============================================================================
-- 196-company-ip-rules.sql  -  a company can say which internet connections it
-- may be opened from, and the same can be said for one person.
--
-- The ask: "this company can only be opened on a certain IP, so employees do
-- not open company information at home", and the same rule per user.
--
-- WHERE THIS IS ENFORCED, AND WHY THERE
-- The browser talks to PostgREST directly with the publishable key plus the
-- signed-in person's JWT. Anything the app's JavaScript refuses can be asked
-- for again with curl and the same token, so a check in app.js is a courtesy,
-- not a control. The control has to sit in the database, and it sits inside the
-- membership check every policy already goes through:
--
--   my_member_in(company)   the membership + role behind every write gate
--   my_role_in(company)     the role behind app_level / can_write_app
--   my_company_ids()        the company list behind every select policy
--
-- All three now also ask public.ip_allowed(company). A blocked person is not a
-- member for the length of that request: no rows, no writes, whatever tool they
-- use. That is the whole point of putting it here rather than in 284 policies.
--
-- CAN POSTGRES SEE THE CALLER'S ADDRESS?
-- PostgREST publishes the request headers as a GUC, request.headers, which a
-- function reads with current_setting('request.headers', true)::json. Supabase
-- fronts the project domain with Cloudflare, so cf-connecting-ip should be
-- there, and x-forwarded-for behind it. THIS HAS NOT BEEN RUN. Nothing in this
-- repository proves which headers this project actually receives, so the design
-- refuses to bet on it:
--   - request_ip() returns null when it cannot read an address;
--   - ip_allowed() ALLOWS when the address is null, so a missing header can
--     never lock a company out of its own data;
--   - the trigger on company_ip_policy REFUSES to switch enforcement on while
--     request_ip() is null, and says so in plain words. So the rule can only be
--     armed on a database that has been shown to see addresses.
-- Run `select public.ip_whoami();` from the app (Settings shows it) to find out.
--
-- SPOOFING
-- A caller can put anything in x-forwarded-for; proxies APPEND, so whatever a
-- caller invents sits at the LEFT of the list and the address the edge saw sits
-- to the right of it. request_ip() therefore reads the list from the right and
-- takes the first public address, and prefers cf-connecting-ip, which the edge
-- overwrites on the way in. If this project is ever moved behind a proxy that
-- does not overwrite those headers, this rule becomes advice again.
--
-- NOT LOCKING ANYONE OUT (non-negotiable)
--   1. The organisation's OWNER is exempt, always, in every company. There is
--      always somebody who can undo a bad rule from anywhere.
--   2. A Space Work operator (is_platform_admin) is exempt, for support.
--   3. Enforcement is off until somebody turns it on, and cannot be turned on
--      from an address that is not already allowed (checked by a trigger, so
--      the app cannot skip it).
--   4. Enforcement on with an empty address list is OPEN, so deleting the last
--      address cannot shut a company.
--   5. An unreadable address is allowed, see above.
--   6. THE WAY BACK IN, from the Supabase SQL editor, where auth.uid() is null
--      and the trigger stands aside:
--          update public.company_ip_policy set mode = 'off';
--          update public.member_ip_policy  set mode = 'inherit';
--      and, if something is badly wrong with the check itself, the release
--      valve, which leaves the rules in place but stops enforcing them:
--          create or replace function public.ip_allowed(uuid) returns boolean
--            language sql immutable as $$ select true $$;
--      re-running this migration puts the real one back.
--
-- WHAT IT CANNOT STOP: a VPN into the office, a phone on 4G used as a hotspot
-- inside the office, a laptop taken home and tethered through an allowed
-- connection, remote-desktop into an office machine, a photograph of a screen,
-- or a company API key (those are not people and are not covered). It stops the
-- ordinary case: opening the company from a home broadband line.
-- ============================================================================

-- ---- 1. where the rules live ------------------------------------------------

-- the company's switch: off (open), watch (open, but mismatches are recorded),
-- on (only the addresses listed below, per the precedence in ip_allowed)
create table if not exists public.company_ip_policy (
  company_id uuid primary key references public.companies(id) on delete cascade,
  mode text not null default 'off' check (mode in ('off', 'watch', 'on')),
  updated_by uuid,
  updated_at timestamptz not null default now()
);

-- the addresses and ranges a company allows. cidr holds both families, and a
-- plain address casts to a /32 or /128, so one column covers both asks.
create table if not exists public.company_ip_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  label text not null default '',
  network cidr not null,
  active boolean not null default true,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists company_ip_rules_co_idx on public.company_ip_rules (company_id) where active;

-- the same, for one person in one company
--   inherit        follow the company rule (the default)
--   office_or_own  the company's addresses OR this person's own
--   own_only       this person's own addresses only, whatever the company says
--   anywhere       no restriction at all for this person
create table if not exists public.member_ip_policy (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  mode text not null default 'inherit' check (mode in ('inherit', 'office_or_own', 'own_only', 'anywhere')),
  updated_by uuid,
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.member_ip_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  label text not null default '',
  network cidr not null,
  active boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists member_ip_rules_cu_idx on public.member_ip_rules (company_id, user_id) where active;

-- what was refused, and what watch mode saw. Written by ip_status(), which the
-- app calls when it starts, so this is a handful of rows a day, not a log of
-- every query.
create table if not exists public.company_ip_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid,
  ip inet,
  outcome text not null check (outcome in ('blocked', 'watched')),
  mode text,
  at timestamptz not null default now()
);
create index if not exists company_ip_events_co_idx on public.company_ip_events (company_id, at desc);

-- ---- 2. reading the caller's address ----------------------------------------

-- an address no client can be sitting behind on the public internet: private,
-- loopback, link-local or carrier-grade NAT. Seeing one of these means we are
-- looking at a proxy hop, not at the person, so it is not an answer.
create or replace function public._ip_is_local(p inet) returns boolean
 language sql immutable set search_path = public as $fn$
  select p is null
      or (family(p) = 4 and (p <<= '10.0.0.0/8'::inet or p <<= '172.16.0.0/12'::inet
                             or p <<= '192.168.0.0/16'::inet or p <<= '127.0.0.0/8'::inet
                             or p <<= '169.254.0.0/16'::inet or p <<= '100.64.0.0/10'::inet))
      or (family(p) = 6 and (p <<= '::1/128'::inet or p <<= 'fc00::/7'::inet or p <<= 'fe80::/10'::inet))
$fn$;

-- one header value to an address, or null. Edges write "[2001:db8::1]:443" and
-- "203.0.113.4:51000" as often as they write a bare address.
create or replace function public._ip_text(t text) returns inet
 language plpgsql immutable set search_path = public as $fn$
declare s text; out inet;
begin
  s := btrim(coalesce(t, ''));
  if s = '' then return null; end if;
  s := regexp_replace(s, '^\[(.+)\](:[0-9]+)?$', '\1');
  if s ~ '^[0-9]{1,3}(\.[0-9]{1,3}){3}:[0-9]+$' then s := split_part(s, ':', 1); end if;
  begin out := s::inet; exception when others then return null; end;
  return out;
end $fn$;

-- the address this request came from, as far as the database can tell.
-- Null means "cannot tell", which every caller here treats as "allow".
create or replace function public.request_ip() returns inet
 language plpgsql stable set search_path = public as $fn$
declare h json; raw text; part text; cand inet;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    return null;                                  -- not a PostgREST request, or not JSON
  end;
  if h is null then return null; end if;
  -- Cloudflare sets this on the way in and overwrites whatever the caller sent,
  -- so it is the one value a browser cannot choose for itself.
  cand := public._ip_text(h ->> 'cf-connecting-ip');
  if cand is not null and not public._ip_is_local(cand) then return cand; end if;
  -- x-forwarded-for is a list. A caller can prepend anything; every proxy
  -- appends. Read it from the right and take the first public address: that is
  -- the one the nearest trusted hop wrote, and anything invented sits left of it.
  raw := coalesce(h ->> 'x-forwarded-for', '');
  if btrim(raw) <> '' then
    for part in select btrim(t.x) from unnest(string_to_array(raw, ',')) with ordinality as t(x, n) order by t.n desc loop
      cand := public._ip_text(part);
      if cand is not null and not public._ip_is_local(cand) then return cand; end if;
    end loop;
  end if;
  cand := public._ip_text(h ->> 'x-real-ip');
  if cand is not null and not public._ip_is_local(cand) then return cand; end if;
  return null;
end $fn$;

-- what the database sees, for the Settings screen. If headers_visible is false
-- or ip is null here, an IP rule cannot be enforced on this deployment and the
-- screen must say so instead of pretending.
create or replace function public.ip_whoami() returns jsonb
 language plpgsql stable security definer set search_path = public as $fn$
declare h json; ip inet;
begin
  begin h := nullif(current_setting('request.headers', true), '')::json; exception when others then h := null; end;
  ip := public.request_ip();
  return jsonb_build_object(
    'ip', case when ip is null then null else host(ip) end,
    'family', case when ip is null then null else family(ip) end,
    'headers_visible', h is not null,
    'source', case
      when h is null then null
      when public._ip_text(h ->> 'cf-connecting-ip') is not null then 'cf-connecting-ip'
      when btrim(coalesce(h ->> 'x-forwarded-for', '')) <> '' then 'x-forwarded-for'
      when btrim(coalesce(h ->> 'x-real-ip', '')) <> '' then 'x-real-ip'
      else null end);
end $fn$;

-- ---- 3. does an address match a list? ---------------------------------------
-- <<= is "contained within or equal to", and a mismatched family is simply
-- false, so an IPv4 caller against an IPv6 range is a no, never an error.

create or replace function public._ip_in_company_list(cid uuid, p inet) returns boolean
 language sql stable security definer set search_path = public as $fn$
  select p is not null and exists (
    select 1 from public.company_ip_rules r
     where r.company_id = cid and r.active and p <<= r.network)
$fn$;

create or replace function public._ip_in_person_list(cid uuid, uid uuid, p inet) returns boolean
 language sql stable security definer set search_path = public as $fn$
  select p is not null and uid is not null and exists (
    select 1 from public.member_ip_rules r
     where r.company_id = cid and r.user_id = uid and r.active and p <<= r.network)
$fn$;

-- ---- 4. the gate ------------------------------------------------------------
-- Precedence, in this order. It is written the same way in the help page so
-- that what an owner is told matches what the database does:
--   1 a Space Work operator is never blocked (support access)
--   2 the organisation's owner is never blocked, in any of their companies
--   3 the person's own setting for this company, if they have one
--   4 the company's setting
--   5 an address that cannot be read is allowed
-- The body checks "is there any rule at all" first, before 1 and 2, purely for speed:
-- when there is no rule everybody is allowed anyway, so the order above still holds.
create or replace function public.ip_allowed(cid uuid) returns boolean
 language plpgsql stable security definer set search_path = public as $fn$
declare uid uuid; oid uuid; ip inet; comode text; pmode text; has_own boolean;
begin
  if cid is null then return true; end if;
  uid := auth.uid();
  if uid is null then return true; end if;          -- a job or a server call: no person to place
  -- This runs inside my_company_ids, which sits in the select policy of every table,
  -- so the ordinary answer has to be cheap. Two primary-key lookups and out: almost
  -- nobody has a rule, and nothing else is touched when nobody does.
  select pol.mode into pmode from public.member_ip_policy pol where pol.company_id = cid and pol.user_id = uid;
  pmode := coalesce(pmode, 'inherit');
  select cp.mode into comode from public.company_ip_policy cp where cp.company_id = cid;
  comode := coalesce(comode, 'off');
  if comode <> 'on' and pmode = 'inherit' then return true; end if;
  if pmode = 'anywhere' then return true; end if;

  if public.is_platform_admin() then return true; end if;
  select c.org_id into oid from public.companies c where c.id = cid;
  if oid is null then return true; end if;
  if exists (select 1 from public.org_members om
              where om.org_id = oid and om.user_id = uid
                and coalesce(om.status, 'active') = 'active' and om.role = 'owner') then
    return true;                                    -- rule 2: the way back in always exists
  end if;

  ip := public.request_ip();
  if ip is null then return true; end if;           -- rule 5

  select exists (select 1 from public.member_ip_rules r
                  where r.company_id = cid and r.user_id = uid and r.active) into has_own;
  -- a person told "only your own addresses" but given none would be locked out
  -- of everything by an empty box, so an empty list falls back to the company rule
  if pmode = 'own_only' and has_own then
    return public._ip_in_person_list(cid, uid, ip);
  end if;
  if pmode = 'office_or_own' and has_own and public._ip_in_person_list(cid, uid, ip) then
    return true;
  end if;

  if comode <> 'on' then return true; end if;
  -- on, with nothing listed, is open: emptying the list cannot shut a company
  if not exists (select 1 from public.company_ip_rules r where r.company_id = cid and r.active) then return true; end if;
  return public._ip_in_company_list(cid, ip);
end $fn$;

-- ---- 5. the membership checks now ask ---------------------------------------
-- Identical to 190 apart from the added ip_allowed. Keep them in step: a change
-- to membership in a later migration must carry this line forward.

create or replace function public.my_member_in(cid uuid) returns public.org_members
 language sql stable security definer set search_path = public as $fn$
  select m.* from public.companies c
  join public.org_members m on m.org_id = c.org_id and m.user_id = auth.uid()
  where c.id = cid and coalesce(m.status, 'active') = 'active'
    and (m.expires_at is null or m.expires_at > now())
    and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
    and public.ip_allowed(c.id)
  limit 1
$fn$;

create or replace function public.my_role_in(cid uuid) returns public.roles
 language sql stable security definer set search_path = public as $fn$
  select r.* from public.companies c
  join public.org_members m on m.org_id = c.org_id and m.user_id = auth.uid()
  join public.roles r on r.slug = m.role and (r.org_id = c.org_id or r.org_id is null)
  where c.id = cid and coalesce(m.status, 'active') = 'active'
    and (m.expires_at is null or m.expires_at > now())
    and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
    and public.ip_allowed(c.id)
  order by (r.org_id is not null) desc
  limit 1
$fn$;

create or replace function public.my_company_ids() returns setof uuid
 language sql stable security definer set search_path = public as $fn$
  select id from public.companies where public.is_platform_admin()
  union
  select c.id from public.companies c
  join public.org_members m on m.org_id = c.org_id
  where m.user_id = auth.uid()
    and coalesce(m.status, 'active') = 'active'
    and (m.expires_at is null or m.expires_at > now())
    and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
    and public.ip_allowed(c.id)
$fn$;

-- ---- 6. what the signed-in person is allowed right now ----------------------
-- The app calls this when it starts so it can show a plain message instead of
-- a screen full of nothing. It answers for every company the person belongs to,
-- ignoring ip_allowed for the membership itself, because a blocked person has
-- to be told which company blocked them and from what address.
create or replace function public.ip_status() returns jsonb
 language plpgsql security definer set search_path = public as $fn$
declare uid uuid; ip inet; r record; list jsonb := '[]'::jsonb; blocked int := 0;
begin
  uid := auth.uid();
  if uid is null then return jsonb_build_object('ip', null, 'companies', '[]'::jsonb, 'blocked', 0); end if;
  ip := public.request_ip();
  for r in
    select c.id, c.name, coalesce(p.mode, 'off') as mode, public.ip_allowed(c.id) as allowed
      from public.companies c
      join public.org_members m on m.org_id = c.org_id and m.user_id = uid
      left join public.company_ip_policy p on p.company_id = c.id
     where coalesce(m.status, 'active') = 'active'
       and (m.expires_at is null or m.expires_at > now())
       and (m.company_ids is null or array_length(m.company_ids, 1) is null or c.id = any(m.company_ids))
     order by c.name
  loop
    list := list || jsonb_build_array(jsonb_build_object(
      'company_id', r.id, 'name', r.name, 'mode', r.mode, 'allowed', r.allowed));
    if not r.allowed then blocked := blocked + 1; end if;
    -- record a refusal, and in watch mode an address that would have been
    -- refused. Once an hour per person, address and company: this runs on every
    -- start-up and nobody needs the same line forty times.
    if (not r.allowed) or (r.mode = 'watch' and ip is not null
          and not public._ip_in_company_list(r.id, ip) and not public._ip_in_person_list(r.id, uid, ip)) then
      if not exists (select 1 from public.company_ip_events e
                      where e.company_id = r.id and e.user_id = uid
                        and e.ip is not distinct from ip and e.at > now() - interval '1 hour') then
        insert into public.company_ip_events (company_id, user_id, ip, outcome, mode)
        values (r.id, uid, ip, case when r.allowed then 'watched' else 'blocked' end, r.mode);
        delete from public.company_ip_events where company_id = r.id and at < now() - interval '90 days';
      end if;
    end if;
  end loop;
  return jsonb_build_object('ip', case when ip is null then null else host(ip) end,
                            'companies', list, 'blocked', blocked);
end $fn$;

-- ---- 7. the guard that stops a self-inflicted lockout -----------------------
-- Switching enforcement on from an address that is not on the list would shut
-- the door with the key inside. The database refuses it, so no screen, script
-- or API call can do it either. A statement run in the SQL editor has no
-- auth.uid() and is deliberately let through: that is the way back in.
create or replace function public.guard_ip_policy() returns trigger
 language plpgsql security definer set search_path = public as $fn$
declare ip inet;
begin
  new.updated_at := now();
  if auth.uid() is not null then new.updated_by := auth.uid(); end if;
  if new.mode = 'on' and auth.uid() is not null then
    ip := public.request_ip();
    if ip is null then
      raise exception 'This database cannot see the address you are connecting from, so an address rule cannot be enforced here. Leave it Off, or use Watch only.';
    end if;
    if not public._ip_in_company_list(new.company_id, ip)
       and not public._ip_in_person_list(new.company_id, auth.uid(), ip) then
      raise exception 'Add the address you are on now (%) to the allowed list before switching this on, or you would lock yourself out.', host(ip);
    end if;
  end if;
  return new;
end $fn$;
drop trigger if exists trg_guard_ip_policy on public.company_ip_policy;
create trigger trg_guard_ip_policy before insert or update on public.company_ip_policy
  for each row execute function public.guard_ip_policy();

create or replace function public.stamp_member_ip_policy() returns trigger
 language plpgsql security definer set search_path = public as $fn$
begin
  new.updated_at := now();
  if auth.uid() is not null then new.updated_by := auth.uid(); end if;
  return new;
end $fn$;
drop trigger if exists trg_stamp_member_ip_policy on public.member_ip_policy;
create trigger trg_stamp_member_ip_policy before insert or update on public.member_ip_policy
  for each row execute function public.stamp_member_ip_policy();

-- ---- 8. who may read and change the rules -----------------------------------
-- Reading: Settings Manage. The list of addresses is a map of where the
-- business works from, and a suspended member has no business holding it.
-- One exception: a person may always see their OWN entry, so they can be told
-- why they are blocked.
-- Writing: Settings Manage, and nothing else.

alter table public.company_ip_policy enable row level security;
alter table public.company_ip_rules enable row level security;
alter table public.member_ip_policy enable row level security;
alter table public.member_ip_rules enable row level security;
alter table public.company_ip_events enable row level security;

do $pol$
declare t text;
begin
  foreach t in array array['company_ip_policy', 'company_ip_rules', 'member_ip_policy', 'member_ip_rules', 'company_ip_events'] loop
    execute format('drop policy if exists ipr_r on public.%I', t);
    execute format('drop policy if exists ipr_w on public.%I', t);
    execute format('drop policy if exists ipr_u on public.%I', t);
    execute format('drop policy if exists ipr_d on public.%I', t);
    execute format($p$create policy ipr_r on public.%I for select to authenticated
                      using (company_id in (select public.my_company_ids())
                             and public.can_manage_app(company_id, '{settings}'::text[]))$p$, t);
    execute format($p$create policy ipr_w on public.%I for insert to authenticated
                      with check (company_id in (select public.my_company_ids())
                                  and public.can_manage_app(company_id, '{settings}'::text[]))$p$, t);
    execute format($p$create policy ipr_u on public.%I for update to authenticated
                      using (company_id in (select public.my_company_ids())
                             and public.can_manage_app(company_id, '{settings}'::text[]))
                      with check (company_id in (select public.my_company_ids())
                                  and public.can_manage_app(company_id, '{settings}'::text[]))$p$, t);
    execute format($p$create policy ipr_d on public.%I for delete to authenticated
                      using (company_id in (select public.my_company_ids())
                             and public.can_manage_app(company_id, '{settings}'::text[]))$p$, t);
  end loop;
end $pol$;

-- a person can always read their own two rows, so "why can I not get in" has an
-- answer on the screen rather than only in somebody else's Settings
drop policy if exists ipr_mine on public.member_ip_policy;
create policy ipr_mine on public.member_ip_policy for select to authenticated using (user_id = auth.uid());
drop policy if exists ipr_mine on public.member_ip_rules;
create policy ipr_mine on public.member_ip_rules for select to authenticated using (user_id = auth.uid());

-- the events are a record, not a workspace: nobody edits or deletes them from
-- the app. ip_status() writes them as the definer.
drop policy if exists ipr_w on public.company_ip_events;
drop policy if exists ipr_u on public.company_ip_events;
drop policy if exists ipr_d on public.company_ip_events;

-- ---- 9. grants --------------------------------------------------------------
revoke all on function public.request_ip() from public, anon;
revoke all on function public.ip_whoami() from public, anon;
revoke all on function public.ip_allowed(uuid) from public, anon;
revoke all on function public.ip_status() from public, anon;
revoke all on function public._ip_in_company_list(uuid, inet) from public, anon;
revoke all on function public._ip_in_person_list(uuid, uuid, inet) from public, anon;
grant execute on function public.request_ip() to authenticated, service_role;
grant execute on function public.ip_whoami() to authenticated, service_role;
grant execute on function public.ip_allowed(uuid) to authenticated, service_role;
grant execute on function public.ip_status() to authenticated, service_role;
grant execute on function public._ip_in_company_list(uuid, inet) to authenticated, service_role;
grant execute on function public._ip_in_person_list(uuid, uuid, inet) to authenticated, service_role;
-- request_ip is deliberately NOT security definer (it only reads a session setting),
-- so the two parsers it calls have to be executable by the caller as well
grant execute on function public._ip_text(text) to authenticated, service_role;
grant execute on function public._ip_is_local(inet) to authenticated, service_role;

select 'company ip rules ready' as done,
       (select count(*) from public.company_ip_policy where mode <> 'off') as companies_enforcing,
       (select count(*) from public.company_ip_rules) as company_addresses,
       (select count(*) from public.member_ip_rules) as person_addresses,
       public.ip_whoami() as what_the_database_sees;

-- ============================================================================
-- SELF-TEST. Not run by the migration. Uncomment the block and run it once in
-- the SQL editor to prove the rule works on real rows. It fakes a PostgREST
-- request (request.jwt.claims gives auth.uid(), request.headers gives the
-- address) and finishes by raising, so the whole transaction rolls back and
-- nothing it wrote is kept. If it prints six PASS lines, this is working.
--
-- do $t$
-- declare cid uuid; uid uuid; oid uuid; r boolean;
-- begin
--   -- somebody who is NOT the owner, in a company that has one
--   select c.id, m.user_id, c.org_id into cid, uid, oid
--     from public.companies c
--     join public.org_members m on m.org_id = c.org_id
--    where coalesce(m.status,'active') = 'active' and m.role <> 'owner'
--    limit 1;
--   if cid is null then raise exception 'no non-owner member to test with'; end if;
--
--   -- set up as the SQL editor does, with no auth.uid(), so the policy guard stands aside
--   perform set_config('request.jwt.claims', '', true);
--   perform set_config('request.headers', '', true);
--   insert into public.company_ip_rules (company_id, label, network, active)
--        values (cid, 'Head office (test)', '203.0.113.0/24'::cidr, true);
--   insert into public.company_ip_policy (company_id, mode) values (cid, 'on')
--     on conflict (company_id) do update set mode = 'on';
--
--   -- now become that person, arriving from home
--   perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
--   perform set_config('request.headers', json_build_object('cf-connecting-ip', '198.51.100.7')::text, true);
--   if public.request_ip() <> '198.51.100.7'::inet then raise exception 'FAIL 1: the address was not read'; end if;
--   raise notice 'PASS 1 the database reads the caller address';
--   if public.ip_allowed(cid) then raise exception 'FAIL 2: home was allowed'; end if;
--   raise notice 'PASS 2 an address outside the list is refused';
--   if exists (select 1 from public.my_company_ids() x where x = cid) then raise exception 'FAIL 3: my_company_ids still lists it'; end if;
--   raise notice 'PASS 3 the company drops out of my_company_ids, so every select policy closes';
--
--   -- the same person, from the office
--   perform set_config('request.headers', json_build_object('cf-connecting-ip', '203.0.113.9')::text, true);
--   if not public.ip_allowed(cid) then raise exception 'FAIL 4: the office was refused'; end if;
--   raise notice 'PASS 4 an address inside the range is allowed';
--
--   -- one person allowed to work from home
--   perform set_config('request.jwt.claims', '', true);
--   insert into public.member_ip_policy (company_id, user_id, mode) values (cid, uid, 'office_or_own')
--     on conflict (company_id, user_id) do update set mode = 'office_or_own';
--   insert into public.member_ip_rules (company_id, user_id, label, network)
--        values (cid, uid, 'Her home line', '198.51.100.7/32'::cidr);
--   perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
--   perform set_config('request.headers', json_build_object('cf-connecting-ip', '198.51.100.7')::text, true);
--   if not public.ip_allowed(cid) then raise exception 'FAIL 5: her own address was refused'; end if;
--   raise notice 'PASS 5 a person rule beats the company rule';
--
--   -- an address the database cannot read never locks anybody out
--   perform set_config('request.headers', '', true);
--   if not public.ip_allowed(cid) then raise exception 'FAIL 6: an unreadable address blocked'; end if;
--   raise notice 'PASS 6 no readable address means allowed, never a lockout';
--
--   raise exception 'SELF-TEST FINISHED: six passes, rolling back, nothing was kept';
-- end $t$;
-- ============================================================================
