# Runs a .sql file against the Orbit database through the Supabase Management API.
#   powershell -NoProfile -ExecutionPolicy Bypass -File supabase\run-sql.ps1 supabase\210-odoo-spacework-import.sql
# The token lives in ~/.orbit_sb_token and is never printed. The file is sent as
# JSON, escaped by ConvertTo-Json, so comments, quotes and newlines all survive:
# flattening SQL by hand is what used to corrupt a statement.
#
# A file may be split into pieces with a line reading exactly "-- @chunk". Each
# piece is sent as its own statement, in order, and the run stops at the first
# failure. That exists because the API answers 400 with an EMPTY body to a very
# long statement (219, the imported quotation terms, is 166 KB), which looks
# exactly like a SQL error and is not one. Keep a chunk under about 100 KB.
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
$parts = [regex]::Split($sql, "\r?\n--\s@chunk\s*\r?\n") | Where-Object { $_.Trim() -ne "" }
Write-Host ("running " + (Split-Path $File -Leaf) + " (" + [math]::Round($sql.Length / 1024) + " KB" + $(if ($parts.Count -gt 1) { ", " + $parts.Count + " chunks" }) + ")")

$n = 0
foreach ($part in $parts) {
  $n++
  $body = @{ query = [string]$part } | ConvertTo-Json -Depth 3 -Compress
  try {
    $r = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" `
      -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 600
    if ($parts.Count -gt 1) {
      # name the chunk by its own first comment line, so a failure says which one
      $label = ($part -split "\r?\n" | Where-Object { $_ -match '^\s*--\s*\S' } | Select-Object -First 1)
      if ($label) { $label = ($label -replace '^\s*--\s*', '').Trim() } else { $label = "chunk $n" }
      if ($null -eq $r) { Write-Host ("  [$n/" + $parts.Count + "] " + $label) }
      else { Write-Host ("  [$n/" + $parts.Count + "] " + $label + " -> " + ($r | ConvertTo-Json -Depth 6 -Compress)) }
    } else {
      if ($null -eq $r) { Write-Host "ok (no rows returned)" } else { $r | ConvertTo-Json -Depth 6 -Compress | Write-Host }
    }
  } catch {
    $resp = $_.Exception.Response
    $detail = ""
    if ($resp) {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $detail = $sr.ReadToEnd()
      if (-not $detail) { $detail = "(empty body, status " + [int]$resp.StatusCode + " - usually means the statement is too long)" }
    } else { $detail = $_.Exception.Message }
    Write-Host ("FAILED on chunk $n of " + $parts.Count + ": " + $detail)
    exit 1
  }
}
