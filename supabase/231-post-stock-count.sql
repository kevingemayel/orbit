-- 231: a stock count that changes no stock is a piece of paper.
--
-- Counts could be recorded - date, store, type, blind or not, status - and the
-- screen said so out loud: "Quantities are not entered here and stock is not
-- adjusted." So the one thing a count is for, making the system agree with the
-- shelf, could not happen. The lines table existed and had rows in it that no
-- screen could show.
--
-- Posting a count now does what counting is for:
--   every line whose counted quantity differs from what the system expected
--   moves that difference in or out of the location, through the inventory
--   adjustment location, and the value of it posts Dr/Cr stock against the
--   stock adjustment account. The count itself is marked posted, so it cannot
--   be posted twice, and a line with no variance moves nothing.
create or replace function public.post_stock_count(p_count uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  c public.stock_counts; cid uuid; co_ccy text; jrn uuid; eid uuid;
  loc uuid; adj_loc uuid; stock_acc uuid; adj_acc uuid;
  l record; value_up numeric := 0; value_down numeric := 0; n int := 0;
begin
  select * into c from public.stock_counts where id = p_count;
  if c.id is null then raise exception 'That count no longer exists.'; end if;
  cid := c.company_id;
  if auth.uid() is not null and not public.can_write_app(cid, '{inventory,kitchen,pos}'::text[]) then
    raise exception 'Your role cannot post a stock count. It needs Work in Inventory or Kitchen.';
  end if;
  if coalesce(c.status, '') = 'posted' then raise exception 'This count is already posted.'; end if;

  -- where the count was taken, and the inventory location the difference comes from
  loc := c.location_id;
  if loc is null then
    select sl.id into loc from public.stock_locations sl
      left join public.stores st on st.id = c.store_id
     where sl.company_id = cid and sl.usage = 'internal' and coalesce(sl.is_active, true)
       and (st.warehouse_id is null or sl.warehouse_id = st.warehouse_id)
     order by (case when st.warehouse_id is not null and sl.warehouse_id = st.warehouse_id then 0 else 1 end), sl.name
     limit 1;
  end if;
  select sl.id into adj_loc from public.stock_locations sl
   where sl.company_id = cid and sl.usage = 'inventory' and coalesce(sl.is_active, true) order by sl.name limit 1;
  if loc is null or adj_loc is null then
    raise exception 'This company needs an internal location and an inventory adjustment location before a count can post.';
  end if;

  for l in
    select scl.*, round(coalesce(scl.counted_qty, 0) - coalesce(scl.expected_qty, 0), 4) as diff,
           coalesce(scl.unit_cost, p.cost_price, 0) as cost
      from public.stock_count_lines scl
      join public.products p on p.id = scl.product_id
     where scl.count_id = p_count
  loop
    continue when abs(l.diff) < 0.0001;
    insert into public.stock_moves (company_id, product_id, quantity, uom, location_id, location_dest_id, state, date, store_id, lot_id)
    values (cid, l.product_id, abs(l.diff), l.uom,
            case when l.diff > 0 then adj_loc else loc end,
            case when l.diff > 0 then loc else adj_loc end,
            'done', coalesce(c.count_date, current_date), c.store_id, l.lot_id);
    update public.stock_count_lines set variance_qty = l.diff where id = l.id;
    if l.diff > 0 then value_up := value_up + round(l.diff * l.cost, 2);
    else value_down := value_down + round(-l.diff * l.cost, 2); end if;
    n := n + 1;
  end loop;

  -- and what the difference was worth
  select stock_account_id, stock_adj_account_id into stock_acc, adj_acc from public.companies where id = cid;
  if (value_up + value_down) > 0.004 and stock_acc is not null and adj_acc is not null then
    select currency_code into co_ccy from public.companies where id = cid;
    select id into jrn from public.journals where company_id = cid and type = 'general' order by code limit 1;
    if jrn is null then select id into jrn from public.journals where company_id = cid order by code limit 1; end if;
    if jrn is not null then
      insert into public.journal_entries (company_id, journal_id, date, ref, narration, currency_code, state, source_type, source_id)
      values (cid, jrn, coalesce(c.count_date, current_date),
              'Stock count ' || coalesce(c.reference, to_char(coalesce(c.count_date, current_date), 'DD Mon YYYY')),
              n || ' line(s) adjusted', co_ccy, 'draft', 'stock_count', p_count::text)
      returning id into eid;
      if value_up > 0.004 then
        insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
        values (eid, cid, stock_acc, 'Stock found on count', value_up, 0, value_up, co_ccy);
        insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
        values (eid, cid, adj_acc, 'Stock found on count', 0, value_up, -value_up, co_ccy);
      end if;
      if value_down > 0.004 then
        insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
        values (eid, cid, adj_acc, 'Stock short on count', value_down, 0, value_down, co_ccy);
        insert into public.journal_lines (entry_id, company_id, account_id, label, debit, credit, amount_currency, currency_code)
        values (eid, cid, stock_acc, 'Stock short on count', 0, value_down, -value_down, co_ccy);
      end if;
      perform public.post_entry(eid);
    end if;
  end if;

  update public.stock_counts set status = 'posted', approved_at = now() where id = p_count;
  return eid;
end $fn$;

grant execute on function public.post_stock_count(uuid) to authenticated;

select 'post_stock_count ready' as done;
