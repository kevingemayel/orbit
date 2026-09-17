#!/usr/bin/env bash
# =============================================================================
# Orbit live audit: tenant isolation + data integrity, against a real project.
#
# This is NOT part of CI on push. It creates two throwaway tenants and two auth
# users in the target project, tries to break out of one into the other, then
# deletes everything. Run it deliberately.
#
#   SUPABASE_PROJECT_REF=xxxx \
#   SUPABASE_PAT=sbp_... \
#   PILOT_COMPANY_ID=<a real company uuid, read-only probes only> \
#   bash tests/live-audit.sh
#
# Exit code is the number of failures, so it can gate a workflow.
#
# Note on auth: the password grant is refused with captcha_failed because the
# project has hCaptcha enabled, so the session is minted through the admin
# magic-link path instead. The resulting JWT is an ordinary user session.
# =============================================================================
set -uo pipefail

REF="${SUPABASE_PROJECT_REF:?set SUPABASE_PROJECT_REF}"
PAT="${SUPABASE_PAT:?set SUPABASE_PAT}"
PILOT="${PILOT_COMPANY_ID:-}"
API="https://$REF.supabase.co"
MGMT="https://api.supabase.com/v1/projects/$REF"

OA=aaaa0000-0000-4000-8000-000000000001; OB=bbbb0000-0000-4000-8000-000000000002
CA=aaaa0000-0000-4000-8000-00000000000a; CB=bbbb0000-0000-4000-8000-00000000000b
PB=bbbb0000-0000-4000-8000-0000000000b1
EA=orbit-audit-a@example.com; EB=orbit-audit-b@example.com
# a third person: an admin of org A limited to company A, with a sibling
# company A2 in the same org that they were NOT given
CA2=aaaa0000-0000-4000-8000-00000000000c; CA3=aaaa0000-0000-4000-8000-00000000000d
PA2=aaaa0000-0000-4000-8000-0000000000a2; MA2=aaaa0000-0000-4000-8000-0000000000a3
EC=orbit-audit-c@example.com; FA2="$OA/partner/$PA2/audit.jpg"
# a fourth person: a sales representative in company A, on the real job template
ED=orbit-audit-d@example.com
# a ledger to try to write into, and two orders: one theirs, one a colleague's
JA=aaaa0000-0000-4000-8000-0000000000f1; BA=aaaa0000-0000-4000-8000-0000000000f2
SOD=aaaa0000-0000-4000-8000-0000000000f3; SOA=aaaa0000-0000-4000-8000-0000000000f4
# a posted invoice in company A, in the sibling A2 and in tenant B, for Edit
INVA=aaaa0000-0000-4000-8000-0000000000e1; INVA2=aaaa0000-0000-4000-8000-0000000000e2
INVB=bbbb0000-0000-4000-8000-0000000000e3
# one person known to both tenants by the same email: a customer in A, a guest in B
PAE=aaaa0000-0000-4000-8000-0000000000e6; EVB=bbbb0000-0000-4000-8000-0000000000e4; EGB=bbbb0000-0000-4000-8000-0000000000e5

pass=0; fail=0
sql() { curl -s -X POST "$MGMT/database/query" -H "Authorization: Bearer $PAT" \
        -H "Content-Type: application/json" -d "{\"query\":\"$1\"}"; }

keys=$(curl -s "$MGMT/api-keys?reveal=true" -H "Authorization: Bearer $PAT")
getkey() { printf '%s' "$keys" | tr '{' '\n' | while IFS= read -r l; do
    n=$(printf '%s' "$l" | sed -n 's/.*"name":"\([a-z_]*\)".*/\1/p')
    k=$(printf '%s' "$l" | sed -n 's/.*"api_key":"\([^"]*\)".*/\1/p')
    [ "$n" = "$1" ] && [ -n "$k" ] && printf '%s' "$k"
  done; }
ANON=$(getkey anon); SRV=$(getkey service_role)
[ -z "$ANON" ] || [ -z "$SRV" ] && { echo "could not read project API keys"; exit 1; }

teardown() {
  echo; echo "--- teardown ---"
  curl -s -X DELETE "$API/storage/v1/object/attachments/$FA2" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" >/dev/null
  sql "delete from public.media where id = '$MA2'" >/dev/null
  sql "delete from public.partners where company_id in ('$CA','$CB','$CA2')" >/dev/null
  sql "delete from public.org_members where org_id in ('$OA','$OB')" >/dev/null
  # a posted invoice refuses deletion, so the fixtures are cancelled first
  sql "update public.invoices set state='cancel' where company_id in ('$CA','$CB','$CA2')" >/dev/null
  sql "delete from public.event_guests where id = '$EGB'" >/dev/null
  sql "delete from public.event_events where id = '$EVB'" >/dev/null
  sql "delete from public.privacy_requests where company_id in ('$CA','$CB','$CA2')" >/dev/null
  sql "delete from public.journal_lines where company_id in ('$CA','$CB','$CA2')" >/dev/null
  sql "delete from public.journal_entries where company_id in ('$CA','$CB','$CA2')" >/dev/null
  sql "delete from public.sale_orders where company_id in ('$CA','$CB','$CA2')" >/dev/null
  sql "delete from public.companies where id in ('$CA','$CB','$CA2','$CA3')" >/dev/null
  sql "delete from public.orgs where id in ('$OA','$OB')" >/dev/null
  for e in "$EA" "$EB" "$EC" "$ED"; do
    uid=$(sql "select id from auth.users where email='$e'" | sed -n 's/.*"id":"\([0-9a-f-]*\)".*/\1/p')
    [ -n "$uid" ] && curl -s -X DELETE "$API/auth/v1/admin/users/$uid" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" >/dev/null
  done
  left=$(sql "select (select count(*) from public.orgs where id in ('$OA','$OB')) + (select count(*) from auth.users where email in ('$EA','$EB','$EC','$ED')) as n" | sed -n 's/.*"n":\([0-9]*\).*/\1/p')
  echo "leftover fixtures: ${left:-unknown}"
}
trap teardown EXIT

mkuser() { curl -s -X POST "$API/auth/v1/admin/users" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" \
  -H "Content-Type: application/json" -d "{\"email\":\"$1\",\"password\":\"$(openssl rand -hex 16)Aa1!\",\"email_confirm\":true}" \
  | sed -n 's/.*"id":"\([0-9a-f-]\{36\}\)".*/\1/p' | head -1; }

echo "--- setup ---"
UA=$(mkuser "$EA"); UB=$(mkuser "$EB")
[ -z "$UA" ] || [ -z "$UB" ] && { echo "could not create test users"; exit 1; }
sql "insert into public.orgs (id,name) values ('$OA','ORBITAUDIT A'),('$OB','ORBITAUDIT B') on conflict (id) do nothing" >/dev/null
sql "insert into public.companies (id,org_id,name,currency_code) values ('$CA','$OA','ORBITAUDIT Co A','USD'),('$CB','$OB','ORBITAUDIT Co B','USD') on conflict (id) do nothing" >/dev/null
sql "insert into public.org_members (org_id,user_id,role,status) values ('$OA','$UA','owner','active'),('$OB','$UB','owner','active')" >/dev/null
sql "insert into public.partners (id,org_id,company_id,name,is_customer) values ('$PB','$OB','$CB','ORBITAUDIT Secret B',true) on conflict (id) do nothing" >/dev/null

HT=$(curl -s -X POST "$API/auth/v1/admin/generate_link" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" \
     -H "Content-Type: application/json" -d "{\"type\":\"magiclink\",\"email\":\"$EA\"}" \
     | sed -n 's/.*"hashed_token":"\([^"]*\)".*/\1/p')
JWT=$(curl -s -X POST "$API/auth/v1/verify" -H "apikey: $ANON" -H "Content-Type: application/json" \
      -d "{\"type\":\"magiclink\",\"token_hash\":\"$HT\"}" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
[ -z "$JWT" ] && { echo "could not mint a session for tenant A"; exit 1; }
echo "signed in as tenant A"; echo
JWTA=$JWT

# the limited member: admin of org A, given company A only. Company A2 sits
# beside it in the same org with a customer, an attachment row and a real file.
UC=$(mkuser "$EC")
[ -z "$UC" ] && { echo "could not create the limited member"; exit 1; }
sql "insert into public.companies (id,org_id,name,currency_code) values ('$CA2','$OA','ORBITAUDIT Co A2','USD') on conflict (id) do nothing" >/dev/null
sql "insert into public.org_members (org_id,user_id,role,status,company_ids) values ('$OA','$UC','admin','active','{$CA}')" >/dev/null
sql "insert into public.partners (id,org_id,company_id,name,is_customer) values ('$PA2','$OA','$CA2','ORBITAUDIT Secret A2',true) on conflict (id) do nothing" >/dev/null
sql "insert into public.media (id,org_id,company_id,entity,entity_id,path,kind,mime) values ('$MA2','$OA','$CA2','partner','$PA2','$FA2','image','image/jpeg') on conflict (id) do nothing" >/dev/null
sql "insert into public.invoices (id,company_id,move_type,number,state,invoice_date,amount_untaxed,amount_tax,amount_total,amount_residual) values ('$INVA','$CA','out_invoice','AUDIT/A/1','posted',current_date,10,0,10,10),('$INVA2','$CA2','out_invoice','AUDIT/A2/1','posted',current_date,10,0,10,10),('$INVB','$CB','out_invoice','AUDIT/B/1','posted',current_date,10,0,10,10) on conflict (id) do nothing" >/dev/null
sql "insert into public.partners (id,org_id,company_id,name,email,is_customer) values ('$PAE','$OA','$CA','ORBITAUDIT Shared Person','shared-person@example.com',true) on conflict (id) do nothing" >/dev/null
sql "insert into public.event_events (id,org_id,company_id,name) values ('$EVB','$OB','$CB','ORBITAUDIT Event B') on conflict (id) do nothing" >/dev/null
sql "insert into public.event_guests (id,org_id,event_id,first_name,email) values ('$EGB','$OB','$EVB','ORBITAUDIT Guest B','shared-person@example.com') on conflict (id) do nothing" >/dev/null
printf 'not really a jpeg' | curl -s -X POST "$API/storage/v1/object/attachments/$FA2" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" -H "Content-Type: image/jpeg" --data-binary @- >/dev/null
HTC=$(curl -s -X POST "$API/auth/v1/admin/generate_link" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" \
     -H "Content-Type: application/json" -d "{\"type\":\"magiclink\",\"email\":\"$EC\"}" \
     | sed -n 's/.*"hashed_token":"\([^"]*\)".*/\1/p')
JWTC=$(curl -s -X POST "$API/auth/v1/verify" -H "apikey: $ANON" -H "Content-Type: application/json" \
      -d "{\"type\":\"magiclink\",\"token_hash\":\"$HTC\"}" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
[ -z "$JWTC" ] && { echo "could not mint a session for the limited member"; exit 1; }

# the sales representative: a member of org A on the sales_representative template, not an admin
UD=$(mkuser "$ED")
[ -z "$UD" ] && { echo "could not create the sales representative"; exit 1; }
sql "insert into public.org_members (org_id,user_id,role,status) values ('$OA','$UD','sales_representative','active')" >/dev/null
# contacts are read through the person's active company, as the app sets it on sign-in
sql "insert into public.profiles (id, active_company_id) values ('$UD','$CA') on conflict (id) do update set active_company_id = excluded.active_company_id" >/dev/null
# a journal, a book and two sales orders, so "an entry belongs to an app" and "own
# records" can be probed by trying them rather than asserted from the schema
sql "insert into public.journals (id,company_id,code,name) values ('$JA','$CA','MISC','ORBITAUDIT Misc') on conflict (id) do nothing" >/dev/null
sql "insert into public.books (id,company_id,name,is_default,is_primary) values ('$BA','$CA','ORBITAUDIT Book',true,true) on conflict (id) do nothing" >/dev/null
sql "insert into public.sale_orders (id,company_id,number,state,date_order,user_id) values ('$SOD','$CA','AUDIT/SO/D','draft',current_date,'$UD'),('$SOA','$CA','AUDIT/SO/A','draft',current_date,'$UA') on conflict (id) do nothing" >/dev/null
HTD=$(curl -s -X POST "$API/auth/v1/admin/generate_link" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" \
     -H "Content-Type: application/json" -d "{\"type\":\"magiclink\",\"email\":\"$ED\"}" \
     | sed -n 's/.*"hashed_token":"\([^"]*\)".*/\1/p')
JWTD=$(curl -s -X POST "$API/auth/v1/verify" -H "apikey: $ANON" -H "Content-Type: application/json" \
      -d "{\"type\":\"magiclink\",\"token_hash\":\"$HTD\"}" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
[ -z "$JWTD" ] && { echo "could not mint a session for the sales representative"; exit 1; }
# can this session get a link to a file? (the storage rule, not the REST one)
sign() { curl -s -X POST "$API/storage/v1/object/sign/attachments/$1" -H "apikey: $ANON" -H "Authorization: Bearer $2" \
         -H "Content-Type: application/json" -d '{"expiresIn":60}' | grep -c '"signedURL"'; }

probe() { # label expect(deny|allow) method path [body]
  local label="$1" expect="$2" method="$3" p="$4" body="${5:-}" out code payload reached=no
  if [ -n "$body" ]; then
    out=$(curl -s -w '\n%{http_code}' -X "$method" "$API/rest/v1/$p" -H "apikey: $ANON" -H "Authorization: Bearer $JWT" \
          -H "Content-Type: application/json" -H "Prefer: return=representation" -d "$body")
  else
    out=$(curl -s -w '\n%{http_code}' -X "$method" "$API/rest/v1/$p" -H "apikey: $ANON" -H "Authorization: Bearer $JWT" -H "Prefer: return=representation")
  fi
  code=$(printf '%s' "$out" | tail -1); payload=$(printf '%s' "$out" | sed '$d')
  case "$code" in 2*) [ "$payload" != "[]" ] && [ -n "$payload" ] && reached=yes ;; esac
  if { [ "$expect" = deny ] && [ "$reached" = no ]; } || { [ "$expect" = allow ] && [ "$reached" = yes ]; }
  then printf '  PASS  %s\n' "$label"; pass=$((pass+1))
  else printf '  FAIL  %s (http %s)\n        %.200s\n' "$label" "$code" "$payload"; fail=$((fail+1)); fi
}

echo "control"
probe "tenant A reads its own company" allow GET "companies?id=eq.$CA&select=id,name"
echo "reading another tenant"
probe "company B"            deny GET "companies?id=eq.$CB&select=id,name"
probe "B's customers"        deny GET "partners?company_id=eq.$CB&select=id,name"
probe "B's invoices"         deny GET "invoices?company_id=eq.$CB&select=id"
probe "B's journal entries"  deny GET "journal_entries?company_id=eq.$CB&select=id"
probe "B's org membership"   deny GET "org_members?org_id=eq.$OB&select=user_id,role"
if [ -n "$PILOT" ]; then
  echo "reading the real pilot company (read-only)"
  probe "pilot company row"  deny GET "companies?id=eq.$PILOT&select=id,name"
  probe "pilot partners"     deny GET "partners?company_id=eq.$PILOT&select=id,name"
  probe "pilot invoices"     deny GET "invoices?company_id=eq.$PILOT&select=id,amount_total"
  probe "pilot product costs" deny GET "products?company_id=eq.$PILOT&select=id,cost_price"
  probe "pilot employees"    deny GET "hr_employees?company_id=eq.$PILOT&select=id,name"
fi
echo "writing into another tenant"
probe "insert partner into B" deny POST "partners" "{\"org_id\":\"$OB\",\"company_id\":\"$CB\",\"name\":\"INJECTED\"}"
probe "rename B's customer"   deny PATCH "partners?id=eq.$PB" '{"name":"OWNED"}'
probe "delete B's customer"   deny DELETE "partners?id=eq.$PB"
probe "rename company B"      deny PATCH "companies?id=eq.$CB" '{"name":"OWNED"}'
echo "privilege escalation"
probe "self -> platform admin" deny POST "platform_admins" "{\"user_id\":\"$UA\",\"can_write\":true}"
probe "read platform_admins"   deny GET  "platform_admins?select=user_id"
probe "self -> org B member"   deny POST "org_members" "{\"org_id\":\"$OB\",\"user_id\":\"$UA\",\"role\":\"owner\",\"status\":\"active\"}"
probe "self -> company B access" deny POST "user_company_access" "{\"user_id\":\"$UA\",\"company_id\":\"$CB\",\"role\":\"full_access\"}"
probe "move own company to org B" deny PATCH "companies?id=eq.$CA" "{\"org_id\":\"$OB\"}"
echo "secrets and platform tables"
for t in api_keys app_secrets webhook_endpoints portal_access visits leads; do
  probe "read $t" deny GET "$t?select=*&limit=3"
done

echo
echo "a member given one company, in an org that has two"
JWT=$JWTC
probe "reads the company they were given"          allow GET "companies?id=eq.$CA&select=id,name"
probe "sees the sibling company"                    deny  GET "companies?id=eq.$CA2&select=id,name"
probe "renames the sibling company"                 deny  PATCH "companies?id=eq.$CA2" '{"name":"OWNED"}'
probe "creates a company in the org"                deny  POST "companies" "{\"id\":\"$CA3\",\"org_id\":\"$OA\",\"name\":\"INJECTED\",\"currency_code\":\"USD\"}"
probe "widens their own access"                     deny  PATCH "org_members?org_id=eq.$OA&user_id=eq.$UC" '{"company_ids":null}'
probe "reads the other members of the org"          deny  GET "org_members?org_id=eq.$OA&user_id=neq.$UC&select=user_id,role"
probe "lists the sibling company's customers"       deny  GET "partners?company_id=eq.$CA2&select=id,name"
probe "reads the sibling company's attachment rows" deny  GET "media?company_id=eq.$CA2&select=id,path"
# pointing their own profile at the sibling used to widen the partner scope
sql "insert into public.profiles (id, active_company_id) values ('$UC','$CA2') on conflict (id) do update set active_company_id = excluded.active_company_id" >/dev/null
probe "points their profile at the sibling and reads its customers" deny GET "partners?company_id=eq.$CA2&select=id,name"
if [ "$(sign "$FA2" "$JWTC")" = "0" ]; then printf '  PASS  %s\n' "gets a link to the sibling company's file"; pass=$((pass+1)); else printf '  FAIL  %s\n' "gets a link to the sibling company's file"; fail=$((fail+1)); fi
if [ "$(sign "$FA2" "$JWTA")" = "1" ]; then printf '  PASS  %s\n' "the org owner still gets a link to that file"; pass=$((pass+1)); else printf '  FAIL  %s\n' "the org owner still gets a link to that file"; fail=$((fail+1)); fi
JWT=$JWTA

echo
echo "a sales representative in company A (a job role, not an admin)"
JWT=$JWTD
probe "reads company A"                              allow GET  "companies?id=eq.$CA&select=id,name"
probe "adds a customer, which the role allows"       allow POST "partners" "{\"org_id\":\"$OA\",\"company_id\":\"$CA\",\"name\":\"ORBITAUDIT Rep customer\",\"is_customer\":true}"
probe "changes document numbering"                   deny  POST "number_sequences" "{\"company_id\":\"$CA\",\"doc_type\":\"AUDIT\",\"prefix\":\"AUD\"}"
probe "takes the company's whole backup"             deny  POST "rpc/backup_build" "{\"p_company\":\"$CA\"}"
# a list that is allowed can come back empty, which probe() reads as refused, so these check the status
rpc_code() { curl -s -o /dev/null -w '%{http_code}' -X POST "$API/rest/v1/rpc/$1" -H "apikey: $ANON" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d "$2"; }
code_is() { # label actual-http-code expected-first-digit
  case "$2" in "$3"*) printf '  PASS  %s\n' "$1"; pass=$((pass+1)) ;; *) printf '  FAIL  %s (http %s)\n' "$1" "$2"; fail=$((fail+1)) ;; esac; }
code_is "lists the API keys"                   "$(rpc_code api_key_list "{\"p_company\":\"$CA\"}")" 4
code_is "lists the webhooks and their secrets" "$(rpc_code webhook_list "{\"p_company\":\"$CA\"}")" 4
probe "exports a person's data"                      deny  POST "rpc/gdpr_export" "{\"p_company\":\"$CA\",\"p_kind\":\"partner\",\"p_id\":\"$PAE\"}"
probe "writes a manual journal voucher"              deny  POST "journal_entries" "{\"company_id\":\"$CA\",\"journal_id\":\"$JA\",\"book_id\":\"$BA\",\"date\":\"$(date +%F)\",\"currency_code\":\"USD\",\"state\":\"draft\",\"narration\":\"ORBITAUDIT manual\"}"
probe "writes a payroll entry"                       deny  POST "journal_entries" "{\"company_id\":\"$CA\",\"journal_id\":\"$JA\",\"book_id\":\"$BA\",\"date\":\"$(date +%F)\",\"currency_code\":\"USD\",\"state\":\"draft\",\"source_type\":\"payslip\",\"narration\":\"ORBITAUDIT payslip\"}"
probe "reads the order that is theirs"               allow GET  "sale_orders?id=eq.$SOD&select=id,number"
probe "reads a colleague's order"                    deny  GET  "sale_orders?id=eq.$SOA&select=id,number"
JWT=$JWTA
code_is "the owner still lists the API keys"   "$(rpc_code api_key_list "{\"p_company\":\"$CA\"}")" 2
code_is "the owner still lists the webhooks"   "$(rpc_code webhook_list "{\"p_company\":\"$CA\"}")" 2

echo
echo "structural invariants (read-only, whole database)"
inv() { # label  sql-returning-a-count-named-n  expected
  local n; n=$(sql "$2" | sed -n 's/.*"n":\([0-9]*\).*/\1/p')
  if [ "$n" = "$3" ]; then printf '  PASS  %s\n' "$1"; pass=$((pass+1))
  else printf '  FAIL  %s (got %s, expected %s)\n' "$1" "${n:-error}" "$3"; fail=$((fail+1)); fi
}
inv "every public table has RLS enabled" \
    "select count(*) as n from pg_class c join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relkind='r' and c.relrowsecurity=false" 0
inv "the limited member's access is unchanged after their attempt to widen it" \
    "select count(*) as n from public.org_members where user_id='$UC' and org_id='$OA' and company_ids = '{$CA}'" 1
inv "no org-admin rule ignores a member's company limit" \
    "select count(*) as n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname in ('is_org_admin','can_manage_team','backup_target_org') and pg_get_functiondef(p.oid) !~ 'company_ids'" 0
inv "every SECURITY DEFINER function pins search_path" \
    "select count(*) as n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.prosecdef and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) x where x like 'search_path=%'))" 0
inv "no RLS policy is unconditionally true" \
    "select count(*) as n from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relname not in ('site_content') and pg_get_expr(p.polqual,p.polrelid)='true'" 0
inv "platform_admins is not writable through the API" \
    "select count(*) as n from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname='platform_admins' and p.polcmd <> 'r'" 0
inv "no company-wide admin function lets in any member who can write" \
    "select count(*) as n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.prosecdef and p.proname in ('backup_build','backup_log','backup_discard_restored','backup_fix_media_path','api_key_create','api_key_list','api_key_revoke','webhook_create','webhook_list','webhook_delete','gdpr_export','gdpr_erase','delete_company_empty','setup_company','reopen_journal_entry','fx_revalue','reconcile_bank_line','apply_catalog_markup','reopen_invoice') and position('can_write_company(' in pg_get_functiondef(p.oid)) > 0" 0
inv "a calendar feed carries only its owner's appointments" \
    "select count(*) as n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname='calendar_feed_events' and pg_get_functiondef(p.oid) ~ 'staff_id'" 1
inv "every journal entry belongs to a book" \
    "select count(*) as n from public.journal_entries where book_id is null" 0
inv "every company has a primary book" \
    "select count(*) as n from public.companies c where not exists (select 1 from public.books b where b.company_id=c.id and b.is_primary)" 0
inv "every posted journal entry balances" \
    "select count(*) as n from (select l.entry_id from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.state='posted' group by l.entry_id having round(sum(l.debit)::numeric,2) <> round(sum(l.credit)::numeric,2)) s" 0

echo
echo "editing posted documents"
inv "the posted invoices to probe exist" \
    "select count(*) as n from public.invoices where id in ('$INVA','$INVA2','$INVB') and state='posted'" 3
JWT=$JWTA
probe "sets its own posted invoice back to draft directly"        deny  PATCH "invoices?id=eq.$INVA" '{"state":"draft"}'
probe "reopens another tenant's posted invoice"                   deny  POST  "rpc/reopen_invoice" "{\"p_invoice\":\"$INVB\"}"
probe "reopens its own posted invoice with Edit"                  allow POST  "rpc/reopen_invoice" "{\"p_invoice\":\"$INVA\"}"
JWT=$JWTC
probe "the limited member reopens the sibling company's invoice"  deny  POST  "rpc/reopen_invoice" "{\"p_invoice\":\"$INVA2\"}"
JWT=$ANON
probe "an anonymous caller reopens a posted invoice"              deny  POST  "rpc/reopen_invoice" "{\"p_invoice\":\"$INVA2\"}"
JWT=$JWTA
inv "the refused attempts left both invoices posted" \
    "select count(*) as n from public.invoices where id in ('$INVA2','$INVB') and state='posted'" 2
inv "the allowed edit kept the posted version" \
    "select count(*) as n from public.document_revisions where doc_type='invoice' and doc_id='$INVA'" 1

echo
echo "backups and privacy requests"
JWT=$ANON
probe "an anonymous caller downloads company A's backup"          deny  POST  "rpc/backup_build" "{\"p_company\":\"$CA\"}"
JWT=$JWTA
probe "tenant A downloads tenant B's backup"                      deny  POST  "rpc/backup_build" "{\"p_company\":\"$CB\"}"
probe "tenant A downloads its own backup"                         allow POST  "rpc/backup_build" "{\"p_company\":\"$CA\"}"
JWT=$JWTC
probe "the limited member downloads the sibling company's backup" deny  POST  "rpc/backup_build" "{\"p_company\":\"$CA2\"}"
JWT=$JWTA
inv "the shared-email fixtures exist" \
    "select count(*) as n from public.event_guests where id='$EGB' and email='shared-person@example.com'" 1
px=$(curl -s -X POST "$API/rest/v1/rpc/gdpr_export" -H "apikey: $ANON" -H "Authorization: Bearer $JWTA" -H "Content-Type: application/json" \
     -d "{\"p_company\":\"$CA\",\"p_kind\":\"partner\",\"p_id\":\"$PAE\"}")
if printf '%s' "$px" | grep -q 'ORBITAUDIT Shared Person' && ! printf '%s' "$px" | grep -q "$EGB"
then printf '  PASS  %s\n' "A's data export holds A's customer and not B's guest with the same email"; pass=$((pass+1))
else printf '  FAIL  %s\n        %.200s\n' "A's data export holds A's customer and not B's guest with the same email" "$px"; fail=$((fail+1)); fi
curl -s -X POST "$API/rest/v1/rpc/gdpr_erase" -H "apikey: $ANON" -H "Authorization: Bearer $JWTA" -H "Content-Type: application/json" \
     -d "{\"p_company\":\"$CA\",\"p_kind\":\"partner\",\"p_id\":\"$PAE\"}" >/dev/null
inv "erasing the person in A leaves B's guest untouched" \
    "select count(*) as n from public.event_guests where id='$EGB' and email='shared-person@example.com'" 1
inv "erasing the person in A did erase A's customer" \
    "select count(*) as n from public.partners where id='$PAE' and email is null and name like 'Erased %'" 1

echo
echo "=================================="
echo "  passed: $pass   FAILED: $fail"
echo "=================================="
exit $fail
