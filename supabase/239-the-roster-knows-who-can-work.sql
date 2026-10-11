-- 239: the roster knows who can actually work it.
--
-- Three tables in the People side held rows that nothing wrote and no screen
-- could show: 77 rows of employee_availability, every shift_swaps row a person
-- might ask for, and 12 training_bookings.
--
-- The one that matters is availability. A student who can work Tuesday evenings
-- and not Friday mornings tells you once, and then the rota is built by somebody
-- who cannot see it, so the shift is given out, nobody turns up, and the manager
-- finds out at nine on Friday. The rows existed. Nothing read them.
--
-- What is here:
--
--   roster_problems(company, from, to)   everything wrong with a stretch of the
--                                        rota, in words: rostered against stated
--                                        availability, rostered while on
--                                        approved leave, or rostered twice over
--                                        the same hours. A warning, not a
--                                        refusal: a manager who knows better
--                                        than the form must still be able to
--                                        put somebody on.
--   shift_swap_decide(swap, yes/no)      approving a swap actually moves the
--                                        shift to the other person, which is the
--                                        only thing a swap request is for.
--   training_bookings                    gains the invoice it was raised for, so
--                                        a paid public place can be billed once
--                                        and not twice.
--
-- One thing found on the way: hr_roster carried UNIQUE (employee_id, work_date),
-- so a person could be rostered once a day and no more. A split shift, which is
-- the ordinary shape of a day in a restaurant (lunch, a break, dinner), was
-- impossible to write down, and a double-booking was prevented by banning the
-- legitimate case along with the mistake. The constraint goes, and the overlap
-- check below takes its place: two shifts on one day are fine, two shifts over
-- the same hours are not.
--
-- Deliberately not done: suggesting a rota from availability. Guessing who
-- should work is a judgement about people, and a wrong guess that looks
-- official is worse than no guess.

-- a split shift is a normal day, so one row per person per day is too few
alter table public.hr_roster drop constraint if exists hr_roster_employee_id_work_date_key;
create index if not exists hr_roster_emp_date_idx on public.hr_roster (employee_id, work_date);

alter table public.employee_availability
  add column if not exists created_at timestamptz default now(),
  add column if not exists created_by uuid default auth.uid();
create index if not exists emp_avail_idx on public.employee_availability (company_id, employee_id);
create index if not exists emp_avail_day_idx on public.employee_availability (employee_id, day_of_week);

alter table public.shift_swaps
  add column if not exists decided_by_user uuid,
  add column if not exists created_by uuid default auth.uid();
create index if not exists shift_swaps_roster_idx on public.shift_swaps (roster_id);

alter table public.training_bookings
  add column if not exists invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists note text,
  add column if not exists created_at timestamptz default now();
create index if not exists training_bookings_course_idx on public.training_bookings (course_id);

-- @chunk
-- ---------------------------------------- what is wrong with this week's rota
create or replace function public.roster_problems(p_company uuid, p_from date default current_date, p_to date default (current_date + 13))
returns table (roster_id uuid, work_date date, employee_id uuid, employee text, problem text, severity text)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  -- 1. the person said, in so many words, that they are not available
  select r.id, r.work_date, r.employee_id, e.name,
         'Said they are not available' ||
           case when a.on_date is not null then ' on this date'
                else ' on a ' || to_char(r.work_date, 'FMDay') end ||
           coalesce(' (' || to_char(a.from_time, 'HH24:MI') || ' to ' || to_char(a.to_time, 'HH24:MI') || ')', '') ||
           coalesce(': ' || a.note, ''),
         'high'
    from public.hr_roster r
    join public.hr_employees e on e.id = r.employee_id
    join public.employee_availability a
      on a.employee_id = r.employee_id and a.company_id = r.company_id
     and coalesce(a.is_available, true) = false
     and (a.on_date = r.work_date
          or (a.on_date is null and a.day_of_week is not null
              and a.day_of_week = extract(dow from r.work_date)::int))
     -- a time range on the unavailability only clashes if the shift runs into it
     and (a.from_time is null or a.to_time is null or r.start_time is null or r.end_time is null
          or (r.start_time < a.to_time and r.end_time > a.from_time))
   where r.company_id = p_company and r.work_date between p_from and p_to

  union all
  -- 2. rostered on a day they said they could work, but outside the hours
  select r.id, r.work_date, r.employee_id, e.name,
         'Rostered ' || to_char(r.start_time, 'HH24:MI') || ' to ' || to_char(r.end_time, 'HH24:MI') ||
           ', but they are only free ' ||
           (select string_agg(to_char(x.from_time, 'HH24:MI') || '-' || to_char(x.to_time, 'HH24:MI'), ', ' order by x.from_time)
              from public.employee_availability x
             where x.employee_id = r.employee_id and coalesce(x.is_available, true)
               and x.from_time is not null
               and (x.on_date = r.work_date or (x.on_date is null and x.day_of_week = extract(dow from r.work_date)::int))),
         'medium'
    from public.hr_roster r
    join public.hr_employees e on e.id = r.employee_id
   where r.company_id = p_company and r.work_date between p_from and p_to
     and r.start_time is not null and r.end_time is not null
     and exists (select 1 from public.employee_availability x
                  where x.employee_id = r.employee_id and coalesce(x.is_available, true)
                    and x.from_time is not null and x.to_time is not null
                    and (x.on_date = r.work_date or (x.on_date is null and x.day_of_week = extract(dow from r.work_date)::int)))
     and not exists (select 1 from public.employee_availability x
                      where x.employee_id = r.employee_id and coalesce(x.is_available, true)
                        and x.from_time is not null and x.to_time is not null
                        and (x.on_date = r.work_date or (x.on_date is null and x.day_of_week = extract(dow from r.work_date)::int))
                        and r.start_time >= x.from_time and r.end_time <= x.to_time)

  union all
  -- 3. rostered while on leave that somebody already approved
  select r.id, r.work_date, r.employee_id, e.name,
         'On ' || coalesce(l.leave_type, 'leave') || ' from ' || l.date_from || ' to ' || l.date_to, 'high'
    from public.hr_roster r
    join public.hr_employees e on e.id = r.employee_id
    join public.hr_leaves l on l.employee_id = r.employee_id and l.company_id = r.company_id
     and r.work_date between l.date_from and coalesce(l.date_to, l.date_from)
     and coalesce(l.state, '') in ('approved', 'validate', 'confirmed', 'done')
   where r.company_id = p_company and r.work_date between p_from and p_to

  union all
  -- 4. in two places at once
  select r.id, r.work_date, r.employee_id, e.name,
         'Also rostered ' || to_char(o.start_time, 'HH24:MI') || ' to ' || to_char(o.end_time, 'HH24:MI') ||
           coalesce(' at ' || st.name, '') || ' the same day', 'high'
    from public.hr_roster r
    join public.hr_employees e on e.id = r.employee_id
    join public.hr_roster o on o.employee_id = r.employee_id and o.work_date = r.work_date and o.id <> r.id
    left join public.stores st on st.id = o.store_id
   where r.company_id = p_company and r.work_date between p_from and p_to
     and r.start_time is not null and r.end_time is not null
     and o.start_time is not null and o.end_time is not null
     and r.start_time < o.end_time and r.end_time > o.start_time
     and r.id < o.id
  order by 2, 4;
$fn$;
grant execute on function public.roster_problems(uuid, date, date) to authenticated;

-- @chunk
-- ------------------------------------------------------- a swap that swaps
create or replace function public.shift_swap_decide(p_swap uuid, p_approve boolean, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_s public.shift_swaps; v_r public.hr_roster; v_who text;
begin
  select * into v_s from public.shift_swaps where id = p_swap;
  if v_s.id is null then raise exception 'That request no longer exists.'; end if;
  if auth.uid() is not null and not public.can_write_app(v_s.company_id, '{employees,kitchen,pos,counter}'::text[]) then
    raise exception 'Your role cannot decide a shift swap. It needs Work in People or Kitchen.';
  end if;
  if coalesce(v_s.status, 'requested') not in ('requested', 'pending', 'offered') then
    raise exception 'That request has already been decided (%).', v_s.status;
  end if;
  select * into v_r from public.hr_roster where id = v_s.roster_id;
  if v_r.id is null then raise exception 'The shift this is about no longer exists.'; end if;

  if not p_approve then
    update public.shift_swaps
       set status = 'declined', reason = coalesce(nullif(btrim(coalesce(p_reason, '')), ''), reason),
           decided_at = now(), decided_by_user = auth.uid()
     where id = p_swap;
    return jsonb_build_object('ok', true, 'status', 'declined');
  end if;

  -- a swap or a giveaway both end the same way: somebody else works it
  if v_s.to_employee_id is null then
    raise exception 'Nobody has taken this shift yet, so there is nothing to approve. Find a taker first, or decline it.';
  end if;
  if v_s.to_employee_id = v_r.employee_id then
    raise exception 'That shift is already theirs.';
  end if;
  if not exists (select 1 from public.hr_employees e where e.id = v_s.to_employee_id and e.company_id = v_s.company_id) then
    raise exception 'The person taking the shift does not work for this company.';
  end if;

  update public.hr_roster set employee_id = v_s.to_employee_id,
         note = trim(both ' ' from coalesce(note, '') || ' (swapped from ' ||
                coalesce((select name from public.hr_employees where id = v_s.from_employee_id), 'another person') || ')')
   where id = v_r.id;
  update public.shift_swaps
     set status = 'approved', reason = coalesce(nullif(btrim(coalesce(p_reason, '')), ''), reason),
         decided_at = now(), decided_by_user = auth.uid()
   where id = p_swap;
  select name into v_who from public.hr_employees where id = v_s.to_employee_id;
  return jsonb_build_object('ok', true, 'status', 'approved', 'now_worked_by', v_who, 'date', v_r.work_date);
end $fn$;
grant execute on function public.shift_swap_decide(uuid, boolean, text) to authenticated;

select 'the roster can see availability' as done,
       (select count(*) from public.employee_availability) as availability_rows,
       (select count(*) from public.shift_swaps) as swaps,
       (select count(*) from public.training_bookings) as bookings;
