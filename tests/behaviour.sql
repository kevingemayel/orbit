-- ============================================================================
-- Orbit behavioural checks.
--
-- The structural suite (tests/checks.js) reads the source and catches dead
-- menu actions, missing icons and orphaned help. It cannot tell you whether
-- posting an invoice produced the right journal, or whether a table that shows
-- as paid was actually paid in full. Those are the failures that cost money,
-- and until now they were caught only by eye.
--
-- This is one query. It runs against a real database and returns one row per
-- invariant with the number of rows that break it and an example. Nothing here
-- writes; it is safe to run against production and is meant to be.
--
--   bash tests/behaviour.sh            (needs SUPABASE_PROJECT_REF + SUPABASE_PAT)
--
-- Every check states the failure it exists to catch, in the `why` column, so a
-- red line tells you what it means without reading this file.
-- ============================================================================

with

-- ---------------------------------------------------------------- accounting
-- 1. Double entry. A posted entry whose debits and credits differ is a broken
--    ledger, full stop: every report built on it is wrong by that amount.
unbalanced as (
  select e.id, e.entry_number, round(sum(l.debit), 2) dr, round(sum(l.credit), 2) cr
    from public.journal_entries e
    join public.journal_lines l on l.entry_id = e.id
   where e.state = 'posted'
   group by e.id, e.entry_number
  having round(sum(l.debit), 2) <> round(sum(l.credit), 2)),

-- 2. The trial balance for a whole company must come to zero. Entries can each
--    balance and the company still not tie if a line lost its entry.
tb as (
  select l.company_id, round(sum(l.debit) - sum(l.credit), 2) diff
    from public.journal_lines l
    join public.journal_entries e on e.id = l.entry_id and e.state = 'posted'
   group by l.company_id
  having round(sum(l.debit) - sum(l.credit), 2) <> 0),

-- 3. A journal line posted to another company's account is a tenant leak that
--    shows up as money, not as a permission error.
crosscompany as (
  select l.id, l.company_id, a.company_id acct_company
    from public.journal_lines l
    join public.accounts a on a.id = l.account_id
   where a.company_id is distinct from l.company_id),

-- 4. An entry with no book cannot be filtered by book, so it silently appears
--    in every book at once. The BEFORE INSERT trigger exists to prevent this.
nobook as (
  select e.id, e.entry_number from public.journal_entries e
   where e.book_id is null
     and exists (select 1 from public.books b where b.company_id = e.company_id)),

-- ------------------------------------------------------------------ invoices
-- 5. A posted invoice with no journal entry is revenue that never reached the
--    ledger: it shows on the sales report and not on the P&L.
unposted as (
  select i.id, i.number from public.invoices i
   where i.state = 'posted' and i.journal_entry_id is null),

-- 6. The header must equal the lines. When it does not, the customer is billed
--    one number and the ledger records another.
hdrlines as (
  select i.id, i.number, round(i.amount_untaxed, 2) hdr, round(coalesce(sum(l.price_subtotal), 0), 2) lines
    from public.invoices i
    left join public.invoice_lines l on l.invoice_id = i.id
   where i.state in ('posted', 'draft')
   group by i.id, i.number, i.amount_untaxed
  having abs(round(i.amount_untaxed, 2) - round(coalesce(sum(l.price_subtotal), 0), 2)) > 0.01),

-- 7. What is still owed can never exceed what was billed, nor go below zero.
badresidual as (
  select i.id, i.number, i.amount_total, i.amount_residual from public.invoices i
   where i.state = 'posted'
     and (i.amount_residual < -0.01 or i.amount_residual > abs(i.amount_total) + 0.01)),

-- ------------------------------------------------------------------- service
-- 8. A till line whose total is not its own quantity times its own price is
--    the simplest way to overcharge a guest and never notice.
badline as (
  select l.id, l.name, l.qty, l.unit_price, l.line_total
    from public.pos_order_lines l
   where abs(round(l.line_total, 2) - round(l.qty * l.unit_price - coalesce(l.discount, 0), 2)) > 0.01),

-- 9. The order header must add its own lines up. This is what the floor pad
--    writes on every tap, so a drift here means the bill on screen is wrong.
badorder as (
  select o.id, o.number, round(o.subtotal, 2) hdr, round(coalesce(sum(l.line_total), 0), 2) lines
    from public.pos_orders o
    left join public.pos_order_lines l on l.order_id = o.id
   where o.status in ('open', 'paid')
   group by o.id, o.number, o.subtotal
  having abs(round(o.subtotal, 2) - round(coalesce(sum(l.line_total), 0), 2)) > 0.01),

-- 10. A table marked paid that was not fully tendered is money walked out of
--     the door, and it is invisible on every screen because the order is shut.
underpaid as (
  select o.id, o.number, round(o.total, 2) tot, round(coalesce(sum(p.amount), 0), 2) took
    from public.pos_orders o
    left join public.pos_payments p on p.order_id = o.id
   where o.status = 'paid' and o.total > 0
   group by o.id, o.number, o.total
  having abs(round(o.total, 2) - round(coalesce(sum(p.amount), 0), 2)) > 0.01),

-- 11. Tax must actually be charged where a sales rate is configured. This is
--     the bug the floor pad shipped with: subtotal = total, tax left at zero.
notax as (
  select o.id, o.number from public.pos_orders o
   where o.status = 'paid' and o.subtotal > 0 and coalesce(o.tax, 0) = 0
     and exists (select 1 from public.taxes t
                  where t.company_id = o.company_id and t.is_active
                    and t.amount > 0 and (t.scope is null or t.scope ~* 'sale|out|both'))),

-- 12. The control accounts. This is the check that turns a missing link into a
--     number: what the aged receivable says you are owed must equal what the
--     balance sheet says you are owed, or one of the two is lying.
ctrl as (
  select c.id company_id, c.name,
         round(coalesce((select sum(l.debit - l.credit) from public.journal_lines l
                           join public.journal_entries e on e.id = l.entry_id and e.state = 'posted'
                           join public.accounts a on a.id = l.account_id
                          where l.company_id = c.id and a.type_code = 'asset_receivable'), 0), 2) ledger_ar,
         round(coalesce((select sum(i.amount_residual) from public.invoices i
                          where i.company_id = c.id and i.state = 'posted'
                            and i.move_type in ('out_invoice', 'out_refund')), 0), 2) open_ar
    from public.companies c),
badctrl as (
  select * from ctrl where abs(ledger_ar - open_ar) > 0.05),

-- ------------------------------------------------------------------ property
-- 12. A charge run must bill exactly what it says it raised. Rounding a share
--     down on every unit is how a building quietly under-collects all year.
badrun as (
  select r.id, r.period, round(r.amount_total, 2) run, round(coalesce(sum(i.amount_total), 0), 2) billed
    from public.property_charge_runs r
    left join public.invoices i on i.property_charge_run_id = r.id and i.state <> 'cancel'
   where r.deleted_at is null
   group by r.id, r.period, r.amount_total
  having abs(round(r.amount_total, 2) - round(coalesce(sum(i.amount_total), 0), 2)) > 0.05),

-- ----------------------------------------------------------- payables & stock
-- 16. The payables control account must agree with the unpaid supplier bills,
--     the same way the receivable control has to agree with the chase list. If
--     they drift, one of them is lying about what you owe, and the balance
--     sheet and the payment run cannot both be right.
apctrl as (
  select c.id company_id, c.name,
         round(coalesce((select sum(l.credit - l.debit) from public.journal_lines l
                           join public.journal_entries e on e.id = l.entry_id and e.state = 'posted'
                           join public.accounts a on a.id = l.account_id
                          where l.company_id = c.id and a.type_code = 'liability_payable'), 0), 2) ledger_ap,
         round(coalesce((select sum(i.amount_residual) from public.invoices i
                          where i.company_id = c.id and i.state = 'posted'
                            and i.move_type in ('in_invoice', 'in_refund')), 0), 2) open_ap
    from public.companies c),
badap as (
  select * from apctrl where abs(ledger_ap - open_ap) > 0.05),

-- 17. Stock is the other control account nobody checks. What the ledger says
--     the warehouse is worth must equal the valuation layers behind it; a gap
--     means the balance sheet carries stock that either is not there or was
--     never priced.
stockctrl as (
  select c.id company_id, c.name,
         round(coalesce((select sum(l.debit - l.credit) from public.journal_lines l
                           join public.journal_entries e on e.id = l.entry_id and e.state = 'posted'
                          where l.company_id = c.id
                            -- the same order of authority the posting code uses:
                            -- the company's configured account, then any account
                            -- a product names, then the seeded code
                            and l.account_id in (
                                  select c.stock_account_id where c.stock_account_id is not null
                                  union
                                  select distinct p.stock_account_id from public.products p
                                   where p.company_id = c.id and p.stock_account_id is not null
                                  union
                                  select a.id from public.accounts a where a.company_id = c.id and a.code = '3100')), 0), 2) ledger_stock,
         round(coalesce((select sum(v.value) from public.stock_valuation_layers v
                          where v.company_id = c.id), 0), 2) layers
    from public.companies c),
badstock as (
  select * from stockctrl
   where abs(ledger_stock - layers) > 0.05 and (ledger_stock <> 0 or layers <> 0)),

-- ------------------------------------------------------------- multi-currency
-- 18. A posted document in a currency that is not the company's own needs a
--     rate on or before its date. Without one the conversion is a silent 1:1,
--     which does not error, does not look wrong, and is wrong by whatever the
--     rate happens to be. This is the whole reason fx_convert refuses to guess.
norate as (
  select e.entry_number, e.currency_code, e.date, c.name
    from public.journal_entries e
    join public.companies c on c.id = e.company_id
   where e.state = 'posted'
     and e.currency_code is not null and e.currency_code <> c.currency_code
     and not exists (select 1 from public.currency_rates r
                      where r.org_id = c.org_id and r.code = e.currency_code and r.rate_date <= e.date)),

-- 19. A tender taken in another currency must convert to exactly what was
--     recorded against the bill: amount = amount_ccy x fx_rate. If it does not,
--     the drawer count and the sales figure disagree and only one of them is
--     the money that is actually there.
badtender as (
  select o.number, p.currency_code, p.amount_ccy, p.fx_rate, p.amount
    from public.pos_payments p
    join public.pos_orders o on o.id = p.order_id
   where p.amount_ccy is not null and p.fx_rate is not null
     and abs(round(p.amount_ccy * p.fx_rate, 2) - round(p.amount, 2)) > 0.02),

-- ------------------------------------------------------------------ tenancy
-- 13. Every company-scoped row must point at a company that exists. An orphan
--     is unreachable by any user and invisible to every report.
orphans as (
  select 'invoices' t, count(*) n from public.invoices i
    where not exists (select 1 from public.companies c where c.id = i.company_id)
  union all
  select 'journal_entries', count(*) from public.journal_entries e
    where not exists (select 1 from public.companies c where c.id = e.company_id)
  union all
  select 'pos_orders', count(*) from public.pos_orders o
    where not exists (select 1 from public.companies c where c.id = o.company_id)),

results as (
  select 1 ord, 'accounting' area, 'every posted entry balances' chk,
         (select count(*) from unbalanced) bad,
         (select coalesce(string_agg(entry_number || ' dr ' || dr || ' cr ' || cr, '; '), '') from (select * from unbalanced limit 3) x) detail,
         'a ledger that does not balance makes every report built on it wrong' why
  union all select 2, 'accounting', 'the trial balance ties, per company',
         (select count(*) from tb),
         (select coalesce(string_agg(company_id::text || ' off by ' || diff, '; '), '') from (select * from tb limit 3) x),
         'entries can each balance and the company still not tie if a line lost its entry'
  union all select 3, 'accounting', 'no journal line posts to another company account',
         (select count(*) from crosscompany),
         (select coalesce(string_agg(id::text, '; '), '') from (select * from crosscompany limit 3) x),
         'a tenant leak that shows up as money rather than a permission error'
  union all select 4, 'accounting', 'every entry carries a book',
         (select count(*) from nobook),
         (select coalesce(string_agg(entry_number, '; '), '') from (select * from nobook limit 3) x),
         'an entry with no book appears in every book at once, so statutory and management mix'
  union all select 5, 'invoices', 'every posted invoice reached the ledger',
         (select count(*) from unposted),
         (select coalesce(string_agg(number, '; '), '') from (select * from unposted limit 3) x),
         'revenue on the sales report and absent from the profit and loss'
  union all select 6, 'invoices', 'the header equals the lines',
         (select count(*) from hdrlines),
         (select coalesce(string_agg(number || ' hdr ' || hdr || ' lines ' || lines, '; '), '') from (select * from hdrlines limit 3) x),
         'the customer is billed one number and the ledger records another'
  union all select 7, 'invoices', 'what is owed is between zero and the total',
         (select count(*) from badresidual),
         (select coalesce(string_agg(number || ' total ' || amount_total || ' residual ' || amount_residual, '; '), '') from (select * from badresidual limit 3) x),
         'a negative or oversized residual corrupts the aged receivable and the chase list'
  union all select 8, 'service', 'every till line is its own quantity times its own price',
         (select count(*) from badline),
         (select coalesce(string_agg(name || ' ' || qty || ' x ' || unit_price || ' = ' || line_total, '; '), '') from (select * from badline limit 3) x),
         'the simplest way to overcharge a guest and never notice'
  union all select 9, 'service', 'the order header adds up its own lines',
         (select count(*) from badorder),
         (select coalesce(string_agg(number || ' hdr ' || hdr || ' lines ' || lines, '; '), '') from (select * from badorder limit 3) x),
         'the floor pad rewrites this on every tap, so a drift means the bill on screen is wrong'
  union all select 10, 'service', 'a table marked paid was tendered in full',
         (select count(*) from underpaid),
         (select coalesce(string_agg(number || ' total ' || tot || ' took ' || took, '; '), '') from (select * from underpaid limit 3) x),
         'money walked out of the door, invisible on every screen because the order is shut'
  union all select 11, 'service', 'sales tax is charged where a rate is configured',
         (select count(*) from notax),
         (select coalesce(string_agg(number, '; '), '') from (select * from notax limit 3) x),
         'the floor pad shipped with subtotal = total and tax left at zero, under-declaring VAT'
  union all select 12, 'accounting', 'the receivable control ties to the aged receivable',
         (select count(*) from badctrl),
         (select coalesce(string_agg(name || ' ledger ' || ledger_ar || ' vs open ' || open_ar, '; '), '') from (select * from badctrl limit 3) x),
         'the balance sheet and the chase list disagree about what you are owed'
  union all select 14, 'property', 'a charge run bills exactly what it raised',
         (select count(*) from badrun),
         (select coalesce(string_agg(period || ' run ' || run || ' billed ' || billed, '; '), '') from (select * from badrun limit 3) x),
         'rounding a share down on every unit is how a building under-collects all year'
  union all select 16, 'accounting', 'the payables control ties to the unpaid bills',
         (select count(*) from badap),
         (select coalesce(string_agg(name || ' ledger ' || ledger_ap || ' vs open ' || open_ap, '; '), '') from (select * from badap limit 3) x),
         'the balance sheet and the payment run disagree about what you owe'
  union all select 17, 'accounting', 'the stock control account ties to the valuation',
         (select count(*) from badstock),
         (select coalesce(string_agg(name || ' ledger ' || ledger_stock || ' vs layers ' || layers, '; '), '') from (select * from badstock limit 3) x),
         'the balance sheet carries stock that is either not there or was never priced'
  union all select 18, 'currency', 'every foreign-currency entry has a rate',
         (select count(*) from norate),
         (select coalesce(string_agg(name || ' ' || entry_number || ' ' || currency_code || ' on ' || date, '; '), '') from (select * from norate limit 3) x),
         'with no rate the conversion is a silent 1:1, which never errors and is always wrong'
  union all select 19, 'currency', 'a tender converts to exactly what was billed',
         (select count(*) from badtender),
         (select coalesce(string_agg(number || ' ' || currency_code || ' ' || amount_ccy || ' x ' || fx_rate || ' <> ' || amount, '; '), '') from (select * from badtender limit 3) x),
         'the drawer count and the sales figure disagree, and only one is the money in the till'
  union all select 15, 'tenancy', 'no row points at a company that does not exist',
         (select coalesce(sum(n), 0) from orphans),
         (select coalesce(string_agg(t || ' ' || n, '; '), '') from orphans where n > 0),
         'an orphan is unreachable by any user and invisible to every report'
)
select ord, area, chk,
       case when bad = 0 then 'PASS' else 'FAIL' end as result,
       bad as breaking_rows,
       case when bad = 0 then '' else detail end as example,
       why
  from results
 order by (bad > 0) desc, ord;
