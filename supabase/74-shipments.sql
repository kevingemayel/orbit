-- ============================================================================
--  Spacework ERP  -  Shipments / container tracking + landed cost  (AFTER 73)
--  Closes the import side of the procurement cycle: a company that imports 50+
--  containers can track every shipment from booking to customs to receipt, and
--  roll freight/insurance/duty/clearing into the landed cost of the goods.
--    * shipments        : one record per shipment/container (incoterm, mode, BL,
--        vessel, ports, ETD/ETA, customs status, cost buildup, status pipeline)
--    * shipment_items   : the goods on a shipment, optionally linked to a PO line
--    * purchase_orders.incoterm, purchase_order_lines.shipment_id
--    * products: imported / lead_time_days / origin_country (for "not available
--        in Lebanon" sourcing)
--  Company-scoped RLS like every other business table.
-- ============================================================================

create table if not exists public.shipments (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  number         text,
  supplier_id    uuid references public.partners(id) on delete set null,
  project_id     uuid references public.projects(id) on delete set null,
  incoterm       text,                       -- EXW / FOB / CIF / CFR / DAP ...
  mode           text default 'sea',         -- sea | air | land
  status         text default 'booked',      -- booked | in_transit | arrived | cleared | received | cancelled
  container_no   text,
  bl_no          text,                        -- bill of lading / air waybill
  vessel         text,
  carrier        text,                        -- shipping line / forwarder
  pol            text,                        -- port of loading
  pod            text default 'Beirut',       -- port of discharge
  etd            date,
  eta            date,
  ata            date,                        -- actual arrival
  customs_status text,
  goods_value    numeric default 0,
  freight_cost   numeric default 0,
  insurance_cost numeric default 0,
  customs_duty   numeric default 0,
  clearing_cost  numeric default 0,
  currency_code  text,
  notes          text,
  created_at     timestamptz default now()
);
create index if not exists idx_shipments_company on public.shipments(company_id);
alter table public.shipments enable row level security;
drop policy if exists shp_r on public.shipments;
create policy shp_r on public.shipments for select using (company_id in (select public.my_company_ids()));
drop policy if exists shp_w on public.shipments;
create policy shp_w on public.shipments for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

create table if not exists public.shipment_items (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  shipment_id  uuid not null references public.shipments(id) on delete cascade,
  po_line_id   uuid references public.purchase_order_lines(id) on delete set null,
  product_id   uuid references public.products(id) on delete set null,
  description  text,
  quantity     numeric default 0,
  uom          text,
  value        numeric default 0,            -- goods value of this line (for apportioning landed cost)
  sequence     int default 0
);
create index if not exists idx_shipment_items_ship on public.shipment_items(shipment_id);
alter table public.shipment_items enable row level security;
drop policy if exists shpi_r on public.shipment_items;
create policy shpi_r on public.shipment_items for select using (company_id in (select public.my_company_ids()));
drop policy if exists shpi_w on public.shipment_items;
create policy shpi_w on public.shipment_items for all using (public.can_write_company(company_id)) with check (public.can_write_company(company_id));

alter table public.purchase_orders      add column if not exists incoterm      text;
alter table public.purchase_order_lines add column if not exists shipment_id   uuid references public.shipments(id) on delete set null;
alter table public.products             add column if not exists imported       boolean default false;
alter table public.products             add column if not exists lead_time_days  int;
alter table public.products             add column if not exists origin_country  text;

select 'shipments ready' as done;
