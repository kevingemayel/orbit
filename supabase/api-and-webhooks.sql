-- ============================================================================
--  Orbit ERP  -  Public API + Webhooks
--  Paste into the Supabase SQL editor and Run once.
--
--  Design (no service-role key ever leaves Postgres):
--   * api_keys / webhook_endpoints tables have RLS that DENIES all direct client
--     access. Everything goes through SECURITY DEFINER functions below.
--   * The app (a signed-in owner/admin) manages keys + webhooks via functions that
--     check can_write_company().
--   * The public gateway (Cloudflare function /api/v1/*) calls api_authenticate /
--     api_query / api_write with only the customer's API key - those functions
--     validate the key, resolve its company, and force company scoping. A key can
--     only ever touch its own company's rows, and only whitelisted resources/columns.
--   * Writes are limited to safe master data (contacts, products, projects). Invoices,
--     purchase orders and payments are READ-ONLY over the API until a security review.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
--  Tables
-- ---------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'API key',
  prefix text not null,                       -- shown in the UI (never the full key)
  key_hash text not null,                     -- sha256 hex of the full key; the key itself is never stored
  scopes text[] not null default '{read}',    -- {read} or {read,write}
  created_by uuid,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists idx_api_keys_company on public.api_keys(company_id);
create index if not exists idx_api_keys_hash on public.api_keys(key_hash);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  url text not null,
  secret text not null,                       -- HMAC-SHA256 signing secret (shown to the owner once)
  events text[] not null default '{}',        -- e.g. {invoice.created, purchase_order.confirmed, payment.recorded}
  active boolean not null default true,
  created_at timestamptz default now(),
  last_delivery_at timestamptz,
  last_status int
);
create index if not exists idx_webhooks_company on public.webhook_endpoints(company_id);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  endpoint_id uuid references public.webhook_endpoints(id) on delete cascade,
  event text,
  status_code int,
  created_at timestamptz default now()
);
create index if not exists idx_whd_endpoint on public.webhook_deliveries(endpoint_id);

-- Deny all direct client access; access is only via the SECURITY DEFINER functions.
alter table public.api_keys enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
-- (no permissive policies => no anon/authenticated row access)

-- ---------------------------------------------------------------------------
--  Key management (called by the signed-in app; guarded by can_write_company)
-- ---------------------------------------------------------------------------
create or replace function public.api_key_create(p_company uuid, p_name text, p_scopes text[])
returns text language plpgsql security definer set search_path=public as $$
declare v_key text; v_scopes text[];
begin
  if not public.can_write_company(p_company) then raise exception 'not allowed'; end if;
  v_scopes := case when p_scopes && array['write'] then array['read','write'] else array['read'] end;
  v_key := 'orbit_live_' || encode(gen_random_bytes(24), 'hex');   -- 48 hex chars of entropy
  insert into public.api_keys(company_id, name, prefix, key_hash, scopes, created_by)
  values (p_company, coalesce(nullif(trim(p_name),''),'API key'), substring(v_key,1,18) || '...',
          encode(digest(v_key,'sha256'),'hex'), v_scopes, auth.uid());
  return v_key;   -- shown to the user ONCE; only its hash is stored
end $$;

create or replace function public.api_key_list(p_company uuid)
returns table(id uuid, name text, prefix text, scopes text[], created_at timestamptz, last_used_at timestamptz, revoked_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not public.can_write_company(p_company) then raise exception 'not allowed'; end if;
  return query select k.id,k.name,k.prefix,k.scopes,k.created_at,k.last_used_at,k.revoked_at
    from public.api_keys k where k.company_id = p_company order by k.created_at desc;
end $$;

create or replace function public.api_key_revoke(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_co uuid;
begin
  select company_id into v_co from public.api_keys where id = p_id;
  if v_co is null or not public.can_write_company(v_co) then raise exception 'not allowed'; end if;
  update public.api_keys set revoked_at = now() where id = p_id;
end $$;

-- ---------------------------------------------------------------------------
--  Public gateway helpers (called with only the API key)
-- ---------------------------------------------------------------------------
create or replace function public.api_authenticate(p_key text)
returns table(company_id uuid, scopes text[]) language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_co uuid; v_scopes text[];
begin
  select id, api_keys.company_id, api_keys.scopes into v_id, v_co, v_scopes
    from public.api_keys where key_hash = encode(digest(coalesce(p_key,''),'sha256'),'hex') and revoked_at is null;
  if v_id is null then return; end if;
  update public.api_keys set last_used_at = now() where id = v_id;
  return query select v_co, v_scopes;
end $$;

-- Whitelisted READ. Resources map to a safe set of columns; company scoping is forced.
create or replace function public.api_query(p_key text, p_resource text, p_id uuid, p_limit int, p_offset int)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_co uuid; v_scopes text[]; v_lim int; v_off int; v_res jsonb; v_sql text; v_cols text; v_tbl text;
begin
  select company_id, scopes into v_co, v_scopes from public.api_authenticate(p_key);
  if v_co is null then raise exception 'unauthorized'; end if;
  v_lim := least(greatest(coalesce(p_limit,50),1),200); v_off := greatest(coalesce(p_offset,0),0);
  case p_resource
    when 'contacts' then v_tbl:='partners'; v_cols:='id,name,email,phone,vat,is_company,is_customer,is_vendor,industry,created_at';
    when 'products' then v_tbl:='products'; v_cols:='id,name,default_code,type,list_price,cost_price,uom,family,is_active,created_at';
    when 'projects' then v_tbl:='projects'; v_cols:='id,name,code,partner_id,contract_value,status,is_active,date_start,date_deadline,created_at';
    when 'invoices' then v_tbl:='invoices'; v_cols:='id,number,move_type,partner_id,project_id,invoice_date,due_date,state,amount_untaxed,amount_tax,amount_total,amount_residual,currency_code';
    when 'purchase_orders' then v_tbl:='purchase_orders'; v_cols:='id,number,partner_id,project_id,date_order,date_planned,state,amount_untaxed,amount_tax,amount_total,currency_code';
    when 'payments' then v_tbl:='payments'; v_cols:='id,partner_id,amount,payment_type,currency_code,date';
    else raise exception 'unknown resource'; end case;
  v_sql := format('select coalesce(jsonb_agg(t),''[]''::jsonb) from (select %s from public.%I where company_id = $1 %s order by created_at desc nulls last limit $2 offset $3) t',
                  v_cols, v_tbl, case when p_id is not null then 'and id = '||quote_literal(p_id)||'::uuid' else '' end);
  execute v_sql into v_res using v_co, (case when p_id is not null then 1 else v_lim end), v_off;
  return v_res;
exception when others then
  -- created_at may not exist on every table; retry without the order clause
  v_sql := format('select coalesce(jsonb_agg(t),''[]''::jsonb) from (select %s from public.%I where company_id = $1 %s limit $2 offset $3) t',
                  v_cols, v_tbl, case when p_id is not null then 'and id = '||quote_literal(p_id)||'::uuid' else '' end);
  execute v_sql into v_res using v_co, (case when p_id is not null then 1 else v_lim end), v_off;
  return v_res;
end $$;

-- Whitelisted WRITE - safe master data only (contacts, products, projects). Company is forced.
create or replace function public.api_write(p_key text, p_resource text, p_op text, p_id uuid, p_data jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_co uuid; v_scopes text[]; v_tbl text; v_allow text[]; v_cols text:=''; v_vals text:=''; v_set text:=''; k text; v_new uuid; v_res jsonb;
begin
  select company_id, scopes into v_co, v_scopes from public.api_authenticate(p_key);
  if v_co is null then raise exception 'unauthorized'; end if;
  if not (v_scopes && array['write']) then raise exception 'this key is read-only'; end if;
  case p_resource
    when 'contacts' then v_tbl:='partners'; v_allow:=array['name','email','phone','vat','is_company','is_customer','is_vendor','industry'];
    when 'products' then v_tbl:='products'; v_allow:=array['name','default_code','type','list_price','cost_price','uom','family','is_active'];
    when 'projects' then v_tbl:='projects'; v_allow:=array['name','code','partner_id','contract_value','status','is_active','date_start','date_deadline'];
    else raise exception 'writes are not allowed on this resource'; end case;
  if p_op = 'create' then
    v_cols:='company_id'; v_vals:=quote_literal(v_co)||'::uuid';
    foreach k in array v_allow loop
      if p_data ? k then v_cols:=v_cols||','||quote_ident(k); v_vals:=v_vals||','||quote_nullable(p_data->>k); end if;
    end loop;
    execute format('insert into public.%I (%s) values (%s) returning id', v_tbl, v_cols, v_vals) into v_new;
    return public.api_query(p_key, p_resource, v_new, 1, 0);
  elsif p_op = 'update' then
    if p_id is null then raise exception 'id required'; end if;
    foreach k in array v_allow loop
      if p_data ? k then v_set:=v_set||(case when v_set='' then '' else ',' end)||quote_ident(k)||'='||quote_nullable(p_data->>k); end if;
    end loop;
    if v_set='' then raise exception 'no writable fields'; end if;
    execute format('update public.%I set %s where id=%L and company_id=%L', v_tbl, v_set, p_id, v_co);
    return public.api_query(p_key, p_resource, p_id, 1, 0);
  else raise exception 'unknown op'; end if;
end $$;

-- ---------------------------------------------------------------------------
--  Webhooks
-- ---------------------------------------------------------------------------
create or replace function public.webhook_create(p_company uuid, p_url text, p_events text[])
returns table(id uuid, secret text) language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_secret text;
begin
  if not public.can_write_company(p_company) then raise exception 'not allowed'; end if;
  v_secret := 'whsec_' || encode(gen_random_bytes(20),'hex');
  insert into public.webhook_endpoints(company_id,url,secret,events) values (p_company,p_url,v_secret,coalesce(p_events,'{}'))
    returning webhook_endpoints.id into v_id;
  return query select v_id, v_secret;
end $$;

create or replace function public.webhook_list(p_company uuid)
returns table(id uuid, url text, events text[], active boolean, created_at timestamptz, last_delivery_at timestamptz, last_status int)
language plpgsql security definer set search_path=public as $$
begin
  if not public.can_write_company(p_company) then raise exception 'not allowed'; end if;
  return query select w.id,w.url,w.events,w.active,w.created_at,w.last_delivery_at,w.last_status
    from public.webhook_endpoints w where w.company_id=p_company order by w.created_at desc;
end $$;

create or replace function public.webhook_delete(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_co uuid;
begin
  select company_id into v_co from public.webhook_endpoints where id=p_id;
  if v_co is null or not public.can_write_company(v_co) then raise exception 'not allowed'; end if;
  delete from public.webhook_endpoints where id=p_id;
end $$;

-- Fire an event: POST the signed payload to every active endpoint subscribed to it.
create or replace function public.webhook_fire(p_company uuid, p_event text, p_payload jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare w record; body text; sig text;
begin
  for w in select * from public.webhook_endpoints where company_id=p_company and active and (p_event = any(events)) loop
    body := jsonb_build_object('event',p_event,'company_id',p_company,'created_at',now(),'data',p_payload)::text;
    sig := encode(hmac(body, w.secret, 'sha256'),'hex');
    begin
      perform net.http_post(url:=w.url,
        headers:=jsonb_build_object('Content-Type','application/json','X-Orbit-Event',p_event,'X-Orbit-Signature','sha256='||sig),
        body:=body::jsonb);
      update public.webhook_endpoints set last_delivery_at=now() where id=w.id;
      insert into public.webhook_deliveries(company_id,endpoint_id,event,status_code) values (p_company,w.id,p_event,202);
    exception when others then
      insert into public.webhook_deliveries(company_id,endpoint_id,event,status_code) values (p_company,w.id,p_event,0);
    end;
  end loop;
end $$;

-- Triggers on the events we publish.
create or replace function public.tg_webhook_invoice() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.webhook_fire(NEW.company_id,
    case when NEW.move_type in ('out_invoice','out_refund') then 'invoice.created' else 'bill.created' end,
    jsonb_build_object('id',NEW.id,'number',NEW.number,'move_type',NEW.move_type,'partner_id',NEW.partner_id,'amount_total',NEW.amount_total,'state',NEW.state));
  return NEW;
end $$;
drop trigger if exists trg_webhook_invoice on public.invoices;
create trigger trg_webhook_invoice after insert on public.invoices for each row execute function public.tg_webhook_invoice();

create or replace function public.tg_webhook_po() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if TG_OP='INSERT' or (OLD.state is distinct from NEW.state and NEW.state in ('purchase','sent')) then
    perform public.webhook_fire(NEW.company_id, case when TG_OP='INSERT' then 'purchase_order.created' else 'purchase_order.confirmed' end,
      jsonb_build_object('id',NEW.id,'number',NEW.number,'partner_id',NEW.partner_id,'amount_total',NEW.amount_total,'state',NEW.state));
  end if;
  return NEW;
end $$;
drop trigger if exists trg_webhook_po on public.purchase_orders;
create trigger trg_webhook_po after insert or update of state on public.purchase_orders for each row execute function public.tg_webhook_po();

create or replace function public.tg_webhook_payment() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.webhook_fire(NEW.company_id,'payment.recorded',
    jsonb_build_object('id',NEW.id,'partner_id',NEW.partner_id,'amount',NEW.amount,'payment_type',NEW.payment_type,'date',NEW.date));
  return NEW;
end $$;
drop trigger if exists trg_webhook_payment on public.payments;
create trigger trg_webhook_payment after insert on public.payments for each row execute function public.tg_webhook_payment();

-- ---------------------------------------------------------------------------
--  Grants: app users manage; the gateway (anon) only authenticates + queries.
-- ---------------------------------------------------------------------------
grant execute on function public.api_key_create(uuid,text,text[]), public.api_key_list(uuid), public.api_key_revoke(uuid),
  public.webhook_create(uuid,text,text[]), public.webhook_list(uuid), public.webhook_delete(uuid) to authenticated;
grant execute on function public.api_authenticate(text), public.api_query(text,text,uuid,int,int), public.api_write(text,text,text,uuid,jsonb) to anon, authenticated;

select 'api + webhooks ready' as done;
