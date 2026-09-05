-- ============================================================================
--  Orbit ERP  -  Traceability (take-off -> RFQ -> PO -> receipt -> bill -> GL)
--
--  Most hops are already foreign-key linked (bill->PO via purchase_order_id,
--  GL->bill via journal_entries.source_id, move->picking via picking_id). These
--  columns close the remaining text-only hops with real links so the lineage can
--  be walked reliably and sealed:
--    purchase_orders.source_req_id / source_rfq_id  (PO came from a take-off / RFQ)
--    rfqs.requisition_id                            (RFQ came from a take-off)
--    stock_pickings.po_id                           (goods receipt against a PO)
--  Plus trace_seals: a tamper-evident SHA-256 hash chain over a lineage snapshot.
--  Paste into the Supabase SQL editor and Run once. Idempotent; additive.
-- ============================================================================
alter table public.purchase_orders add column if not exists source_req_id uuid references public.material_requisitions(id) on delete set null;
alter table public.purchase_orders add column if not exists source_rfq_id uuid references public.rfqs(id) on delete set null;
alter table public.rfqs            add column if not exists requisition_id uuid references public.material_requisitions(id) on delete set null;
alter table public.stock_pickings  add column if not exists po_id          uuid references public.purchase_orders(id) on delete set null;
create index if not exists idx_po_srcreq on public.purchase_orders(source_req_id);
create index if not exists idx_po_srcrfq on public.purchase_orders(source_rfq_id);
create index if not exists idx_rfq_req   on public.rfqs(requisition_id);
create index if not exists idx_pick_po   on public.stock_pickings(po_id);

create table if not exists public.trace_seals (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  seq          int  not null,                 -- 1,2,3... per (company, scope)
  scope        text not null,                 -- 'all' or 'project:<uuid>'
  content_hash text not null,                 -- sha-256 hex of the canonical lineage snapshot
  prev_hash    text,                          -- previous seal's content_hash (hash chain)
  doc_count    int,                           -- documents covered by this seal
  summary      jsonb,                         -- small human-readable snapshot
  sealed_by    text,
  sealed_at    timestamptz default now()
);
create index if not exists idx_trace_seals_scope on public.trace_seals(company_id, scope, seq);

alter table public.trace_seals enable row level security;
drop policy if exists trace_seals_r on public.trace_seals;
create policy trace_seals_r on public.trace_seals for select using (company_id in (select public.my_company_ids()));
drop policy if exists trace_seals_w on public.trace_seals;
create policy trace_seals_w on public.trace_seals for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

select 'traceability ready' as done;
