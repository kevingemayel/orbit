# Serves the repo over http so the browser tests can fetch app.js, the help files
# and the screen smoke test. No dependencies: Windows' own HttpListener.
#   powershell -NoProfile -ExecutionPolicy Bypass -File tests\serve.ps1 [-Port 8871]
# then open http://127.0.0.1:8871/tests/browser.html
param([int]$Port = 8871, [string]$Root = (Split-Path (Split-Path $PSCommandPath -Parent) -Parent))
$ErrorActionPreference = "Stop"
$types = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "application/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"; ".json" = "application/json; charset=utf-8"
  ".svg" = "image/svg+xml"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".ico" = "image/x-icon"
  ".csv" = "text/csv; charset=utf-8"; ".sql" = "text/plain; charset=utf-8"; ".map" = "application/json"
  ".woff2" = "font/woff2"; ".webmanifest" = "application/manifest+json"
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Host "serving $Root on http://127.0.0.1:$Port/ (ctrl+c to stop)"
while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  try {
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    if ($rel -eq "") { $rel = "index.html" }
    $path = Join-Path $Root ($rel -replace "/", "\")
    if ((Test-Path $path) -and (Get-Item $path).PSIsContainer) { $path = Join-Path $path "index.html" }
    if (Test-Path $path) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $ctx.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("not found: $rel")
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch {} finally { try { $ctx.Response.Close() } catch {} }
}
