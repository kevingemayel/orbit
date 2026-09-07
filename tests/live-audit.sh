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
  sql "delete from public.partners where company_id in ('$CA','$CB')" >/dev/null
  sql "delete from public.org_members where org_id in ('$OA','$OB')" >/dev/null
  sql "delete from public.companies where id in ('$CA','$CB')" >/dev/null
  sql "delete from public.orgs where id in ('$OA','$OB')" >/dev/null
  for e in "$EA" "$EB"; do
    uid=$(sql "select id from auth.users where email='$e'" | sed -n 's/.*"id":"\([0-9a-f-]*\)".*/\1/p')
    [ -n "$uid" ] && curl -s -X DELETE "$API/auth/v1/admin/users/$uid" -H "apikey: $SRV" -H "Authorization: Bearer $SRV" >/dev/null
  done
  left=$(sql "select (select count(*) from public.orgs where id in ('$OA','$OB')) + (select count(*) from auth.users where email in ('$EA','$EB')) as n" | sed -n 's/.*"n":\([0-9]*\).*/\1/p')
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
echo "structural invariants (read-only, whole database)"
inv() { # label  sql-returning-a-count-named-n  expected
  local n; n=$(sql "$2" | sed -n 's/.*"n":\([0-9]*\).*/\1/p')
  if [ "$n" = "$3" ]; then printf '  PASS  %s\n' "$1"; pass=$((pass+1))
  else printf '  FAIL  %s (got %s, expected %s)\n' "$1" "${n:-error}" "$3"; fail=$((fail+1)); fi
}
inv "every public table has RLS enabled" \
    "select count(*) as n from pg_class c join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relkind='r' and c.relrowsecurity=false" 0
inv "every SECURITY DEFINER function pins search_path" \
    "select count(*) as n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.prosecdef and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) x where x like 'search_path=%'))" 0
inv "no RLS policy is unconditionally true" \
    "select count(*) as n from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relname not in ('site_content') and pg_get_expr(p.polqual,p.polrelid)='true'" 0
inv "platform_admins is not writable through the API" \
    "select count(*) as n from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname='platform_admins' and p.polcmd <> 'r'" 0
inv "every posted journal entry balances" \
    "select count(*) as n from (select l.entry_id from public.journal_lines l join public.journal_entries e on e.id=l.entry_id where e.state='posted' group by l.entry_id having round(sum(l.debit)::numeric,2) <> round(sum(l.credit)::numeric,2)) s" 0

echo
echo "=================================="
echo "  passed: $pass   FAILED: $fail"
echo "=================================="
exit $fail
