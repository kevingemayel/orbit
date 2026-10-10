-- 211: take back the six payments that 210 added on top of money already in the books.
--
-- Space Work already held eight payments for these same invoices, entered by hand
-- with rounded dates ("Receipt INV/2025/00001", 15 Apr 2025, 2,000). They were
-- sitting unreconciled, so when 210 posted the Odoo invoices Orbit matched them,
-- and the payments 210 then registered were capped to whatever was left over.
-- The result was every invoice fully paid and 2,050 more cash than Odoo ever took.
--
-- This removes the six top-ups 210 created (and only those: they are named by their
-- Odoo reference), and puts each invoice back to the amount outstanding that Odoo
-- shows. The eight hand-entered payments and the genuinely new 1,500 receipt of
-- 7 Oct 2026 are left alone.
do $cleanup$
declare
  v_co uuid := '183e96d4-afd9-4ca4-b311-2e03e0c36ffb';   -- Space Work S.A.R.L
  r record; v_entry uuid; n_removed int := 0;
begin
  for r in
    select pm.id as pay_id, pm.entry_id, pm.reference, pm.amount
    from public.payments pm
    where pm.company_id = v_co
      and pm.reference in ('PCSH1/2025/00002','PWSH1/2025/00001','PCSH1/2025/00005',
                           'PWSH1/2025/00003','PCSH1/2025/00006','PWSH1/2026/00001')
  loop
    v_entry := r.entry_id;
    if v_entry is not null then
      -- a reconcile points at the lines, so it goes first
      delete from public.partial_reconciles
       where debit_line_id in (select id from public.journal_lines where entry_id = v_entry)
          or credit_line_id in (select id from public.journal_lines where entry_id = v_entry);
      -- lines cannot be touched while the entry is posted. The one way back to
      -- draft is the reopen path the Edit button uses, which the guard allows when
      -- orbit.reopen_entry names the entry; anything else it refuses, rightly.
      perform set_config('orbit.reopen_entry', v_entry::text, true);
      update public.journal_entries set state = 'draft' where id = v_entry;
      delete from public.journal_lines where entry_id = v_entry;
    end if;
    delete from public.payments where id = r.pay_id;
    if v_entry is not null then delete from public.journal_entries where id = v_entry; end if;
    n_removed := n_removed + 1;
  end loop;

  -- what Odoo says is still owed on each
  update public.invoices i set amount_residual = x.residual,
         payment_state = case when x.residual <= 0.005 then 'paid' else 'partial' end
  from (values
    ('INV/2025/00001', 500.0), ('INV/2025/00002',  50.0), ('INV/2025/00004', 250.0),
    ('INV/2025/00005', 250.0), ('INV/2025/00008', 500.0), ('INV/2025/00009', 500.0)
  ) as x(number, residual)
  where i.company_id = v_co and i.number = x.number;

  raise notice 'removed % duplicate payment(s)', n_removed;
end $cleanup$;

select i.number, i.amount_total, i.amount_residual, i.payment_state
from public.invoices i
where i.company_id = '183e96d4-afd9-4ca4-b311-2e03e0c36ffb'
  and i.number like 'INV/%' or i.number like 'BILL/%'
order by i.invoice_date;
