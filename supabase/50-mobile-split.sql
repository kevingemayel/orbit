-- ============================================================================
--  Spacework ERP  -  MOBILE split  (run AFTER 01-49)
--  Mirror the phone split onto the mobile number: keep the single display string
--  in `mobile`, and remember the parts so the three-box editor round-trips.
-- ============================================================================
alter table public.partners add column if not exists mobile_cc   text;
alter table public.partners add column if not exists mobile_area text;
alter table public.partners add column if not exists mobile_num  text;

select 'mobile split ready' as done;
