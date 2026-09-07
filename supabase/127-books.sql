-- ============================================================================
-- 127-books.sql  -  Multi-book accounting (statutory vs management).
--
-- The problem this solves: a business often needs two views of the same
-- activity. What the accountant files, and what the owner actually needs to see
-- to run the place. Today the only way to express that in Orbit is to create a
-- second company, which means entering everything twice, keeping two customer
-- lists and two stock pools, and having no way to see the combined position.
--
-- These are not two businesses. They are two views of one business, so the
-- right primitive is a ledger dimension, not a second tenant.
--
-- MODEL: books are LAYERS, not copies.
--   statutory   includes {statutory}                -> what gets filed
--   management  includes {statutory, management}    -> everything, the real position
--
-- A transaction is entered ONCE and posts to ONE book. A normal transaction
-- lands in `statutory` and therefore appears in BOTH views. A transaction that
-- belongs only to the owner's own picture lands in `management` and appears
-- only there. Adding a book with its own `includes` list covers other cases
-- (an IFRS or tax book that layers its own adjustments over the statutory set).
--
-- Nothing changes for an existing company: every entry is backfilled to
-- `statutory`, which is the default and primary book, so every report reads
-- exactly what it read before until someone chooses otherwise.
--
-- The audit trail is unchanged and still records every book. This is a
-- reporting dimension, not a way to make records disappear.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  -- book codes whose entries roll up into this book's view (own code included)
  includes text[] not null default '{}',
  is_default boolean not null default false,   -- where a new posting lands
  is_primary boolean not null default false,   -- the view shown when nothing is chosen
  sort int not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);
create index if not exists idx_books_company on public.books (company_id, is_active);

-- Seed the two books every company starts with.
insert into public.books (company_id, code, name, includes, is_default, is_primary, sort)
select c.id, 'statutory', 'Statutory', array['statutory'], true, true, 10 from public.companies c
on conflict (company_id, code) do nothing;

insert into public.books (company_id, code, name, includes, is_default, is_primary, sort)
select c.id, 'management', 'Management', array['statutory','management'], false, false, 20 from public.companies c
on conflict (company_id, code) do nothing;

-- A new company gets them too.
create or replace function public.company_seed_books() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.books (company_id, code, name, includes, is_default, is_primary, sort)
  values (new.id, 'statutory', 'Statutory', array['statutory'], true, true, 10),
         (new.id, 'management', 'Management', array['statutory','management'], false, false, 20)
  on conflict (company_id, code) do nothing;
  return new;
end $$;
drop trigger if exists co_seed_books on public.companies;
create trigger co_seed_books after insert on public.companies
  for each row execute function public.company_seed_books();

-- ---------------------------------------------------------------------------
-- The ledger dimension
-- ---------------------------------------------------------------------------
alter table public.journal_entries add column if not exists book_id uuid references public.books(id) on delete restrict;
create index if not exists idx_je_book on public.journal_entries (company_id, book_id, date);

-- A document can decide which book its posting belongs to.
alter table public.invoices add column if not exists book_id uuid references public.books(id) on delete set null;

-- Backfill: everything that already exists is statutory.
update public.journal_entries e
   set book_id = b.id
  from public.books b
 where b.company_id = e.company_id and b.code = 'statutory' and e.book_id is null;

-- ---------------------------------------------------------------------------
-- Every writer gets a book without knowing it exists.
--
-- There are 13 places in the app that insert a journal entry directly, plus the
-- posting RPCs. Rather than teach all of them about books, the default is
-- applied here: an entry with no book takes the book of the document that
-- created it, else the company's default book. That means existing code, and
-- any code written later, keeps working and lands in the statutory book.
-- ---------------------------------------------------------------------------
create or replace function public.je_set_book() returns trigger
language plpgsql security definer set search_path = public as $$
declare b uuid;
begin
  if new.book_id is not null then return new; end if;

  if new.source_type = 'invoice' and new.source_id ~ '^[0-9a-fA-F-]{36}$' then
    select i.book_id into b from public.invoices i where i.id = new.source_id::uuid;
  end if;

  if b is null then
    select id into b from public.books
     where company_id = new.company_id and is_default and is_active
     order by sort limit 1;
  end if;

  -- self-heal: a company that predates this migration and somehow has no books
  if b is null then
    insert into public.books (company_id, code, name, includes, is_default, is_primary, sort)
    values (new.company_id, 'statutory', 'Statutory', array['statutory'], true, true, 10)
    on conflict (company_id, code) do nothing;
    select id into b from public.books where company_id = new.company_id and code = 'statutory';
  end if;

  new.book_id := b;
  return new;
end $$;

drop trigger if exists je_book on public.journal_entries;
create trigger je_book before insert on public.journal_entries
  for each row execute function public.je_set_book();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.books enable row level security;
drop policy if exists books_rw on public.books;
create policy books_rw on public.books
  using (company_id in (select public.my_company_ids()))
  with check (public.can_write_company(company_id));
