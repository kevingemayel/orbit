# =============================================================================
# Run tests/behaviour.sql against a real Orbit database and print the result.
#
#   pwsh tests/behaviour.ps1                       (token from ~/.orbit_sb_token)
#   pwsh tests/behaviour.ps1 -Ref abc -Pat sbp_... (explicit)
#
# Exit code is the number of failing invariants, so it can gate a workflow.
#
# Note: this builds the JSON body by hand. Windows PowerShell 5.1's
# ConvertTo-Json turns a long string into {"value":...,"Count":...}, which the
# API rejects as "expected string, received object". behaviour.sql deliberately
# contains no double quote or backslash so the escaping stays this simple.
# =============================================================================
param(
  [string]$Ref = "hlkwzbkgkwywomuvilwe",
  [string]$Pat = ""
)
$ErrorActionPreference = "Stop"
if (-not $Pat) {
  $tokenFile = Join-Path $env:USERPROFILE ".orbit_sb_token"
  if (-not (Test-Path $tokenFile)) { Write-Error "No PAT given and $tokenFile not found"; exit 99 }
  $Pat = (Get-Content $tokenFile -Raw).Trim()
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$sql = Get-Content (Join-Path $here "behaviour.sql") -Raw
if ($sql -match '"') { Write-Error "behaviour.sql must not contain a double quote"; exit 99 }
$esc = $sql.Replace('\', '\\').Replace("`r", "").Replace("`n", '\n').Replace("`t", '\t')
$tmp = Join-Path ([IO.Path]::GetTempPath()) "orbit-behaviour.json"
[IO.File]::WriteAllText($tmp, '{"query":"' + $esc + '"}', (New-Object Text.UTF8Encoding($false)))

$raw = & curl.exe -s -X POST "https://api.supabase.com/v1/projects/$Ref/database/query" `
  -H "Authorization: Bearer $Pat" -H "Content-Type: application/json" --data-binary "@$tmp"
Remove-Item $tmp -ErrorAction SilentlyContinue

try { $rows = $raw | ConvertFrom-Json } catch { Write-Output $raw; exit 99 }
if ($rows -isnot [array]) { Write-Output $raw; exit 99 }

$fails = 0
foreach ($r in $rows) {
  if ($r.result -eq "FAIL") { $fails++ }
  $tag = if ($r.result -eq "FAIL") { "FAIL" } else { "PASS" }
  Write-Output ("{0}  [{1}] {2}" -f $tag, $r.area, $r.chk)
  if ($r.result -eq "FAIL") {
    Write-Output ("      {0} row(s) break it: {1}" -f $r.breaking_rows, $r.example)
    Write-Output ("      why it matters: {0}" -f $r.why)
  }
}
Write-Output ""
if ($fails) { Write-Output "$fails of $($rows.Count) invariants FAILED" } else { Write-Output "all $($rows.Count) invariants hold" }
exit $fails
