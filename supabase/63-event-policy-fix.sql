-- ============================================================================
--  Spacework ERP  -  EVENT parent-row read leak fix  (AFTER 62)
--  event_events had a FOR ALL write policy (ev_w) whose USING clause was
--  `can_write_company(company_id) OR id in my_event_ids()`. Because FOR ALL
--  also governs SELECT, can_write_company (true for a platform writer / any
--  company admin across the org) let the parent event row be READ cross-company
--  even though my_event_ids() (and every child table) correctly scoped to the
--  active company. Same class as the partners_w fix in 56: keep the write
--  policy's USING to the read scope; validate the target company in WITH CHECK.
-- ============================================================================

drop policy if exists ev_w on public.event_events;
create policy ev_w on public.event_events for all
  using (id in (select public.my_event_ids()))
  with check (public.can_write_company(company_id) or id in (select public.my_event_ids()));

select 'event policy fixed' as done;
