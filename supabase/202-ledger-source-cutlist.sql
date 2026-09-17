-- 202: the cut list is an app too.
--
-- 200 mapped every kind of ledger entry to the apps that may write it, from the source
-- types the live ledger actually holds. The fabrication cut list writes entries with
-- source_type 'cutlist', which had not been posted yet in the pilot company, so it fell
-- to the default of accounting only and a fabrication role would have been refused.
-- Safe to re-run.

create or replace function public.je_source_apps(p_src text) returns text[]
  language sql immutable set search_path = public as $fn$
  select case lower(coalesce(nullif(btrim(p_src), ''), 'manual'))
    when 'manual'            then array['accounting']
    when 'depreciation'      then array['accounting','inventory']
    when 'fx_revaluation'    then array['accounting']
    when 'stock'             then array['accounting','inventory']
    when 'material_issue'    then array['accounting','inventory','projects','site','manufacturing']
    when 'cutlist'           then array['accounting','manufacturing','inventory','estimation','site','projects']
    when 'expense'           then array['accounting','employees']
    when 'payslip'           then array['accounting','employees']
    when 'retention'         then array['accounting','projects','site']
    when 'retention_release' then array['accounting','projects','site']
    when 'install_labour'    then array['accounting','installation','site','projects']
    when 'cash_movement'     then array['accounting','counter']
    when 'cash_void'         then array['accounting','counter']
    when 'cash_handover'     then array['accounting','counter']
    when 'advance'           then array['accounting','counter','sales']
    when 'invoice'           then array['accounting','sales','purchase','plot','events','appoint','service','projects','site']
    when 'payment'           then array['accounting','sales','purchase','counter','plot']
    else array['accounting']
  end
$fn$;
