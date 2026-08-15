-- ============================================================================
--  Spacework ERP  -  CLIENT / SUBCONTRACTOR / SUPPLIER PORTAL  (run AFTER 01-27)
--   External parties sign in (magic link) and see ONLY their own data, read
--   only. We DO NOT touch the main app's RLS. Instead the portal reads through
--   SECURITY DEFINER functions that filter strictly by the caller's portal
--   access row (matched on the signed-in email). Owner manages access rows.
-- ============================================================================

create table if not exists public.portal_access (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  email text not null,
  role text not null default 'client',           -- client | subcontractor | supplier
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_portal_access on public.portal_access(lower(email), is_active);

-- owner-only management (portal users never read this table directly)
alter table public.portal_access enable row level security;
drop policy if exists portal_access_r on public.portal_access;
drop policy if exists portal_access_w on public.portal_access;
create policy portal_access_r on public.portal_access for select using (company_id in (select public.my_company_ids()));
create policy portal_access_w on public.portal_access for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- caller's active access row, matched on the signed-in email
create or replace function public.portal_me() returns public.portal_access
language sql security definer set search_path = public stable as $$
  select * from public.portal_access
   where is_active = true
     and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
   order by created_at desc limit 1;
$$;

create or replace function public.portal_context() returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare pa public.portal_access; pn text; cn text; cc text;
begin
  pa := public.portal_me();
  if pa.id is null then return null; end if;
  select name into pn from public.partners where id = pa.partner_id;
  select name, currency_code into cn, cc from public.companies where id = pa.company_id;
  return jsonb_build_object('partner', pn, 'role', pa.role, 'company', cn, 'currency', coalesce(cc,''));
end $$;

create or replace function public.portal_projects()
returns table(name text, contract_value numeric, certified numeric, deadline date, active boolean)
language plpgsql security definer set search_path = public stable as $$
declare pa public.portal_access;
begin
  pa := public.portal_me();
  if pa.id is null then return; end if;
  return query
    select p.name, p.contract_value,
      coalesce((select sum(c.current_certified) from public.project_certificates c
                where c.project_id = p.id and c.state <> 'draft'), 0),
      p.date_deadline, p.is_active
    from public.projects p
    where p.company_id = pa.company_id and p.partner_id = pa.partner_id
    order by p.created_at desc;
end $$;

create or replace function public.portal_invoices()
returns table(number text, invoice_date date, due_date date, total numeric, residual numeric, state text, kind text)
language plpgsql security definer set search_path = public stable as $$
declare pa public.portal_access;
begin
  pa := public.portal_me();
  if pa.id is null then return; end if;
  return query
    select i.number, i.invoice_date, i.due_date, i.amount_total, i.amount_residual, i.state,
      case when i.move_type in ('out_invoice','out_refund') then 'You are billed' else 'We owe you' end
    from public.invoices i
    where i.company_id = pa.company_id and i.partner_id = pa.partner_id
      and coalesce(i.state,'') <> 'draft'
    order by i.invoice_date desc nulls last;
end $$;

create or replace function public.portal_orders()
returns table(number text, date_order date, total numeric, state text)
language plpgsql security definer set search_path = public stable as $$
declare pa public.portal_access;
begin
  pa := public.portal_me();
  if pa.id is null then return; end if;
  return query
    select o.number, o.date_order, o.amount_total, o.state
    from public.purchase_orders o
    where o.company_id = pa.company_id and o.partner_id = pa.partner_id
      and coalesce(o.state,'') <> 'draft'
    order by o.date_order desc nulls last;
end $$;

grant execute on function public.portal_context(), public.portal_projects(),
  public.portal_invoices(), public.portal_orders() to authenticated, anon;

select 'portal_access' t, count(*) n from public.portal_access;
