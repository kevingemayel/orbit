-- ============================================================================
--  Spacework ERP  -  P2 depth: posted-doc lock (ORB-24), audit log (ORB-18),
--  safety incidents (ORB-22).   Run AFTER 01-37.
-- ============================================================================

-- ---- ORB-24: posted financial documents are immutable (amounts/party/date/number)
create or replace function public.guard_posted_invoice() returns trigger language plpgsql set search_path=public as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.state = 'posted' then raise exception 'A posted invoice cannot be deleted. Cancel it or issue a credit note instead.'; end if;
    return OLD;
  end if;
  if OLD.state = 'posted' and (
        coalesce(NEW.amount_total,0)   is distinct from coalesce(OLD.amount_total,0)
     or coalesce(NEW.amount_untaxed,0) is distinct from coalesce(OLD.amount_untaxed,0)
     or NEW.partner_id   is distinct from OLD.partner_id
     or NEW.invoice_date is distinct from OLD.invoice_date
     or NEW.number       is distinct from OLD.number
     or NEW.move_type    is distinct from OLD.move_type
  ) then
    raise exception 'A posted invoice''s amounts, party, date and number are locked. Cancel it or issue a credit note to change it.';
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_guard_posted_invoice on public.invoices;
create trigger trg_guard_posted_invoice before update or delete on public.invoices for each row execute function public.guard_posted_invoice();

-- ---- ORB-18: lightweight change-history / audit log (who did what, when)
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid,
  table_name text,
  row_id     uuid,
  action     text,          -- INSERT | UPDATE | DELETE
  actor      uuid,
  at         timestamptz default now()
);
create index if not exists idx_audit_co on public.audit_log(company_id, at desc);
alter table public.audit_log enable row level security;
drop policy if exists audit_r on public.audit_log;
create policy audit_r on public.audit_log for select using (company_id in (select public.my_company_ids()));
-- no client writes; only the trigger (security definer) writes

create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path=public as $$
begin
  begin
    if TG_OP = 'DELETE' then
      insert into public.audit_log(company_id, table_name, row_id, action, actor) values (OLD.company_id, TG_TABLE_NAME, OLD.id, TG_OP, auth.uid());
      return OLD;
    else
      insert into public.audit_log(company_id, table_name, row_id, action, actor) values (NEW.company_id, TG_TABLE_NAME, NEW.id, TG_OP, auth.uid());
      return NEW;
    end if;
  exception when others then
    if TG_OP = 'DELETE' then return OLD; else return NEW; end if;   -- never block the real op
  end;
end; $$;
do $$ declare t text;
begin
  foreach t in array array['invoices','payments','projects','purchase_orders'] loop
    execute format('drop trigger if exists trg_audit on public.%I;', t);
    execute format('create trigger trg_audit after insert or update or delete on public.%I for each row execute function public.audit_row();', t);
  end loop;
end $$;

-- ---- ORB-22: safety incidents / near-miss log (Site Ops)
create table if not exists public.site_incidents (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  incident_date date default current_date,
  incident_type text default 'near_miss',   -- near_miss | first_aid | injury | property | environmental | dangerous_occurrence
  severity      text default 'low',         -- low | medium | high | critical
  location      text default '',
  description   text not null default '',
  action_taken  text default '',
  reported_by   text default '',
  status        text default 'open',        -- open | investigating | closed
  created_at    timestamptz default now()
);
create index if not exists idx_incidents_co on public.site_incidents(company_id, incident_date desc);
alter table public.site_incidents enable row level security;
drop policy if exists inc_r on public.site_incidents;
create policy inc_r on public.site_incidents for select using (company_id in (select public.my_company_ids()));
drop policy if exists inc_w on public.site_incidents;
create policy inc_w on public.site_incidents for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'depth ready' as done;
