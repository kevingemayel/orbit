-- ============================================================================
-- 147-entity-linking.sql  -  linking entities, not just books.
--
-- Multi-book gave one company more than one view of its own trading. This is
-- the other half: more than one company, related to each other.
--
-- Three things:
--
--   1. A consolidation GROUP is a named set of companies with a method and an
--      ownership percentage each, so consolidation runs on a defined group
--      rather than on every company the signed-in user happens to see. The
--      tables existed and were never used; this adds what was missing (a
--      default flag and the seed) and the app now drives them.
--
--   2. INTERCOMPANY is made explicit. journal_entries.is_intercompany and
--      counterparty_company_id existed and were never written. A mirrored
--      posting now stamps both sides, so elimination keys off the entry rather
--      than guessing from a partner tag alone.
--
--   3. GROUP MASTER DATA. Two linked companies should not keep two customer
--      lists. group_key ties the copies of one real party (or one real
--      product) together across companies, so editing one updates the rest.
--
--      Deliberately a linked COPY per company, not one shared row. Tenant
--      isolation on partners and products is enforced by company_id, and the
--      one thing that must never be loosened is exactly that filter. A copy
--      per company keeps every existing RLS policy and every existing query
--      correct, and costs a sync on save.
--
-- Safe to re-run.
-- ============================================================================

-- ------------------------------------------------------------------- groups
alter table public.consolidation_groups
  add column if not exists is_default boolean not null default false,
  add column if not exists note text,
  add column if not exists created_at timestamptz not null default now();

alter table public.consolidation_group_companies
  add column if not exists sort int not null default 0;

-- method: full (100% line by line, minority interest carried separately),
-- proportional (every line at the ownership percentage), equity (one line:
-- the group's share of net assets and result).
alter table public.consolidation_group_companies
  alter column method set default 'full',
  alter column ownership_pct set default 100;

create unique index if not exists consolidation_groups_one_default
  on public.consolidation_groups (org_id) where is_default;

-- --------------------------------------------------------------- intercompany
-- Both already exist on journal_entries; make sure the account flag and the
-- lookup path are there too, and index what elimination actually queries.
alter table public.accounts
  add column if not exists is_intercompany boolean not null default false;

create index if not exists journal_entries_ic_idx
  on public.journal_entries (company_id, is_intercompany) where is_intercompany;
create index if not exists journal_entries_counterparty_idx
  on public.journal_entries (counterparty_company_id) where counterparty_company_id is not null;

-- The mirror link, so a document and its counterpart know about each other and
-- a second press cannot create a second mirror.
alter table public.invoices
  add column if not exists mirror_invoice_id uuid references public.invoices (id) on delete set null,
  add column if not exists mirror_company_id uuid references public.companies (id) on delete set null;

create index if not exists invoices_mirror_idx
  on public.invoices (mirror_invoice_id) where mirror_invoice_id is not null;

-- ----------------------------------------------------------- group master data
alter table public.partners add column if not exists group_key uuid;
alter table public.products add column if not exists group_key uuid;

create index if not exists partners_group_key_idx on public.partners (group_key) where group_key is not null;
create index if not exists products_group_key_idx on public.products (group_key) where group_key is not null;

-- One copy per company for any given shared record, so a sync can never make
-- two rows in the same company fight over the same identity.
create unique index if not exists partners_group_key_company_uniq
  on public.partners (group_key, company_id) where group_key is not null;
create unique index if not exists products_group_key_company_uniq
  on public.products (group_key, company_id) where group_key is not null;

-- ------------------------------------------------------------------- helpers
-- The companies in a group, with how each one consolidates. Security definer
-- so the report can name a group without the caller needing to read every
-- membership row, but it still refuses a group outside the caller's orgs.
create or replace function public.consolidation_group_members(p_group uuid)
returns table (company_id uuid, method text, ownership_pct numeric, sort int)
language sql stable security definer set search_path = public as $$
  select gc.company_id, coalesce(gc.method, 'full'), coalesce(gc.ownership_pct, 100), coalesce(gc.sort, 0)
    from public.consolidation_group_companies gc
    join public.consolidation_groups g on g.id = gc.group_id
   where gc.group_id = p_group
     and g.org_id in (select c.org_id from public.companies c
                       where c.id in (select public.my_company_ids()))
   order by coalesce(gc.sort, 0), gc.company_id;
$$;

-- Every company that carries a copy of one shared party or product, so the app
-- can push an edit out without reading each company in turn.
create or replace function public.group_master_copies(p_kind text, p_group_key uuid)
returns table (id uuid, company_id uuid)
language sql stable security definer set search_path = public as $$
  select p.id, p.company_id from public.partners p
   where p_kind = 'partner' and p.group_key = p_group_key
     and p.company_id in (select public.my_company_ids())
  union all
  select pr.id, pr.company_id from public.products pr
   where p_kind = 'product' and pr.group_key = p_group_key
     and pr.company_id in (select public.my_company_ids());
$$;

grant execute on function public.consolidation_group_members(uuid) to authenticated;
grant execute on function public.group_master_copies(text, uuid) to authenticated;

-- ---------------------------------------------------------------- seed a group
-- Every org with more than one company gets a default group holding all of
-- them at 100%, so the Consolidation report behaves exactly as it did before
-- anyone defines a group of their own. Nothing changes until they do.
do $$
declare o record; g uuid;
begin
  for o in select id, name, ref_currency from public.orgs loop
    if (select count(*) from public.companies where org_id = o.id and is_active) < 2 then continue; end if;
    if exists (select 1 from public.consolidation_groups where org_id = o.id) then continue; end if;
    insert into public.consolidation_groups (org_id, name, currency_code, is_default, note)
    values (o.id, 'All companies', coalesce(o.ref_currency, 'USD'), true,
            'Created automatically so consolidation keeps working. Edit it, or add a group of your own.')
    returning id into g;
    insert into public.consolidation_group_companies (group_id, company_id, method, ownership_pct, sort)
    select g, c.id, 'full', 100, row_number() over (order by c.name)
      from public.companies c where c.org_id = o.id and c.is_active;
  end loop;
end $$;
