-- 218: the two products the Odoo import duplicated, and the ones it typed wrong.
--
-- 210 matched Odoo's products to Orbit's by name, which caught most of them:
-- Tower Curtain Wall, Structural Glazing and the rest were already in Orbit and
-- were left alone. Two slipped through because the two systems spell the same
-- thing differently:
--
--   Odoo "CN_01"                              = Orbit "Calculation Notes" (code CN_01)
--   Odoo "Technical and Engineering Services" = Orbit "Technical & Engineering Services" (code ENG)
--
-- So Space Work's catalogue carries each of those twice, with the history split
-- across both: three invoice lines and ten order lines on one CN_01 and one
-- invoice line on the other. The one with the code is kept, because that is the
-- one the company set up and the one a user searches for; every row that points
-- at the import is repointed first, so no document loses its product and no
-- figure moves (a line keeps its own description, quantity and price).
--
-- The repointing walks every foreign key that points at products rather than a
-- list written out here, because there are 50 of them and a list goes stale.
do $merge$
declare
  v_co uuid;
  pair record;
  keep uuid; drop_id uuid;
  fk record; n int; total int := 0;
begin
  select id into v_co from public.companies where name = 'Space Work S.A.R.L';
  if v_co is null then raise notice 'no Space Work company here, nothing to do'; return; end if;

  for pair in
    select * from (values
      ('Calculation Notes', 'CN_01'),
      ('Technical & Engineering Services', 'Technical and Engineering Services')
    ) as v(keep_name, drop_name)
  loop
    select id into keep from public.products
     where company_id = v_co and name = pair.keep_name and default_code is not null;
    select id into drop_id from public.products
     where company_id = v_co and name = pair.drop_name and default_code is null;
    if keep is null or drop_id is null or keep = drop_id then
      raise notice 'skipped % / %: one of them is not there any more', pair.keep_name, pair.drop_name;
      continue;
    end if;

    for fk in
      select c.conrelid::regclass::text as tbl, a.attname as col
      from pg_constraint c
      join unnest(c.conkey) as k(attnum) on true
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
      where c.confrelid = 'public.products'::regclass and c.contype = 'f'
        and c.conrelid <> 'public.products'::regclass
    loop
      execute format('update %s set %I = $1 where %I = $2', fk.tbl, fk.col, fk.col)
        using keep, drop_id;
      get diagnostics n = row_count;
      if n > 0 then
        total := total + n;
        raise notice '  % rows in %.% moved to %', n, fk.tbl, fk.col, pair.keep_name;
      end if;
    end loop;

    -- a product can point at another product (a variant's template); clear it rather than cascade
    update public.products set parent_product_id = keep where parent_product_id = drop_id;
    delete from public.products where id = drop_id;
    raise notice 'merged "%" into "%"', pair.drop_name, pair.keep_name;
  end loop;
  raise notice '% row(s) repointed in all', total;
end $merge$;

-- The import gave every Odoo product the same type, so a few services came in as
-- stock items. A stock item with no stock shows up in On-Hand, reordering and
-- stock counts as a line that will never be counted, and a bill for it posts
-- through inventory instead of straight to expense. These six are work and
-- subscriptions, not things on a shelf. Glass, screws, the glass build-ups and
-- the cutter stay stock items, because they are. Nothing with a stock movement
-- behind it is touched, because its history says it really is held in stock.
update public.products p set type = 'service'
where p.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
  and p.type <> 'service'
  and p.name in (
    '.ai domain registration',
    'microsoft 365 email essentials',
    'CN Approval',
    'CN Sliding Louvers',
    'Facade Execution Supervision',
    'Supply. Manufacturing and Installation of A2 Aluminum Composite Panels'
  )
  and not exists (select 1 from public.stock_moves m where m.product_id = p.id);

select p.name, p.default_code, p.type
from public.products p
where p.company_id = (select id from public.companies where name = 'Space Work S.A.R.L')
order by p.type, p.name;
