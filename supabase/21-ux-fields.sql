-- ============================================================================
--  Spacework ERP  -  UX FIELDS  (run AFTER 01-20)
--  Everyday fields non-expert staff expect but were missing:
--   partners.contact_person  - the human you actually deal with
--   partners.mobile          - separate mobile number
--   partners.payment_days    - default payment terms (days) -> auto-fills invoice due date
--   partners.credit_limit    - soft credit limit (warns when exceeded)
--  (no RLS changes - partners already company/org scoped)
-- ============================================================================
alter table public.partners add column if not exists contact_person text;
alter table public.partners add column if not exists mobile text;
alter table public.partners add column if not exists payment_days int;
alter table public.partners add column if not exists credit_limit numeric(20,4);

select 'partners_cols' t, count(*) n from information_schema.columns
where table_schema='public' and table_name='partners'
  and column_name in ('contact_person','mobile','payment_days','credit_limit');
