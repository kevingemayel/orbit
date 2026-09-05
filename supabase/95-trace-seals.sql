-- ============================================================================
--  Orbit ERP  -  Tamper-evident traceability seals  (P1: takeoff -> GL chain)
--
--  The take-off -> RFQ -> PO -> receipt -> bill -> GL lineage is reconstructed
--  live from the documents' own links. A "seal" freezes a cryptographic hash of
--  that lineage (SHA-256 of a canonical snapshot of every document's key fields)
--  chained to the previous seal (prev_hash), so any later change to a sealed
--  document is detectable: re-hash the current lineage and compare to the seal.
--  Append-only by convention; RLS blocks cross-company access.
--  Paste into the Supabase SQL editor and Run once. Idempotent.
-- ============================================================================
create table if not exists public.trace_seals (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  seq          int  not null,                 -- 1,2,3... per (company, scope)
  scope        text not null,                 -- 'all' or 'project:<uuid>'
  content_hash text not null,                 -- sha-256 hex of the canonical lineage snapshot
  prev_hash    text,                          -- previous seal's content_hash (hash chain)
  doc_count    int,                           -- documents covered by this seal
  summary      jsonb,                         -- small human-readable snapshot (counts, roots)
  sealed_by    text,
  sealed_at    timestamptz default now()
);
create index if not exists idx_trace_seals_scope on public.trace_seals(company_id, scope, seq);

alter table public.trace_seals enable row level security;
drop policy if exists trace_seals_r on public.trace_seals;
create policy trace_seals_r on public.trace_seals for select using (company_id in (select public.my_company_ids()));
drop policy if exists trace_seals_w on public.trace_seals;
create policy trace_seals_w on public.trace_seals for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'trace_seals ready' as done;
