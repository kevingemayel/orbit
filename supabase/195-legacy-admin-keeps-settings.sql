-- 195: members on the earlier "admin" template keep what they could do before roles were enforced.
--
-- The global admin template reads Manage for every app ("*") but View for Settings. Before 190
-- that Settings flag only shaped the screens, because the database let any owner, admin or
-- accountant write anything. Since 191 and 194 the database reads it, so people on this template
-- lost document numbering, terminology, automations, backups, API keys, webhooks and privacy
-- requests overnight. An admin is the company's administrator, and is_org_admin already treats
-- one as such: the template now says Manage for Settings too, which is exactly what it could do.
-- Other earlier templates are untouched: none of their members could write at all before 190.
-- Safe to re-run.

update public.roles
   set permissions = jsonb_set(coalesce(permissions, '{}'::jsonb), '{settings}', '{"lvl":"M"}'::jsonb, true)
 where org_id is null
   and slug = 'admin'
   and public.perm_level(permissions, 'settings') <> 'M';
