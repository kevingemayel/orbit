# Runs a .sql file against the Orbit database through the Supabase Management API.
#   powershell -NoProfile -ExecutionPolicy Bypass -File supabase\run-sql.ps1 supabase\210-odoo-spacework-import.sql
# The token lives in ~/.orbit_sb_token and is never printed. The file is sent as
# JSON, escaped by ConvertTo-Json, so comments, quotes and newlines all survive:
# flattening SQL by hand is what used to corrupt a statement.
param(
  [Parameter(Mandatory = $true)][string]$File,
  [string]$ProjectRef = "hlkwzbkgkwywomuvilwe",
  [string]$TokenFile = "$HOME\.orbit_sb_token"
)
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
if (-not (Test-Path $File)) { throw "no such file: $File" }
$token = ((Get-Content -LiteralPath $TokenFile -Raw) -replace '[^\x20-\x7E]', '').Trim()
if (-not $token) { throw "no token in $TokenFile" }
# ReadAllText, not Get-Content: Get-Content can hand back a wrapped object, and
# ConvertTo-Json then serialises the wrapper, which the API rejects with
# "query: Invalid input: expected string, received object".
$sql = [System.IO.File]::ReadAllText((Resolve-Path $File))
$body = @{ query = [string]$sql } | ConvertTo-Json -Depth 3 -Compress
Write-Host ("running " + (Split-Path $File -Leaf) + " (" + [math]::Round($sql.Length / 1024) + " KB)")
try {
  $r = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" `
    -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body -TimeoutSec 600
  if ($null -eq $r) { Write-Host "ok (no rows returned)" } else { $r | ConvertTo-Json -Depth 6 -Compress | Write-Host }
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
    Write-Host ("FAILED: " + $sr.ReadToEnd())
  } else { Write-Host ("FAILED: " + $_.Exception.Message) }
  exit 1
}
