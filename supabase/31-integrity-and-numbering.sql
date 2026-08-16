-- ============================================================================
--  Spacework ERP  -  SERVER-SIDE INTEGRITY (ORB-04) + CONFIGURABLE NUMBERING (ORB-06 v1)
--  run AFTER 01-30.
--   - number_sequences: per-company, per-document-type prefix / padding / year
--     so a non-developer admin can change how documents are numbered.
--   - unique document numbers per company (guarded: skipped if legacy dupes exist).
--   - a posted invoice can never carry a zero/negative total (belt-and-suspenders
--     behind the app guard; payments keep total > 0 so they are unaffected).
--  Company-scoped RLS.
-- ============================================================================

-- ---- 1. configurable document numbering ------------------------------------
create table if not exists public.number_sequences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  doc_type text not null,                 -- out_invoice | in_invoice | out_refund | in_refund | sale | purchase | tender | certificate | submittal | rfi | transmittal | snag | inspection ...
  label text default '',
  prefix text not null default 'DOC',
  padding int not null default 4,         -- zero-pad width of the running number
  use_year boolean not null default true, -- include /YYYY/ segment
  created_at timestamptz default now(),
  unique (company_id, doc_type)
);
create index if not exists idx_number_sequences on public.number_sequences(company_id, doc_type);

alter table public.number_sequences enable row level security;
drop policy if exists numseq_r on public.number_sequences;
drop policy if exists numseq_w on public.number_sequences;
create policy numseq_r on public.number_sequences for select using (company_id in (select public.my_company_ids()));
create policy numseq_w on public.number_sequences for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

-- ---- 2. unique document numbers per company (guarded) ----------------------
-- Each wrapped so a legacy duplicate does not abort the whole migration.
do $u1$ begin
  begin execute 'create unique index if not exists uq_invoices_num on public.invoices(company_id, number) where number is not null and number <> ''''';
  exception when others then raise notice 'skip uq_invoices_num: %', sqlerrm; end;
  begin execute 'create unique index if not exists uq_po_num on public.purchase_orders(company_id, number) where number is not null and number <> ''''';
  exception when others then raise notice 'skip uq_po_num: %', sqlerrm; end;
  begin execute 'create unique index if not exists uq_so_num on public.sale_orders(company_id, number) where number is not null and number <> ''''';
  exception when others then raise notice 'skip uq_so_num: %', sqlerrm; end;
  begin execute 'create unique index if not exists uq_tender_num on public.tenders(company_id, number) where number is not null and number <> ''''';
  exception when others then raise notice 'skip uq_tender_num: %', sqlerrm; end;
  begin execute 'create unique index if not exists uq_cert_num on public.project_certificates(company_id, number) where number is not null and number <> ''''';
  exception when others then raise notice 'skip uq_cert_num: %', sqlerrm; end;
end $u1$;

-- ---- 3. a posted invoice may never have a zero/negative total ---------------
create or replace function public.guard_invoice_posted() returns trigger
language plpgsql as $g$
begin
  if new.state = 'posted' and coalesce(new.amount_total, 0) <= 0 then
    raise exception 'A posted invoice must have a total greater than zero (got %).', coalesce(new.amount_total,0);
  end if;
  return new;
end $g$;
drop trigger if exists trg_guard_invoice_posted on public.invoices;
create trigger trg_guard_invoice_posted
  before insert or update on public.invoices
  for each row execute function public.guard_invoice_posted();

select 'number_sequences' t, count(*) n from public.number_sequences
union all select 'invoices_posted_zero_now_blocked', 0;
