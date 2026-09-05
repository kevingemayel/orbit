-- ============================================================================
--  Orbit ERP  -  Two small database fixes. Paste into the Supabase SQL editor
--  (project: orbit) and Run. Both are idempotent and safe to re-run.
--    PART 1  Restore EVENT creation (currently blocked by RLS -> 403)
--    PART 2  Remove the throwaway "ZZ VAT Test UAE" test company (optional)
-- ============================================================================


-- ====================  PART 1 of 2 : FIX EVENT CREATION  ====================
--  Symptom: creating an event fails silently; POST /event_events returns 403.
--  Cause: 63-event-policy-fix.sql narrowed event_events read/write to
--  `id in my_event_ids()`. A brand-new event's id is not yet in my_event_ids(),
--  so the INSERT ... RETURNING id is denied and the whole insert 403s.
--  Fix: allow a company writer to read/write their own companies' events, the
--  same shape every other company-scoped table already uses (can_write_company).
--
--  NOTE (the trade-off 63 worried about): with this, a user who can write MORE
--  than one company in an org can READ those companies' event rows. The app
--  already scopes every event query to the ACTIVE company, so day-to-day this
--  matches all the other modules. If you specifically want events private per
--  company beyond the app filter, tell me and I'll do the collaborator-trigger
--  variant instead (adds the creator to event_collaborators on insert).

alter table public.event_events enable row level security;
drop policy if exists ev_r on public.event_events;
drop policy if exists ev_w on public.event_events;
create policy ev_r on public.event_events for select
  using (public.can_write_company(company_id) or id in (select public.my_event_ids()));
create policy ev_w on public.event_events for all
  using (public.can_write_company(company_id) or id in (select public.my_event_ids()))
  with check (public.can_write_company(company_id) or id in (select public.my_event_ids()));

select 'event creation restored' as done;


-- ====================  PART 2 of 2 : REMOVE TEST COMPANY  ===================
--  Optional. Drops the throwaway "ZZ VAT Test UAE" company + its seed rows only.
--  Safe: touches this one company id and its own company-scoped rows; runs as
--  one transaction, so if anything unexpected still references it, it rolls back
--  cleanly and changes nothing. (The ZZ USD test till was already deleted.)
do $$
declare cid uuid := '2840fef3-da10-43c3-a373-3ed99cff130c';  -- ZZ VAT Test UAE
begin
  if exists (select 1 from public.companies where id = cid) then
    delete from public.taxes         where company_id = cid;
    delete from public.journals      where company_id = cid;
    delete from public.accounts      where company_id = cid;
    delete from public.appt_settings where company_id = cid;
    delete from public.companies     where id = cid;
    raise notice 'ZZ VAT Test UAE removed';
  else
    raise notice 'ZZ VAT Test UAE already gone';
  end if;
end $$;
