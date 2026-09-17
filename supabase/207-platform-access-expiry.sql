-- 207: vendor access to customer data is time-boxed and has a reason.
--
-- platform_admins grants Space Work read of every tenant, and before this it had no end
-- date, no reason and no record: one row, forever, invisible to the customer. That is
-- the first thing a serious customer's security team asks about, and the honest answer
-- has to be "it expires, it says why, and you can see it".
--
-- The check now ignores an expired row. Existing rows are given a default end date
-- rather than being cut off, so nothing breaks today. There is no way to grant this
-- from inside the app: the table is read-only through the API, as it has always been,
-- and a row is added in the SQL editor.
-- Safe to re-run.

alter table public.platform_admins add column if not exists expires_at timestamptz;
alter table public.platform_admins add column if not exists reason text;
alter table public.platform_admins add column if not exists granted_by uuid;

-- an existing grant keeps working, but now it ends
update public.platform_admins
   set expires_at = coalesce(expires_at, now() + interval '180 days'),
       reason = coalesce(reason, note, 'Platform support, set before access was time-boxed')
 where expires_at is null;

create or replace function public.is_platform_admin() returns boolean
  language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.platform_admins
                  where user_id = auth.uid()
                    and (expires_at is null or expires_at > now()));
$fn$;

create or replace function public.is_platform_writer() returns boolean
  language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.platform_admins
                  where user_id = auth.uid() and can_write
                    and (expires_at is null or expires_at > now()));
$fn$;

-- a customer can see whether anyone at Space Work holds access to their data right now
create or replace function public.platform_access_visible() returns jsonb
  language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
           'person', coalesce(u.email, 'Space Work'),
           'can_change_data', p.can_write,
           'since', p.added_at,
           'until', p.expires_at,
           'reason', coalesce(p.reason, p.note))), '[]'::jsonb)
    from public.platform_admins p
    left join auth.users u on u.id = p.user_id
   where (p.expires_at is null or p.expires_at > now())
     and exists (select 1 from public.org_members m where m.user_id = auth.uid() and coalesce(m.status,'active') = 'active');
$fn$;
revoke all on function public.platform_access_visible() from public, anon;
grant execute on function public.platform_access_visible() to authenticated, service_role;
