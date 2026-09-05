-- ============================================================================
--  Orbit ERP  -  Website module (multi-tenant site hosting)
--
--  Every company can build sites. A site is a set of PAGES, and a page is a tree
--  of BLOCKS stored as jsonb - so new capabilities are new block *types*, never a
--  schema change. Sites are served by one edge renderer that resolves the incoming
--  hostname to a site and calls site_render() (SECURITY DEFINER) to fetch ONLY the
--  published page - public visitors never touch the tables directly.
--  Hosting: <slug>.sites.spacework.ai for free, or a customer's own domain via a
--  site_hostnames row (Cloudflare for SaaS custom hostname). Paste + Run once.
-- ============================================================================
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  slug text,                                   -- subdomain label: <slug>.sites.spacework.ai
  theme jsonb not null default '{}'::jsonb,    -- design tokens (colours, fonts)
  settings jsonb not null default '{}'::jsonb,
  homepage_path text default '/',
  is_published boolean default false,
  created_at timestamptz default now()
);
create unique index if not exists idx_sites_slug on public.sites(slug) where slug is not null;
create index if not exists idx_sites_company on public.sites(company_id);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  path text not null default '/',              -- '/', '/about', '/contact'
  title text,
  meta jsonb not null default '{}'::jsonb,      -- {description, ogImage, ...}
  content jsonb not null default '[]'::jsonb,   -- the block tree
  is_published boolean default false,
  sort int default 0,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
create unique index if not exists idx_site_pages_path on public.site_pages(site_id, path);

create table if not exists public.site_hostnames (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  hostname text not null,                       -- 'acme.sites.spacework.ai' | 'www.acme.com'
  kind text default 'custom',                   -- 'subdomain' | 'custom'
  status text default 'pending',                -- 'pending' | 'active'
  cf_hostname_id text,                          -- Cloudflare for SaaS custom_hostname id
  created_at timestamptz default now()
);
create unique index if not exists idx_site_hostnames_host on public.site_hostnames(lower(hostname));

create table if not exists public.site_submissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  form_key text,
  data jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_site_subs on public.site_submissions(company_id, created_at desc);

alter table public.sites            enable row level security;
alter table public.site_pages       enable row level security;
alter table public.site_hostnames   enable row level security;
alter table public.site_submissions enable row level security;
do $$ begin
  drop policy if exists sites_r  on public.sites;            create policy sites_r  on public.sites            for select using (company_id in (select public.my_company_ids()));
  drop policy if exists sites_w  on public.sites;            create policy sites_w  on public.sites            for all    using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));
  drop policy if exists sp_r     on public.site_pages;       create policy sp_r     on public.site_pages       for select using (company_id in (select public.my_company_ids()));
  drop policy if exists sp_w     on public.site_pages;       create policy sp_w     on public.site_pages       for all    using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));
  drop policy if exists sh_r     on public.site_hostnames;   create policy sh_r     on public.site_hostnames   for select using (company_id in (select public.my_company_ids()));
  drop policy if exists sh_w     on public.site_hostnames;   create policy sh_w     on public.site_hostnames   for all    using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));
  drop policy if exists ss_r     on public.site_submissions; create policy ss_r     on public.site_submissions for select using (company_id in (select public.my_company_ids()));
  drop policy if exists ss_w     on public.site_submissions; create policy ss_w     on public.site_submissions for all    using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));
end $$;

-- Resolve an incoming hostname + path to the published page (public-facing).
-- Returns null when the site or page is not published, so drafts never leak.
create or replace function public.site_render(p_host text, p_path text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_site public.sites; v_page public.site_pages; v_host text; v_sub text; v_path text;
begin
  v_host := lower(coalesce(p_host, ''));
  v_path := coalesce(nullif(p_path, ''), '/');
  select s.* into v_site from public.sites s
    join public.site_hostnames h on h.site_id = s.id
    where lower(h.hostname) = v_host and h.status = 'active' and s.is_published limit 1;
  if v_site.id is null and v_host like '%.sites.spacework.ai' then
    v_sub := split_part(v_host, '.', 1);
    select s.* into v_site from public.sites s where s.slug = v_sub and s.is_published limit 1;
  end if;
  if v_site.id is null then return null; end if;
  select p.* into v_page from public.site_pages p where p.site_id = v_site.id and p.path = v_path and p.is_published limit 1;
  if v_page.id is null and v_path <> '/' then return null; end if;   -- unknown path -> 404 (not homepage)
  if v_page.id is null then
    select p.* into v_page from public.site_pages p where p.site_id = v_site.id and p.path = v_site.homepage_path and p.is_published limit 1;
  end if;
  if v_page.id is null then return null; end if;
  return jsonb_build_object(
    'site', jsonb_build_object('name', v_site.name, 'theme', v_site.theme, 'settings', v_site.settings),
    'page', jsonb_build_object('title', v_page.title, 'meta', v_page.meta, 'content', v_page.content, 'path', v_page.path),
    'nav',  (select coalesce(jsonb_agg(jsonb_build_object('title', pp.title, 'path', pp.path) order by pp.sort, pp.path), '[]'::jsonb)
             from public.site_pages pp where pp.site_id = v_site.id and pp.is_published and coalesce((pp.meta->>'hide_in_nav')::boolean, false) = false)
  );
end $$;
grant execute on function public.site_render(text, text) to anon, authenticated;

-- Accept a public form submission from a live site (resolves host -> site/company).
create or replace function public.site_form_submit(p_host text, p_form text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_site public.sites; v_host text; v_sub text;
begin
  v_host := lower(coalesce(p_host, ''));
  select s.* into v_site from public.sites s join public.site_hostnames h on h.site_id = s.id where lower(h.hostname) = v_host and h.status = 'active' limit 1;
  if v_site.id is null and v_host like '%.sites.spacework.ai' then
    v_sub := split_part(v_host, '.', 1);
    select s.* into v_site from public.sites s where s.slug = v_sub limit 1;
  end if;
  if v_site.id is null then return jsonb_build_object('ok', false, 'error', 'unknown site'); end if;
  insert into public.site_submissions (company_id, site_id, form_key, data) values (v_site.company_id, v_site.id, coalesce(p_form, 'contact'), coalesce(p_data, '{}'::jsonb));
  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.site_form_submit(text, text, jsonb) to anon, authenticated;

select 'website module ready' as done;
