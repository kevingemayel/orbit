-- ============================================================================
--  Orbit ERP  -  Supplier rating fields on contacts (price / quality / delivery)
--  Paste into the Supabase SQL editor and Run once.
-- ============================================================================
alter table public.partners add column if not exists rating_price    text;   -- Very Cheap | Cheap | Average | Expensive | Very Expensive
alter table public.partners add column if not exists rating_quality  text;   -- Low | Medium | High
alter table public.partners add column if not exists rating_delivery text;   -- In stock | Fast | Average | Slow

select 'contact rating fields ready' as done;
