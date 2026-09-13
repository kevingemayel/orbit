-- ============================================================================
-- 167-event-guest-config.sql  -  each event owns its invitation stages and
-- its priority levels.
--
-- The stages (longlist, shortlisted, invited, confirmed, maybe, declined) and
-- the priorities (A to D) were fixed in the code. A wedding planner and a
-- conference organiser do not invite people the same way, so the lists now
-- live on the event: renamed, reordered, added to. Each stage says what it
-- counts as (not yet invited, invited, confirmed, declined) so the capacity
-- bar and the badges keep meaning something whatever the words are.
-- An empty config means the standard lists.
-- ============================================================================
alter table public.event_events add column if not exists guest_config jsonb default '{}'::jsonb;
comment on column public.event_events.guest_config is 'Per-event invitation stages and priority levels: {stages:[{key,label,counts}], priorities:[{key,label,color}]}. Empty means the standard lists.';
