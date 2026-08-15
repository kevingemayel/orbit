-- ============================================================================
--  Spacework ERP  -  ROLES & PERMISSIONS  (run AFTER 01-29)
--  ONE table drives who can see/manage each module. Extends the existing
--  org_members(user_id, org_id, role) map: org_members.role holds a role SLUG
--  that resolves to a row here (org-specific first, then a global template).
--
--  permissions jsonb model  (supports "a whole module OR parts of a module"):
--    { "*":        {"v":true,"m":false},        -- wildcard default for every module
--      "accounting":{"v":true,"m":true},        -- per-module override (view / manage)
--      "sales":    {"v":true,"m":true,           -- optional per-FEATURE overrides
--                   "f":{"pricelists":true,"reports":false}} }
--   Resolver (app):  perm(mod) = permissions[mod] ?? permissions["*"] ?? {v:false,m:false}
--   full_access=true short-circuits everything to true (owner / developer / super_admin).
--
--  can_see_money=false  ->  the app masks every monetary value for that role
--                           (junior engineers). rank drives who may edit whom.
--  Global template roles (org_id null) are READ-ONLY via RLS: only migrations
--  seed them. A super_admin creates/edits roles for THEIR OWN org (org_id set).
--  From now on, every new app/module must be added to MODULE_CATALOG in the app
--  and inherits the "*" wildcard until a role overrides it.
-- ============================================================================

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.orgs(id) on delete cascade,   -- null = global template
  slug text not null,
  label text not null default '',
  description text default '',
  rank int not null default 10,                 -- higher = more privileged; you may only manage roles below your own rank
  is_system boolean default false,              -- seeded template
  protected boolean default false,              -- cannot be edited/deleted in the UI
  full_access boolean default false,            -- sees + manages everything (god)
  can_manage_roles boolean default false,       -- may open the Roles & Permissions editor
  can_see_money boolean default true,           -- false -> monetary values are masked
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
-- unique slug per org, and unique among globals
create unique index if not exists roles_slug_global on public.roles (slug) where org_id is null;
create unique index if not exists roles_slug_org    on public.roles (org_id, slug) where org_id is not null;
create index if not exists idx_roles_org on public.roles(org_id);

-- ---- RLS -------------------------------------------------------------------
alter table public.roles enable row level security;
drop policy if exists roles_r on public.roles;
drop policy if exists roles_w on public.roles;
-- read: global templates, plus any role in an org you belong to
create policy roles_r on public.roles for select using (
  org_id is null
  or org_id in (select org_id from public.org_members where user_id = auth.uid())
);
-- write: ONLY org-scoped roles, and only by owner/developer/super_admin of that org.
-- Global templates are never writable through the API (seed-only).
create policy roles_w on public.roles for all using (
  org_id is not null and exists (
    select 1 from public.org_members m
    where m.org_id = roles.org_id and m.user_id = auth.uid()
      and m.role in ('owner','developer','super_admin')
  )
) with check (
  org_id is not null and exists (
    select 1 from public.org_members m
    where m.org_id = roles.org_id and m.user_id = auth.uid()
      and m.role in ('owner','developer','super_admin')
  )
);

-- ---- seed the 8 global template roles --------------------------------------
insert into public.roles (org_id, slug, label, description, rank, is_system, protected, full_access, can_manage_roles, can_see_money, permissions) values
 (null,'owner','Owner','Sees and manages every app and can overlook anything. The top of the tree.',
   100,true,true,true,true,true,'{}'::jsonb),
 (null,'developer','Developer','Same full access as the Owner, but can never remove or reduce the Owner''s rights.',
   95,true,true,true,true,true,'{}'::jsonb),
 (null,'super_admin','Super Admin','Full access within their own company, and can create and edit roles for their own company only.',
   90,true,true,true,true,true,'{}'::jsonb),
 (null,'admin','Administrator','Runs everything day to day except the Roles editor.',
   70,true,false,false,false,true,
   '{"*":{"v":true,"m":true},"settings":{"v":true,"m":false}}'::jsonb),
 (null,'administrative_manager','Administrative Manager','Accounting / finance manager: full control of finance, plus visibility everywhere.',
   60,true,false,false,false,true,
   '{"*":{"v":true,"m":false},"accounting":{"v":true,"m":true},"sales":{"v":true,"m":true},"purchase":{"v":true,"m":true},"contacts":{"v":true,"m":true},"documents":{"v":true,"m":true},"insights":{"v":true,"m":true},"settings":{"v":false,"m":false}}'::jsonb),
 (null,'manager','Manager','Manages operational delivery; can view finance but not change it.',
   50,true,false,false,false,true,
   '{"*":{"v":true,"m":false},"projects":{"v":true,"m":true},"site":{"v":true,"m":true},"installation":{"v":true,"m":true},"manufacturing":{"v":true,"m":true},"inventory":{"v":true,"m":true},"estimation":{"v":true,"m":true},"crm":{"v":true,"m":true},"sales":{"v":true,"m":true},"purchase":{"v":true,"m":true},"documents":{"v":true,"m":true},"calendar":{"v":true,"m":true},"contacts":{"v":true,"m":true},"sign":{"v":true,"m":true},"knowledge":{"v":true,"m":true},"settings":{"v":false,"m":false}}'::jsonb),
 (null,'junior_administrator','Junior Administrator','Handles contacts, documents and scheduling; read-only on finance and projects.',
   30,true,false,false,false,true,
   '{"contacts":{"v":true,"m":true},"documents":{"v":true,"m":true},"calendar":{"v":true,"m":true},"sign":{"v":true,"m":true},"knowledge":{"v":true,"m":true},"crm":{"v":true,"m":false},"sales":{"v":true,"m":false},"purchase":{"v":true,"m":false},"accounting":{"v":true,"m":false},"projects":{"v":true,"m":false},"insights":{"v":true,"m":false}}'::jsonb),
 (null,'junior_engineer','Junior Engineer','Delivery and site work. Never sees any monetary value.',
   20,true,false,false,false,false,
   '{"projects":{"v":true,"m":true},"site":{"v":true,"m":true},"installation":{"v":true,"m":true},"manufacturing":{"v":true,"m":true},"documents":{"v":true,"m":true},"calendar":{"v":true,"m":true},"knowledge":{"v":true,"m":true},"estimation":{"v":true,"m":false},"inventory":{"v":true,"m":false},"contacts":{"v":true,"m":false},"insights":{"v":true,"m":false}}'::jsonb)
on conflict do nothing;

-- make sure the platform owner keeps the owner role if org_members already exists
-- (no-op if the row is already 'owner'); safe, only touches existing owners.
update public.org_members set role = 'owner' where role = 'owner';

select slug, label, rank, full_access, can_manage_roles, can_see_money from public.roles where org_id is null order by rank desc;
