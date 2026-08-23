-- ============================================================================
--  Spacework ERP  -  CRM lead phone in three parts  (AFTER 66)
--  CRM opportunities now capture the phone the same way Contacts do: dialing
--  code + area + number, plus the combined string. Additive; RLS inherited.
-- ============================================================================

alter table public.crm_leads add column if not exists phone_cc   text;
alter table public.crm_leads add column if not exists phone_area text;
alter table public.crm_leads add column if not exists phone_num  text;

select 'crm phone parts ready' as done;
