-- 209: a delivery note says how the goods travel and how they are packed.
-- Delivery methods and package types were configuration lists that nothing read.
-- Three columns put them on the note itself, so the carrier, its charge and the
-- packing appear on the printed note and can be reported on.
alter table public.delivery_notes add column if not exists delivery_method_id uuid references public.delivery_methods(id) on delete set null;
alter table public.delivery_notes add column if not exists package_type_id    uuid references public.package_types(id) on delete set null;
alter table public.delivery_notes add column if not exists package_count      numeric(20,4) default 0;
alter table public.delivery_notes add column if not exists carrier_charge     numeric(20,4) default 0;
alter table public.delivery_notes add column if not exists tracking_ref       text default '';
create index if not exists idx_dn_method on public.delivery_notes(company_id, delivery_method_id);

select 'delivery method + packages ready' as done;
