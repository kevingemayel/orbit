-- ============================================================================
--  Spacework ERP  -  MEDIA / ATTACHMENTS  (run AFTER 01-46)
--  A single private storage bucket holds every uploaded image and document.
--  Files live under  {org_id}/{entity}/{entity_id}/{uuid.ext}  so row-level
--  security can gate them by org. The public.media table indexes each file so
--  any record (stock item, tool, contact, damaged item, supplier paper...) can
--  list, caption and flag a primary picture without knowing storage internals.
--  Images are compressed client-side (~1600px JPEG); PDFs are stored as-is.
-- ============================================================================

-- 1) private bucket -----------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400)      -- 25 MB hard cap
on conflict (id) do update set public = false, file_size_limit = 26214400;

-- 2) storage RLS: a member may touch objects whose first path folder is one of
--    their orgs. (storage.foldername(name))[1] is the {org_id} segment.
drop policy if exists att_read   on storage.objects;
drop policy if exists att_insert on storage.objects;
drop policy if exists att_update on storage.objects;
drop policy if exists att_delete on storage.objects;

create policy att_read on storage.objects for select to authenticated
  using ( bucket_id = 'attachments'
          and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) );
create policy att_insert on storage.objects for insert to authenticated
  with check ( bucket_id = 'attachments'
          and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) );
create policy att_update on storage.objects for update to authenticated
  using ( bucket_id = 'attachments'
          and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) )
  with check ( bucket_id = 'attachments'
          and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) );
create policy att_delete on storage.objects for delete to authenticated
  using ( bucket_id = 'attachments'
          and ((storage.foldername(name))[1])::uuid in (select public.my_orgs()) );

-- 3) media index --------------------------------------------------------------
create table if not exists public.media (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  entity     text not null,                 -- 'product' | 'tool' | 'partner' | 'profile' | 'company' | 'project_item' | 'delivery_note' | 'damage' | 'employee' | ...
  entity_id  uuid,                           -- the row this file belongs to (null for a not-yet-saved draft, reconciled on save)
  path       text not null,                  -- storage object key inside the 'attachments' bucket
  kind       text not null default 'image',  -- 'image' | 'pdf' | 'file'
  mime       text,
  caption    text,
  is_primary boolean default false,
  bytes      int,
  w          int,
  h          int,
  created_by uuid default auth.uid(),
  created_at timestamptz default now()
);
create index if not exists idx_media_entity on public.media(org_id, entity, entity_id);
alter table public.media enable row level security;
drop policy if exists media_r on public.media;
create policy media_r on public.media for select using (org_id in (select public.my_orgs()));
drop policy if exists media_w on public.media;
create policy media_w on public.media for all using (org_id in (select public.my_orgs())) with check (org_id in (select public.my_orgs()));

-- 4) shelf location for stock -------------------------------------------------
alter table public.products add column if not exists shelf_location text;

select 'media ready' as done;
