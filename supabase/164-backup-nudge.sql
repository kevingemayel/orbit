-- ============================================================================
-- 164-backup-nudge.sql  -  the backup reminder is monthly by default and goes
-- to the people who can act on it.
--
-- Two things were wrong. The default was weekly, which for a small company is
-- nagging rather than reminding. And the reminder was a company-wide
-- notification, so a warehouse clerk was told to take a backup he cannot
-- take. It now lands with the owners and admins of the company's organisation,
-- one each, addressed by user_id, and the bell only shows a person what is
-- addressed to everyone or to them.
--
-- Also here: the backup functions used "delete from" on their temporary tables
-- with no where clause. Through the API role that is refused by the
-- safe-update guard ("DELETE requires a WHERE clause"), which is what Backup
-- now was hitting. Those became truncate; see the accompanying repair script.
-- ============================================================================

alter table public.backup_settings alter column every_hours set default 720;
update public.backup_settings set every_hours = 720 where every_hours = 168 and last_run_at is null;

create or replace function public.backup_reminder_tick()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare s record; a record; n integer := 0; days integer;
begin
  for s in select bs.*, c.name, c.org_id from public.backup_settings bs
             join public.companies c on c.id = bs.company_id
            where bs.enabled loop
    days := case when s.last_run_at is null then 999 else extract(day from now() - s.last_run_at)::integer end;
    if s.last_run_at is not null and s.last_run_at > now() - make_interval(hours => s.every_hours) then continue; end if;
    for a in select m.user_id from public.org_members m
              where m.org_id = s.org_id and m.role in ('owner', 'admin')
                and (m.company_ids is null or s.company_id = any(m.company_ids)) loop
      insert into public.notifications (company_id, user_id, kind, title, body, link_action, actor_name, dedupe_key)
      values (s.company_id, a.user_id, 'backup',
              case when s.last_run_at is null then 'No backup has ever been taken' else 'Time to take a backup' end,
              case when s.last_run_at is null
                   then 'Settings, Backups. It downloads as one file with every record and every attachment in it. Keep it somewhere that is not this computer.'
                   else 'The last one was ' || days || ' day(s) ago. Settings, Backups, then keep the file somewhere that is not this computer.' end,
              'settings.backups', 'Orbit',
              'backup-' || s.company_id::text || '-' || a.user_id::text || '-' || to_char(now(), 'YYYY-MM-DD'))
      on conflict do nothing;
      n := n + 1;
    end loop;
  end loop;
  return n;
end $fn$;
revoke all on function public.backup_reminder_tick() from public, anon, authenticated;
