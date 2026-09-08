-- ============================================================================
-- 151-sample-book.sql  -  tonight's bookings for the sample diner.
--
-- The book is the first screen a restaurant owner opens, and like the floor and
-- the kitchen display it is anchored to now() rather than to a fixed date, so
-- the times read as tonight's service whenever the demo happens.
--
-- Called from sample_refresh_service(), so one command still refreshes
-- everything. SAMPLE DATA. Safe to re-run.
-- ============================================================================

create or replace function public.sample_refresh_book(
  p_company uuid default 'aa510000-0000-4000-8000-0000000000c0')
returns text
language plpgsql security definer set search_path = public as $fn$
declare n int := 0;
begin
  delete from public.reservations
   where company_id = p_company and reserved_for::date = current_date;

  insert into public.reservations
    (company_id, store_id, guest_name, phone, party_size, reserved_for,
     status, note, occasion, source, duration_minutes)
  select p_company, s.id, v.nm, nullif(v.ph, ''), v.pax,
         (current_date + v.tm::time)::timestamptz, v.st, v.note, v.occ, v.src, v.dur
    from (values
      ('JNH','Nadine Haddad','+961 3 411 220', 2,'19:00','seated', null, null,'phone',90),
      ('JNH','Rami Aoun','+961 3 550 118',     6,'19:30','booked','Two high chairs','Birthday','phone',120),
      ('JNH','Cynthia Khalil','+961 70 220 44',4,'19:45','booked','Nut allergy at the table', null,'online',90),
      ('JNH','Georges Bou Nassif','+961 3 700 901',8,'20:00','booked','Quiet corner if possible','Anniversary','phone',150),
      ('JNH','Walk-in','',                     3,'20:15','waitlist', null, null,'walk_in',60),
      ('JNH','Perla Chidiac','+961 76 118 220',2,'20:30','booked', null,'First visit','online',90),
      ('JNH','Marc Sfeir','+961 3 990 112',    5,'21:00','booked','Coming from the cinema', null,'phone',90),
      ('JBL','Elias Karam','+961 3 220 771',   4,'19:15','seated', null, null,'phone',90),
      ('JBL','Tala Mansour','+961 71 330 118', 2,'20:00','booked', null, null,'online',90),
      ('JBL','Ziad Abou Jaoude','+961 3 118 440',7,'20:45','booked','Set the long table','Family dinner','phone',150),
      ('JBL','Rita Nasr','+961 70 441 220',    2,'21:15','booked', null, null,'walk_in',60)
    ) as v(br, nm, ph, pax, tm, st, note, occ, src, dur)
    join public.stores s on s.company_id = p_company and s.code = v.br;

  get diagnostics n = row_count;
  return n || ' bookings for tonight';
end $fn$;

select public.sample_refresh_book();
