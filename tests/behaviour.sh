#!/usr/bin/env bash
# =============================================================================
# Run tests/behaviour.sql against a real Orbit database and print the result.
#
#   SUPABASE_PROJECT_REF=xxxx SUPABASE_PAT=sbp_... bash tests/behaviour.sh
#
# Read-only: it asserts invariants, it never writes. Safe against production,
# and meant to be run there, because the invariants are about real money.
#
# Exit code is the number of failing invariants, so it can gate a workflow.
# =============================================================================
set -uo pipefail

REF="${SUPABASE_PROJECT_REF:?set SUPABASE_PROJECT_REF}"
PAT="${SUPABASE_PAT:?set SUPABASE_PAT}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# behaviour.sql deliberately contains no double quote or backslash, so the JSON
# body needs nothing more than newlines turned into \n.
BODY=$(printf '{"query":"%s"}' "$(tr -d '\r' < "$DIR/behaviour.sql" | sed ':a;N;$!ba;s/\n/\\n/g')")

OUT=$(curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" -d "$BODY")

case "$OUT" in
  \[*) ;;
  *) echo "$OUT"; exit 99 ;;
esac

# One JSON object per line, then pull the fields out. No jq on the build box.
echo "$OUT" | tr '}' '\n' | while IFS= read -r row; do
  case "$row" in *'"chk"'*) ;; *) continue ;; esac
  res=$(printf '%s' "$row" | sed -n 's/.*"result":"\([A-Z]*\)".*/\1/p')
  area=$(printf '%s' "$row" | sed -n 's/.*"area":"\([^"]*\)".*/\1/p')
  chk=$(printf '%s' "$row" | sed -n 's/.*"chk":"\([^"]*\)".*/\1/p')
  n=$(printf '%s' "$row" | sed -n 's/.*"breaking_rows":"\{0,1\}\([0-9]*\).*/\1/p')
  ex=$(printf '%s' "$row" | sed -n 's/.*"example":"\([^"]*\)".*/\1/p')
  why=$(printf '%s' "$row" | sed -n 's/.*"why":"\([^"]*\)".*/\1/p')
  printf '%s  [%s] %s\n' "$res" "$area" "$chk"
  [ "$res" = "FAIL" ] && printf '      %s row(s) break it: %s\n      why it matters: %s\n' "$n" "$ex" "$why"
done

FAILS=$(printf '%s' "$OUT" | grep -o '"result":"FAIL"' | wc -l | tr -d ' ')
echo
if [ "$FAILS" -gt 0 ]; then echo "$FAILS invariant(s) FAILED"; else echo "all invariants hold"; fi
exit "$FAILS"
