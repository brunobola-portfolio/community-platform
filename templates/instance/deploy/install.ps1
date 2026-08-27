<#
.SYNOPSIS
  Installs a Community Platform zip on an IIS site with backup, smoke test and automatic
  rollback. Runs ON THE SERVER (by the runner or by hand).

.PARAMETER Zip          Zip path (index.html at the root). Defaults to the newest in ..\dist.
.PARAMETER SitePath     IIS site folder (Physical Path).
.PARAMETER SiteUrl      Public URL for the smoke test.
.PARAMETER KeepBackups  How many backups to keep under C:\inetpub\backups.

.EXAMPLE
  .\install.ps1 -Zip C:\Temp\community-platform-dist.zip -SiteUrl https://www.example.org/
#>
[CmdletBinding()]
param(
  [string] $Zip,
  [string] $SitePath = 'C:\inetpub\wwwroot',
  [string] $SiteUrl = 'https://www.example.org/',
  [int]    $KeepBackups = 5
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

if (-not $Zip) {
  $Zip = Get-ChildItem (Join-Path $root 'dist\*.zip') -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
  if (-not $Zip) { throw 'No zip in dist\. Run apply.ps1 first or pass -Zip.' }
}
if (-not (Test-Path $SitePath)) { throw "Site folder does not exist: $SitePath" }

$stamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
$staging = Join-Path $env:TEMP "cp-deploy-$stamp"
$backupRoot = 'C:\inetpub\backups'
$backup = Join-Path $backupRoot "site-$stamp"

Write-Host "`n  Zip:   $Zip" -ForegroundColor Cyan
Write-Host "  Site:  $SitePath"

# 1. Validate the package before touching production
Write-Host "  [1/5] Validating the package ..."
Expand-Archive -Path $Zip -DestinationPath $staging -Force
foreach ($required in 'index.html', 'web.config', 'assets') {
  if (-not (Test-Path (Join-Path $staging $required))) { throw "Invalid zip: $required missing at the root." }
}
$html = Get-Content (Join-Path $staging 'index.html') -Raw
if ($html -match '%VITE_[A-Z0-9_]+%') { throw 'index.html still has %VITE_*% placeholders (built without .env.production).' }

# 2. Backup of the current site (rollback in seconds)
Write-Host "  [2/5] Backup -> $backup"
New-Item -ItemType Directory -Force $backupRoot | Out-Null
robocopy $SitePath $backup /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Backup failed (robocopy exit $LASTEXITCODE)" }

# 3. Swap the content. /MIR removes what is no longer part of the build while
#    preserving .well-known (ACME / Let's Encrypt challenges)
Write-Host "  [3/5] Installing ..."
robocopy $staging $SitePath /MIR /XD '.well-known' /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Install failed (robocopy exit $LASTEXITCODE)" }
Remove-Item $staging -Recurse -Force

# 4. Smoke test: the page answers and is the platform build
Write-Host "  [4/5] Smoke test $SiteUrl"
Start-Sleep -Seconds 2
$ok = $false
try {
  $resp = Invoke-WebRequest -Uri $SiteUrl -UseBasicParsing -TimeoutSec 30
  $ok = ($resp.StatusCode -eq 200) -and ($resp.Content -match '<title>') -and ($resp.Content -match '/assets/index-')
  $assets = Invoke-WebRequest -Uri ($SiteUrl.TrimEnd('/') + '/og-image.png') -UseBasicParsing -TimeoutSec 30
  $ok = $ok -and ($assets.StatusCode -eq 200)
} catch { $ok = $false; Write-Warning $_ }

if (-not $ok) {
  Write-Warning 'Smoke test failed; restoring the backup.'
  robocopy $backup $SitePath /MIR /XD '.well-known' /NFL /NDL /NJH /NJS /NP | Out-Null
  throw "Deploy rolled back to $backup"
}

# 5. Rotate old backups
Write-Host "  [5/5] Pruning backups (keeping $KeepBackups)"
Get-ChildItem $backupRoot -Directory | Sort-Object Name -Descending | Select-Object -Skip $KeepBackups |
  ForEach-Object { Remove-Item $_.FullName -Recurse -Force }

Write-Host "`n  Deploy OK: $SiteUrl  (backup: $backup)`n" -ForegroundColor Green
# robocopy returns 1-7 on success; make the step exit code explicit for CI runners
$global:LASTEXITCODE = 0
exit 0
