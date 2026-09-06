-- ============================================================================
-- 99-equipment.sql  -  Equipment / Fleet depth (Dolphin-gap #7).
-- Extends the existing plant_equipment register with legal-document tracking
-- (registration + insurance, with expiry) and a working-hours / odometer meter.
-- plant_equipment already carries company RLS, so no new policies are needed.
-- Safe to re-run.
-- ============================================================================
alter table public.plant_equipment
  add column if not exists registration_no    text,
  add column if not exists registration_expiry date,
  add column if not exists insurance_no       text,
  add column if not exists insurance_expiry   date,
  add column if not exists current_hours      numeric(20,2),
  add column if not exists meter_unit         text default 'hours';   -- hours | km
