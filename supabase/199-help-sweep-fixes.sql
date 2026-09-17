-- ============================================================================
-- 199-help-sweep-fixes.sql  -  the database half of four bugs from the help
-- writers' sweep. Safe to re-run: every statement is idempotent.
--
--  3. THE VAT REPORT SPLIT A MIXED-RATE DOCUMENT USING TODAY'S RATES.
--     A document's posted VAT is exact, but when its lines carry two different
--     rates the report has to share that one figure between them. It did that
--     from public.taxes.amount AS IT IS NOW, because a line never recorded the
--     rate it was taxed at. Raising a rate therefore moved VAT between the rows
--     of every return already filed. invoice_lines.tax_rate now records it, and
--     a trigger stamps it at the moment the document posts.
--
--  5. PAYROLL DEDUCTIONS POSTED TO A FIXED ACCOUNT CODE 4000.
--     Every other posting resolves its account from companies.*_account_id.
--     companies.payroll_deductions_account_id is that pointer for the money kept
--     back from pay (and the employer's own share). The app falls back to the
--     old code only while this column does not exist, and once it does it says
--     so on screen rather than posting to the wrong account.
--
--  6. THE RESIDENT PORTAL COULD NOT SHOW UPLOADED FILES.
--     Attachments live in the private 'attachments' bucket, so the portal could
--     only show a pasted link. Two SECURITY DEFINER functions let a resident
--     reach exactly the files on a document their own building has shared with
--     them, and nothing else; the portal then asks for a signed link with a
--     five-minute life.
--
--  7. TWO TILLS OFFLINE AT ONCE COULD GIVE THE SAME CALL NUMBER.
--     An offline till carries on from the last number it saw, so two of them
--     can both reach 42. Each till now claims its own short tag from the server,
--     unique within the store, and an offline number carries it. When the till
--     is back online it tells the server the highest number it gave out, so the
--     server never repeats it.
--
-- REPLACES EXISTING FUNCTIONS (create or replace, bodies carried over):
--     public.portal_property_summary()  -  from 189-plot-soft-delete-and-portal.
--       Same body, plus 'id' and 'files' on each shared document so the portal
--       can ask for its files. Nothing else about it changes.
-- REPLACES AN EXISTING POLICY:
--     storage.objects att_read  -  from 168-company-scope. The member rule is
--       unchanged; an OR is added for a portal resident's own building files.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 3. The rate a line was actually taxed at
-- ---------------------------------------------------------------------------
alter table public.invoice_lines add column if not exists tax_rate numeric;

comment on column public.invoice_lines.tax_rate is
  'The percentage this line was taxed at when its document posted. Stamped by the trigger below, never typed. Reports read this instead of the tax''s rate as it is today, so changing a rate cannot move VAT between the rows of a return already filed.';

-- Stamp the rate at the moment the document posts. post_invoice() works the tax
-- out from public.taxes.amount inside that same statement, so the rate written
-- here is exactly the rate the ledger was given. This is deliberately a trigger
-- rather than a change to post_invoice(): post_invoice is large and carries the
-- reopen/repost history, and every path that posts a document ends in this same
-- update, so the trigger covers them all without touching it.
create or replace function public.stamp_invoice_line_tax_rate()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.state = 'posted' and coalesce(old.state, '') is distinct from 'posted' then
    update public.invoice_lines il
       set tax_rate = coalesce((select t.amount from public.taxes t where t.id = il.tax_id), 0)
     where il.invoice_id = new.id;
  end if;
  return new;
end $fn$;

drop trigger if exists invoice_lines_stamp_tax_rate on public.invoices;
create trigger invoice_lines_stamp_tax_rate
  after update of state on public.invoices
  for each row execute function public.stamp_invoice_line_tax_rate();

-- Backfill. Documents posted before this ran never recorded their rate, so the
-- best that can be said is the rate their tax carries now, which is exactly what
-- the report used to assume for every document. Lines with no tax get 0. Rows
-- already stamped are left alone, so this is safe to run again.
update public.invoice_lines il
   set tax_rate = coalesce((select t.amount from public.taxes t where t.id = il.tax_id), 0)
 where il.tax_rate is null;


-- ---------------------------------------------------------------------------
-- 5. Where payroll deductions are owed
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists payroll_deductions_account_id uuid references public.accounts(id) on delete set null;

comment on column public.companies.payroll_deductions_account_id is
  'Tax withheld, social security and anything else kept back from pay, plus the employer''s own share, until it is paid over. A posted payslip credits it. There is no code to fall back on: while it is empty a payslip that keeps money back refuses to post and says so.';

-- A sensible starting value for companies that already have an account that is
-- plainly a payroll liability. Anything less obvious is left for the user to
-- choose, because guessing is what caused the bug.
update public.companies c
   set payroll_deductions_account_id = a.id
  from public.accounts a
 where c.payroll_deductions_account_id is null
   and a.company_id = c.id
   and coalesce(a.is_active, true)
   and a.type_code like 'liability%'
   and (a.name ilike '%payroll%' or a.name ilike '%social security%' or a.name ilike '%withhold%'
        or a.name ilike '%paie%' or a.name ilike '%cnss%' or a.name ilike '%nssf%')
   and a.id = (select a2.id from public.accounts a2
                where a2.company_id = c.id and coalesce(a2.is_active, true)
                  and a2.type_code like 'liability%'
                  and (a2.name ilike '%payroll%' or a2.name ilike '%social security%' or a2.name ilike '%withhold%'
                       or a2.name ilike '%paie%' or a2.name ilike '%cnss%' or a2.name ilike '%nssf%')
                order by a2.code limit 1);


-- ---------------------------------------------------------------------------
-- 6. Building documents a resident may open
-- ---------------------------------------------------------------------------

-- True when this storage object is a file on a property document that is shared
-- with residents, in a building where the person signing in owns a live unit.
-- Everything is checked here, on the server: the portal never names a path of
-- its own and never gets any other file in the bucket.
-- media_visible() and portal_media_readable() both look a file up by its storage
-- path on every read of the bucket, and nothing indexed that column.
create index if not exists idx_media_path on public.media(path);

create or replace function public.portal_media_readable(p_name text)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1
      from public.media m
      join public.property_documents d on d.id = m.entity_id
      join public.property_units u     on u.property_id = d.property_id
      join public.property_ownerships o on o.unit_id = u.id and o.company_id = d.company_id
      join public.portal_access pa     on pa.partner_id = o.partner_id and pa.company_id = d.company_id
     where m.path = p_name
       and m.entity = 'propdoc'
       and d.is_public
       and d.deleted_at is null
       and u.deleted_at is null
       and o.deleted_at is null
       and coalesce(pa.is_active, true)
       and lower(pa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$fn$;
revoke all on function public.portal_media_readable(text) from public, anon;
grant execute on function public.portal_media_readable(text) to authenticated;

-- The files on one shared document, for the resident asking. Returns nothing at
-- all unless the caller is a portal user who owns a unit in that building and
-- the document is marked visible to residents.
create or replace function public.portal_property_document_files(p_doc uuid)
returns table(path text, kind text, label text)
language sql stable security definer set search_path = public as $fn$
  select m.path,
         coalesce(m.kind, 'file') as kind,
         coalesce(nullif(btrim(coalesce(m.caption, '')), ''),
                  regexp_replace(m.path, '^.*/', '')) as label
    from public.media m
    join public.property_documents d on d.id = m.entity_id
   where m.entity = 'propdoc'
     and m.entity_id = p_doc
     and d.is_public
     and d.deleted_at is null
     and exists (
       select 1
         from public.property_units u
         join public.property_ownerships o on o.unit_id = u.id and o.company_id = d.company_id
         join public.portal_access pa on pa.partner_id = o.partner_id and pa.company_id = d.company_id
        where u.property_id = d.property_id
          and u.deleted_at is null
          and o.deleted_at is null
          and coalesce(pa.is_active, true)
          and lower(pa.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     )
   order by m.created_at;
$fn$;
revoke all on function public.portal_property_document_files(uuid) from public, anon;
grant execute on function public.portal_property_document_files(uuid) to authenticated;

-- Reading the object itself. The member rule is exactly the one 168 wrote; the
-- second arm is the new one, and it is the ONLY way a portal user reaches this
-- bucket, because they are in no org and so fail the first arm outright.
drop policy if exists att_read on storage.objects;
create policy att_read on storage.objects for select
  using (
    bucket_id = 'attachments'
    and (
      (((storage.foldername(name))[1])::uuid in (select public.my_orgs()) and public.media_visible(name))
      or public.portal_media_readable(name)
    )
  );

-- The portal summary, unchanged from 189 except that each shared document now
-- carries its id and how many files are on it, so the portal can offer them.
create or replace function public.portal_property_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare pa public.portal_access; me uuid; co uuid; cur text;
  props uuid[]; units jsonb; invs jsonb; anns jsonb; motions jsonb; suggs jsonb;
  billed numeric; outstanding numeric;
begin
  pa := public.portal_me();
  if pa.id is null then return null; end if;
  me := pa.partner_id; co := pa.company_id;
  select currency_code into cur from public.companies where id = co;

  -- buildings this partner owns a live unit in, through a live owner link
  select array_agg(distinct u.property_id) into props
    from public.property_ownerships o
    join public.property_units u on u.id = o.unit_id
    join public.properties p on p.id = u.property_id
   where o.company_id = co and o.partner_id = me
     and o.deleted_at is null and u.deleted_at is null and p.deleted_at is null;
  if props is null then props := array[]::uuid[]; end if;

  select coalesce(jsonb_agg(jsonb_build_object('code', u.code, 'building', p.name, 'shares', u.shares, 'floor', u.floor) order by p.name, u.code), '[]'::jsonb)
    into units
    from public.property_ownerships o
    join public.property_units u on u.id = o.unit_id
    join public.properties p on p.id = u.property_id
   where o.company_id = co and o.partner_id = me
     and o.deleted_at is null and u.deleted_at is null and p.deleted_at is null;

  select coalesce(sum(amount_total),0), coalesce(sum(amount_residual),0)
    into billed, outstanding
    from public.invoices
   where company_id = co and partner_id = me and move_type = 'out_invoice' and property_id = any(props);

  select coalesce(jsonb_agg(jsonb_build_object('number', number, 'date', invoice_date, 'due', due_date, 'total', amount_total, 'residual', amount_residual, 'state', payment_state) order by invoice_date desc), '[]'::jsonb)
    into invs
    from public.invoices
   where company_id = co and partner_id = me and move_type = 'out_invoice' and property_id = any(props);

  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'body', body, 'pinned', pinned, 'date', created_at) order by pinned desc, created_at desc), '[]'::jsonb)
    into anns
    from public.property_announcements
   where company_id = co and property_id = any(props) and deleted_at is null;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', mi.id, 'title', mi.title, 'description', mi.description, 'authority', mi.authority,
           'meeting', mt.title, 'building', p.name,
           'my_vote', (select v.choice from public.property_meeting_votes v where v.item_id = mi.id and v.voter_partner_id = me limit 1)
         ) order by mt.meeting_date desc), '[]'::jsonb)
    into motions
    from public.property_meeting_items mi
    join public.property_meetings mt on mt.id = mi.meeting_id
    join public.properties p on p.id = mt.property_id
   where mt.company_id = co and mt.property_id = any(props) and mi.kind = 'motion' and mi.status = 'open'
     and mi.deleted_at is null and mt.deleted_at is null;

  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'type', type, 'status', status, 'date', created_at) order by created_at desc), '[]'::jsonb)
    into suggs
    from public.property_suggestions
   where company_id = co and property_id = any(props) and submitted_by_partner_id = me and deleted_at is null;

  return jsonb_build_object(
    'currency', coalesce(cur,''), 'units', units, 'billed', billed, 'outstanding', outstanding,
    'invoices', invs, 'announcements', anns, 'motions', motions, 'suggestions', suggs,
    'property_id', (case when array_length(props,1) > 0 then props[1] else null end),
    'buildings', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name) order by p.name), '[]'::jsonb)
                    from public.properties p where p.id = any(props) and p.deleted_at is null),
    -- id + files are what let the portal ask for an uploaded file it cannot link to
    'documents', (select coalesce(jsonb_agg(jsonb_build_object(
                             'id', d.id, 'title', d.title, 'category', d.category, 'url', d.file_url,
                             'files', (select count(*) from public.media m where m.entity = 'propdoc' and m.entity_id = d.id)
                           ) order by d.created_at desc), '[]'::jsonb)
                    from public.property_documents d where d.company_id = co and d.property_id = any(props) and d.is_public and d.deleted_at is null),
    'projects', (select coalesce(jsonb_agg(jsonb_build_object('title', pj.title, 'status', pj.status, 'budget', pj.budget_estimate, 'progress', pj.progress) order by pj.created_at desc), '[]'::jsonb)
                    from public.property_projects pj where pj.company_id = co and pj.property_id = any(props) and pj.is_public and pj.deleted_at is null),
    'charges', (select coalesce(jsonb_agg(jsonb_build_object('name', c.name, 'category', c.category, 'amount', c.amount, 'frequency', c.frequency) order by c.name), '[]'::jsonb)
                    from public.property_charges c where c.company_id = co and c.property_id = any(props) and c.is_active and c.deleted_at is null));
end $fn$;


-- ---------------------------------------------------------------------------
-- 7. One call number per till, even with no connection
-- ---------------------------------------------------------------------------

-- The tag printed and called after an offline number: 42 A, 42 B. Empty on a
-- number the server handed out, because the server gives each one out once.
alter table public.pos_orders add column if not exists call_suffix text;

comment on column public.pos_orders.call_suffix is
  'The till''s own tag, set only on a call number the till gave itself while offline, so two offline tills cannot hand out the same thing.';

-- The till register. One row per browser per store, holding the short tag that
-- till calls its numbers with.
create table if not exists public.pos_tills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  store_id uuid references public.stores (id) on delete cascade,
  device_id text not null,
  tag text not null,
  label text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- store_id is nullable and SQL treats two NULLs as different, so the uniqueness
-- that matters is written over a coalesced key rather than as a plain constraint.
create unique index if not exists pos_tills_device_uq
  on public.pos_tills (company_id, coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid), device_id);
create unique index if not exists pos_tills_tag_uq
  on public.pos_tills (company_id, coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid), tag);

alter table public.pos_tills enable row level security;
drop policy if exists pos_tills_r on public.pos_tills;
drop policy if exists pos_tills_w on public.pos_tills;
create policy pos_tills_r on public.pos_tills
  for select to authenticated using (company_id in (select public.my_company_ids()));
create policy pos_tills_w on public.pos_tills
  for all to authenticated
  using (public.can_write_company(company_id))
  with check (public.can_write_company(company_id));

-- the same restrictive role gate 191 puts on every other till table, written here
-- because 191 works from a static list and this table did not exist then
drop policy if exists rg_ins on public.pos_tills;
drop policy if exists rg_upd on public.pos_tills;
drop policy if exists rg_del on public.pos_tills;
create policy rg_ins on public.pos_tills as restrictive for insert to authenticated
  with check (public.can_write_app(company_id, '{kitchen,pos}'::text[]));
create policy rg_upd on public.pos_tills as restrictive for update to authenticated
  using (public.can_write_app(company_id, '{kitchen,pos}'::text[]))
  with check (public.can_write_app(company_id, '{kitchen,pos}'::text[]));
create policy rg_del on public.pos_tills as restrictive for delete to authenticated
  using (public.can_write_app(company_id, '{kitchen,pos}'::text[]));

-- Give this till its tag, and the same one every time. The first free letter in
-- the store wins; after Z it goes AA, AB and so on, which is more tills than any
-- shop has. Allocation is a plain insert against a unique index, so two tills
-- opening at the same moment cannot be given the same letter.
create or replace function public.pos_claim_till(p_company uuid, p_store uuid, p_device text)
returns text language plpgsql security definer set search_path = public as $fn$
declare t text; i int;
begin
  -- the same permission the till needs to ring a sale at all (migration 194: a
  -- definer function is gated by the app, not merely by company membership)
  if not public.can_write_app(p_company, '{kitchen,pos}'::text[]) then
    raise exception 'not allowed';
  end if;
  if coalesce(btrim(p_device), '') = '' then
    raise exception 'a till id is required';
  end if;

  select tag into t from public.pos_tills
   where company_id = p_company
     and coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_store, '00000000-0000-0000-0000-000000000000'::uuid)
     and device_id = p_device;
  if t is not null then
    update public.pos_tills set last_seen = now()
     where company_id = p_company
       and coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_store, '00000000-0000-0000-0000-000000000000'::uuid)
       and device_id = p_device;
    return t;
  end if;

  for i in 1..702 loop
    t := case when i <= 26 then chr(64 + i)
              else chr(64 + ((i - 27) / 26)::int + 1) || chr(64 + ((i - 27) % 26) + 1) end;
    begin
      insert into public.pos_tills (company_id, store_id, device_id, tag)
      values (p_company, p_store, p_device, t);
      return t;
    exception when unique_violation then
      -- either that letter is taken, or this same till was registered a moment
      -- ago by another tab; look again before trying the next letter
      select tag into t from public.pos_tills
       where company_id = p_company
         and coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_store, '00000000-0000-0000-0000-000000000000'::uuid)
         and device_id = p_device;
      if t is not null then return t; end if;
    end;
  end loop;
  raise exception 'no till letter left in this store';
end $fn$;

revoke all on function public.pos_claim_till(uuid, uuid, text) from public, anon;
grant execute on function public.pos_claim_till(uuid, uuid, text) to authenticated;

-- Coming back from offline: a till says the highest number it handed out itself
-- today, and the day's counter is moved up to at least that, so the server never
-- gives the same number to a second till. It never moves the counter backwards.
create or replace function public.pos_reconcile_call_number(p_company uuid, p_store uuid, p_last int)
returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  if not public.can_write_app(p_company, '{kitchen,pos}'::text[]) then
    raise exception 'not allowed';
  end if;
  if p_last is null or p_last < 1 or p_last > 999 then
    select last_no into n from public.pos_call_counters
     where company_id = p_company and store_id is not distinct from p_store and day = current_date;
    return coalesce(n, 0);
  end if;
  insert into public.pos_call_counters (company_id, store_id, day, last_no)
  values (p_company, p_store, current_date, p_last)
  on conflict (company_id, store_id, day)
  do update set last_no = greatest(public.pos_call_counters.last_no, excluded.last_no)
  returning last_no into n;
  return n;
end $fn$;

revoke all on function public.pos_reconcile_call_number(uuid, uuid, int) from public, anon;
grant execute on function public.pos_reconcile_call_number(uuid, uuid, int) to authenticated;
