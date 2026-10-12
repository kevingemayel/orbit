# Which tables can nothing in the product reach?
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tests\dead-schema.ps1
#
# Read-only. It needs the Management API token in ~\.orbit_sb_token, the same
# one supabase\run-sql.ps1 uses, and prints nothing secret.
#
# Why this exists. A table with rows in it that no screen can show and nothing
# can write is the most expensive kind of gap, because it looks finished from
# the inside: the schema is there, the help page describes it, and a demo never
# touches it. Asking the question as evidence rather than memory found 36 such
# tables on 11 October 2026 and drove the work that closed every one that had a
# row in it: 15 are left and all of them are empty, bar two rows of site_content
# left over from the old spacework.ai site editor.
#
# How it answers. Every table in public is checked against:
#   - js/app.js, for the table name in quotes (how the client names a table)
#   - every function body and view definition in the database
#   - the Cloudflare functions and the website worker
# A table none of them mention is unreachable by anything in the product. The
# second list, "the app cannot reach it but SQL/edge does", is the normal shape
# for a table only a posting function or the edge touches, and is not a gap.
#
# Run it after any build that was supposed to close one, and before claiming a
# module is finished.
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path (Split-Path $PSCommandPath -Parent) -Parent
$tokenFile = "$HOME\.orbit_sb_token"
if (-not (Test-Path $tokenFile)) { throw "no token in $tokenFile" }
$token = ((Get-Content -LiteralPath $tokenFile -Raw) -replace '[^\x20-\x7E]', '').Trim()
function Q([string]$sql) {
  $body = @{ query = $sql } | ConvertTo-Json -Compress
  Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/hlkwzbkgkwywomuvilwe/database/query" -Method Post `
    -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 300
}

$tables = Q @"
select t.table_name, coalesce((select n_live_tup from pg_stat_user_tables s where s.relname = t.table_name), 0) as rows
from information_schema.tables t where t.table_schema='public' and t.table_type='BASE TABLE' order by t.table_name
"@
# every function body and view definition in one blob, so one pass finds them all
$sqlBlob = (Q "select string_agg(prosrc, ' ') as src from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'")[0].src
$viewBlob = (Q "select coalesce(string_agg(definition, ' '), '') as src from pg_views where schemaname='public'")[0].src

$app  = [System.IO.File]::ReadAllText((Join-Path $root "js\app.js"))
$edge = (Get-ChildItem (Join-Path $root "functions"), (Join-Path $root "worker") -Recurse -Include *.js,*.ts -ErrorAction SilentlyContinue |
         ForEach-Object { [System.IO.File]::ReadAllText($_.FullName) }) -join "`n"

$rows = @()
foreach ($row in $tables) {
  $t = $row.table_name
  if ($t -like '_%') { continue }
  if ($app.Contains('"' + $t + '"') -or $app.Contains("'" + $t + "'") -or $app.Contains("$t(")) { continue }
  $rows += [pscustomobject]@{
    table = $t; rows = [int]$row.rows
    sql   = $sqlBlob  -match ("[^a-z_]" + [regex]::Escape($t) + "[^a-z_]")
    view  = $viewBlob -match ("[^a-z_]" + [regex]::Escape($t) + "[^a-z_]")
    edge  = $edge.Contains($t)
  }
}
$orphan = $rows | Where-Object { -not $_.sql -and -not $_.view -and -not $_.edge }
Write-Host ("no app code: " + $rows.Count + "    of those, nothing anywhere else either: " + $orphan.Count)
Write-Host "--- unreachable by anything (the gap list, worst first) ---"
$orphan | Sort-Object -Property @{Expression='rows';Descending=$true}, table | ForEach-Object { Write-Host ("  {0,-34} {1}" -f $_.table, $_.rows) }
Write-Host "--- the app cannot reach it, but SQL or the edge does (normal) ---"
($rows | Where-Object { $_.sql -or $_.view -or $_.edge } | Sort-Object table) | ForEach-Object { Write-Host ("  {0,-34} rows={1,-6} sql={2} view={3} edge={4}" -f $_.table, $_.rows, $_.sql, $_.view, $_.edge) }
