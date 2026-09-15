-- 194: the functions that act for the whole company ask for the right level of the right app.
--
-- Nineteen functions run with the database's own rights, so row rules do not reach inside them,
-- and each let a caller in with one question: can_write_company. Until 190 that meant owner,
-- admin or accountant. Since 190 it means any active member whose role can write somewhere,
-- which is the right question for "is this person staff" and the wrong one for these: it let a
-- sales representative download the company's whole backup (salaries and bank details included),
-- export or erase a person's data, read the API keys and webhook secrets, and reopen posted
-- vouchers. Each now asks what its job needs:
--   Settings, Manage   backups, restore clean-up, API keys, webhooks, privacy export and erase,
--                      setting up and deleting a company
--   Accounting, Work   reopening a posted voucher, currency revaluation, bank reconciliation
--   Products, Manage   repricing the whole catalogue
--   an invoicing app   reopening a posted invoice or bill (the apps that issue them)
-- Owners and full-access roles pass every one, as before. Posting itself (post_entry,
-- post_invoice, register_payment) still admits any writer, because a cashier, a till and a
-- property manager all post; that limit is recorded in the roles model.
--
-- Only the single gate call in each live definition is rewritten, so nothing else in a function
-- can drift. The block refuses to change a function where the call is not found exactly once.
-- Safe to re-run: a function already rewritten no longer contains the call and is skipped.

do $mig$
declare
  m record; def text; newdef text; n int;
begin
  for m in
    select * from (values
      ('api_key_create',          'settings',  'M', null::text, null::text),
      ('api_key_list',            'settings',  'M', null, null),
      ('api_key_revoke',          'settings',  'M', null, null),
      ('backup_build',            'settings',  'M', 'Only an owner, administrator or accountant of this company can take its backup.', 'Taking a backup of this company needs Manage in Settings on your role.'),
      ('backup_discard_restored', 'settings',  'M', null, null),
      ('backup_fix_media_path',   'settings',  'M', null, null),
      ('backup_log',              'settings',  'M', null, null),
      ('delete_company_empty',    'settings',  'M', null, null),
      ('gdpr_erase',              'settings',  'M', null, null),
      ('gdpr_export',             'settings',  'M', null, null),
      ('setup_company',           'settings',  'M', null, null),
      ('webhook_create',          'settings',  'M', null, null),
      ('webhook_delete',          'settings',  'M', null, null),
      ('webhook_list',            'settings',  'M', null, null),
      ('fx_revalue',              'accounting','W', null, null),
      ('reconcile_bank_line',     'accounting','W', null, null),
      ('reopen_journal_entry',    'accounting','W', 'Only an owner, administrator or accountant of this company can edit a posted entry.', 'Editing a posted entry needs Work in Accounting on your role.'),
      ('apply_catalog_markup',    'inventory,sales,purchase', 'M', null, null),
      ('reopen_invoice',          'accounting,sales,purchase,plot,projects,site,events,service,appoint', 'W', 'Only an owner, administrator or accountant of this company can edit a posted %.', 'Your role cannot edit this posted %. It needs Work in Accounting or in the app that issued it.')
    ) as t(fn, apps, lvl, old_msg, new_msg)
  loop
    select pg_get_functiondef(p.oid) into def
      from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = m.fn and p.prokind = 'f';
    if def is null then raise exception '194: function % not found', m.fn; end if;

    n := (length(def) - length(replace(def, 'public.can_write_company(', ''))) / length('public.can_write_company(');
    if n = 0 then
      raise notice '194: % already rewritten, skipped', m.fn;
      continue;
    end if;
    if n <> 1 then raise exception '194: % has % gate calls, expected 1', m.fn, n; end if;

    newdef := regexp_replace(def,
      'public\.can_write_company\(([^()]*)\)',
      'public.' || case m.lvl when 'M' then 'can_manage_app' else 'can_write_app' end
        || '(\1, ''{' || m.apps || '}''::text[])');
    if newdef = def then raise exception '194: % gate call did not match', m.fn; end if;

    if m.old_msg is not null then
      if position(m.old_msg in newdef) = 0 then raise exception '194: % message not found', m.fn; end if;
      newdef := replace(newdef, m.old_msg, m.new_msg);
    end if;

    execute newdef;
  end loop;
end $mig$;

-- the backup log and who-can-see-which-company follow the same rule
alter policy backups_r on public.backups
  using (public.can_manage_app(company_id, '{settings}'::text[]));
alter policy uca_r on public.user_company_access
  using ((user_id = auth.uid()) or public.can_manage_app(company_id, '{settings}'::text[]));
