-- ============================================================================
-- 170-posted-entry-guard.sql  -  a posted journal entry is history.
--
-- The lines of a posted entry were already guarded (trg_guard_line), and the
-- screen greys out the header. But the header row itself had no guard, so
-- through the API a posted entry's date, journal, book or company could be
-- changed, moving it between periods, and a posted entry could be deleted
-- outright, taking its lines with it. The two flags that legitimately change
-- after posting (the intercompany marks) stay writable. Anything else is a
-- reversal, never an edit.
-- ============================================================================
create or replace function public.guard_posted_entry()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'DELETE' then
    -- the one exception: the whole company is being deleted (a discarded
    -- restore), and the entries are going with it through the cascade
    if old.state = 'posted' and exists (select 1 from public.companies c where c.id = old.company_id) then
      raise exception 'cannot delete a posted entry; reverse it instead';
    end if;
    return old;
  end if;
  if old.state = 'posted' then
    if new.state is distinct from old.state
       or new.date is distinct from old.date
       or new.journal_id is distinct from old.journal_id
       or new.book_id is distinct from old.book_id
       or new.company_id is distinct from old.company_id
       or new.currency_code is distinct from old.currency_code
       or new.posted_at is distinct from old.posted_at then
      raise exception 'cannot modify a posted entry; reverse it instead';
    end if;
  end if;
  return new;
end $fn$;
drop trigger if exists trg_guard_entry on public.journal_entries;
create trigger trg_guard_entry before update or delete on public.journal_entries
  for each row execute function public.guard_posted_entry();
