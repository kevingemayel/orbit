-- ============================================================================
-- 198-member-changes-guarded.sql
--
-- NOT APPLIED. Read it, then run it yourself.
--
-- What is wrong today
-- -------------------
-- Every rule about who may give whom what access lives in four functions that the
-- app calls: invite_member, set_member_role, set_member_companies and remove_member,
-- all of them going through _can_admin_member. Between them they say, correctly:
--
--   you never act on yourself, you only act on people ranked below your own role,
--   you only hand out a role ranked below your own, and the last owner is protected.
--
-- The table those functions write to says none of that. org_members is protected by
-- one policy, mem_write, and it asks a single question: is_org_admin(org_id). Since
-- 190 that means an active, unscoped member whose role is owner or admin, or whose
-- role has full access or can manage roles. Anybody who passes it can skip the four
-- functions and write the table straight through the REST API with their own token.
-- The only thing in the way is guard_member_changes, and in 190 it checks exactly two
-- things: an UPDATE that changes YOUR OWN role, companies or end date, and an auditor
-- with no end date. So today, without touching the app:
--
--   1. INSERT is not covered at all. A System Administrator (rank 80, can manage
--      roles) signs up a second account, reads its user id from that account, and
--      inserts a membership for it with role 'owner'. They sign in to the second
--      account and own the organisation. Their own row was never touched, so nothing
--      refused them.
--   2. Somebody else's row has no rank ceiling. The same person can set a colleague
--      to 'owner' with one PATCH. Two people can promote each other into full access.
--   3. DELETE has no guard, so the last owner's membership can be deleted directly.
--   4. is_org_admin is wider than can_manage_team: the legacy Administrator template
--      has neither full access nor can manage roles, so the screens hide every team
--      control from it and the four functions refuse it, and yet mem_write lets it
--      write the table freely.
--
-- Nothing in the app does any of this. It is reachable by anyone who can send an HTTP
-- request with their own sign-in token, which is everybody with an account.
--
-- Part 1 moves the rules out of the four functions and into the table, so they hold
-- whichever way the row is written. The policy is left exactly as it is, so nobody
-- loses a screen they use today.
--
-- Part 2 fixes the opposite problem in the same area: succession. _caller_rank returns
-- the caller's own rank and set_member_role refuses a role whose rank is greater than
-- OR EQUAL TO it. Owner is rank 100 and an owner's own rank is 100, so an owner can
-- never appoint a second owner, and _is_last_owner then refuses to let the only owner
-- be changed or removed. An organisation with one owner has no way to hand over. Part
-- 2 lets a role that already has full access hand out a role of equal rank, which is
-- the same exception guard_role_grants already makes for full access, and gives
-- nothing away: that person already holds everything.
--
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Part 1: the membership table enforces its own rules
-- ---------------------------------------------------------------------------
-- NEW and OLD are written to only inside the branch that owns them, because in a
-- DELETE trigger NEW is not assigned and in an INSERT trigger OLD is not, and
-- PL/pgSQL does not promise to skip the far side of an AND.
create or replace function public.guard_member_changes() returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  v_org       uuid;
  accepting   boolean;
  role_given  boolean;
  me          public.roles;
  trole       public.roles;
  my_rank     int;
  tgt_rank    int;
begin
  -- a platform operator, and anything running without a signed-in person, is not measured here
  if auth.uid() is null or public.is_platform_writer() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  -- ---------------- taking somebody off a team ----------------
  if tg_op = 'DELETE' then
    select * into me from public.member_role_row(old.org_id, auth.uid());
    my_rank := public._caller_rank(old.org_id);
    if not coalesce(me.full_access, false) and old.user_id <> auth.uid() then
      select coalesce(r.rank, 0) into tgt_rank from public.member_role_row(old.org_id, old.user_id) r;
      if coalesce(tgt_rank, 0) >= my_rank then
        raise exception 'You can only change or remove people ranked below your own role.';
      end if;
    end if;
    if public._is_last_owner(old.id) then
      raise exception 'You cannot remove the last owner. Make someone else an owner first.';
    end if;
    return old;
  end if;

  -- ---------------- putting somebody on one, or changing theirs ----------------
  v_org := new.org_id;
  accepting := coalesce(current_setting('orbit.accepting_invite', true), '') = '1';

  -- The first membership of a brand-new organisation has nobody to be measured
  -- against: create_org_for_me and apply_for_company make the organisation, then make
  -- the person who signed up its owner. That one goes through.
  if tg_op = 'INSERT' and not exists (select 1 from public.org_members m where m.org_id = v_org) then
    return new;
  end if;

  select * into me from public.member_role_row(v_org, auth.uid());
  my_rank := public._caller_rank(v_org);

  -- an auditor's account always ends
  if new.role = 'external_auditor' and new.expires_at is null then
    raise exception 'An auditor''s account needs an end date. Set when their access ends, then give them the role.';
  end if;

  if tg_op = 'INSERT' then
    role_given := true;
    if new.user_id = auth.uid() and not accepting then
      raise exception 'Nobody puts themselves on a team. Ask an administrator to invite you.';
    end if;
  else
    role_given := (new.role is distinct from old.role);
    -- a membership belongs to one person in one organisation. Moving either would be a
    -- way of stepping into somebody else's access without changing a single one of the
    -- columns the rule below looks at.
    if new.user_id is distinct from old.user_id then
      raise exception 'A membership belongs to the person it was made for. Invite the other person instead.';
    end if;
    if new.org_id is distinct from old.org_id then
      raise exception 'A membership belongs to the organisation it was made in.';
    end if;
    if new.user_id = auth.uid() and not accepting
       and (role_given
            or new.company_ids is distinct from old.company_ids
            or new.expires_at is distinct from old.expires_at
            or coalesce(new.status, 'active') is distinct from coalesce(old.status, 'active')) then
      raise exception 'Nobody changes their own role or access. Ask another administrator.';
    end if;
    -- the organisation keeps an owner who can sign in
    if old.role = 'owner' and public._is_last_owner(old.id)
       and (role_given or coalesce(new.status, 'active') <> 'active') then
      raise exception 'You cannot change or suspend the last owner. Make someone else an owner first.';
    end if;
  end if;

  -- nobody grants more than they hold, and nobody acts on someone at or above their own
  -- rank. A role with full access is the owner, and is left alone here for the same
  -- reason guard_role_grants leaves it alone.
  if not coalesce(me.full_access, false) then
    if role_given and not accepting then
      select * into trole from public.roles r
       where r.slug = new.role and (r.org_id = v_org or r.org_id is null)
       order by (r.org_id is not null) desc limit 1;
      if trole.slug is null then raise exception 'That role does not exist.'; end if;
      if coalesce(trole.rank, 0) >= my_rank then
        raise exception 'You can only give someone a role ranked below your own.';
      end if;
    end if;
    if tg_op = 'UPDATE' and old.user_id <> auth.uid() then
      select coalesce(r.rank, 0) into tgt_rank from public.member_role_row(v_org, old.user_id) r;
      if coalesce(tgt_rank, 0) >= my_rank then
        raise exception 'You can only change or remove people ranked below your own role.';
      end if;
    end if;
  end if;

  return new;
end $fn$;

-- the trigger has to see deletes now, which 190's did not
drop trigger if exists trg_guard_member_changes on public.org_members;
create trigger trg_guard_member_changes before insert or update or delete on public.org_members
  for each row execute function public.guard_member_changes();

-- ---------------------------------------------------------------------------
-- Part 2: an owner can appoint another owner
-- ---------------------------------------------------------------------------
-- Both functions are 41-user-management's, with one condition changed in each: a
-- caller whose own role has full access may hand out a role of equal rank. Everyone
-- else is still held to strictly below their own rank.
create or replace function public.set_member_role(p_member uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare mem public.org_members; trole public.roles; iam_full boolean;
begin
  select * into mem from public.org_members where id = p_member;
  if mem.id is null then raise exception 'That member no longer exists.'; end if;
  if not public._can_admin_member(p_member) then raise exception 'You can only change the role of people below your own rank.'; end if;
  select * into trole from public.roles where slug = p_role and (org_id = mem.org_id or org_id is null) order by (org_id is not null) desc limit 1;
  if trole.slug is null then raise exception 'That role does not exist.'; end if;
  iam_full := coalesce((select r.full_access from public.member_role_row(mem.org_id, auth.uid()) r), false);
  if trole.rank >= public._caller_rank(mem.org_id) and not iam_full and not public.is_platform_writer() then
    raise exception 'You can only assign a role below your own.'; end if;
  if public._is_last_owner(p_member) and p_role <> 'owner' then
    raise exception 'You cannot change the role of the last owner. Make someone else an owner first.'; end if;
  update public.org_members set role = p_role where id = p_member;
end; $$;

create or replace function public.invite_member(p_org uuid, p_email text, p_role text, p_company_ids uuid[] default null)
returns public.org_invites language plpgsql security definer set search_path = public as $$
declare em text := lower(btrim(p_email)); trole public.roles; inv public.org_invites; existing uuid; iam_full boolean;
begin
  if not public.can_manage_team(p_org) then raise exception 'You do not have permission to invite people to this team.'; end if;
  if em = '' or position('@' in em) = 0 then raise exception 'Enter a valid email address.'; end if;
  select * into trole from public.roles where slug = p_role and (org_id = p_org or org_id is null) order by (org_id is not null) desc limit 1;
  if trole.slug is null then raise exception 'That role does not exist.'; end if;
  iam_full := coalesce((select r.full_access from public.member_role_row(p_org, auth.uid()) r), false);
  if trole.rank >= public._caller_rank(p_org) and not iam_full and not public.is_platform_writer() then
    raise exception 'You can only invite people to a role below your own.'; end if;
  select m.user_id into existing from public.org_members m join auth.users u on u.id = m.user_id
    where m.org_id = p_org and lower(u.email) = em limit 1;
  if existing is not null then raise exception 'That person is already on this team.'; end if;
  insert into public.org_invites(org_id, email, role, company_ids, invited_by)
    values (p_org, em, p_role, p_company_ids, auth.uid())
    on conflict (org_id, lower(email)) where status = 'pending'
    do update set role = excluded.role, company_ids = excluded.company_ids, invited_by = auth.uid(), invited_at = now()
    returning * into inv;
  return inv;
end; $$;

-- ---------------------------------------------------------------------------
-- What to check after running this
-- ---------------------------------------------------------------------------
--   1. Signed in as a non-owner who can manage the team, try these through the API:
--        insert into org_members (user_id, org_id, role) values (<any id>, <org>, 'owner')
--        update org_members set role = 'owner' where id = <a colleague's membership>
--        delete from org_members where id = <the owner's membership>
--      All three must be refused with the messages above. Before this migration the
--      first two succeed.
--   2. Invite somebody, accept the invitation, change their role, set their companies,
--      set an end date, suspend, reactivate and remove them. All of these go through
--      the four functions and must still behave exactly as before.
--   3. Sign up a brand-new account and create an organisation. Its first membership
--      must still be created: that is the branch near the top of the trigger.
--   4. As an owner, give somebody else the Owner role. That is what Part 2 adds; it is
--      refused today. Once it works, the role picker in Users and Roles can offer roles
--      of equal rank to a full-access holder again (js/app.js, roleCell).
select '198 ready' as done;
