-- ============================================================================
-- 155-algeco-chart-of-accounts.sql  -  ALGECO's real Lebanese chart.
--
-- Replaces the 51 generic accounts Orbit seeded with the 630-account chart
-- ALGECO actually keeps, exported from Visual Dolphin, plus 12 parent headings
-- the export never contained. 642 in total: 165 headings, 477 postable.
--
-- Reviewed before loading. Four things were fixed:
--   1. 42 names the export cut off at 49 characters, written out in full. Two
--      pairs (29/290 and 393/395) had been truncated to the SAME text and were
--      indistinguishable in a dropdown.
--   2. 12 parent codes missing from the file, including the class headings for
--      Fixed assets (2), Inventory (3) and Income (7).
--   3. Spelling: DIMINUATION on 22 accounts, plus FINANCILA, JOIMT, STATUTARY,
--      RESEACH, PERIOS, PROVISIOINS, ACCOUNS, LILABILITIES, Negatice, Bennin.
--   4. All 630 imported rather than a subset, because the bookkeeper's muscle
--      memory is worth more than a tidy list and an unused account costs
--      nothing.
--
-- Safe because nothing is posted: ALGECO has no journal lines and no invoices.
-- But 281 products, 4 journals and 2 taxes DO point at the old accounts, so
-- those references are remapped rather than orphaned.
--
-- Run 155a (this file) then 155b.
-- ============================================================================

-- Step 1: park the old codes so the new ones can be inserted without colliding
-- (the old 1010 "Owner drawings" and the new 1010 "CAPITAL" would clash).
update public.accounts
   set code = 'ZZ-' || code, is_active = false
 where company_id = 'a12b6b6c-e821-4b7e-8c64-2504c2c807e1'
   and code not like 'ZZ-%';
