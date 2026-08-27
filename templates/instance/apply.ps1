<#
.SYNOPSIS
  Applies this instance (private layers) onto the Community Platform and builds the deploy zip.

.DESCRIPTION
  1. Ensures a checkout of the public platform at the version in platform.lock
     (tag vX.Y.Z or a branch). By default uses a sibling folder (developer machine)
     when it exists; otherwise clones into .\platform.
  2. Copies the private layers: env\.env.production, env\.env.local and brand\public -> .brand\public.
  3. Installs dependencies when missing and runs `npm run dist` (build with overlay + zip).
  4. Copies the zip to dist\community-platform-dist-<version>-<date>.zip.

.PARAMETER Ref          Platform tag or branch. Defaults to platform.lock.
.PARAMETER PlatformDir  Platform folder. Defaults to ..\$PlatformFolder when present, else .\platform.
.PARAMETER ApplyOnly    Only copy the layers (local development); no build.
.PARAMETER Clone        Force a clean clone into .\platform even when a sibling folder exists.

.EXAMPLE
  .\apply.ps1                      # dev: apply onto the sibling folder and build the zip
  .\apply.ps1 -ApplyOnly           # restore .env and .brand after a git clean
  .\apply.ps1 -Ref v2.1.0 -Clone   # reproducible build of a published version
#>
[CmdletBinding()]
param(
  [string] $Ref,
  [string] $PlatformDir,
  [switch] $ApplyOnly,
  [switch] $Clone
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
# Public platform repository and the sibling folder name used on developer machines
$Repo = 'https://github.com/brunobola-portfolio/community-platform.git'
$PlatformFolder = 'community-platform'

if (-not $Ref) { $Ref = (Get-Content (Join-Path $Root 'platform.lock') -Raw).Trim() }
if (-not $PlatformDir) {
  $sibling = Join-Path (Split-Path $Root -Parent) $PlatformFolder
  $PlatformDir = if ((Test-Path $sibling) -and -not $Clone) { $sibling } else { Join-Path $Root 'platform' }
}

Write-Host "`n  Community Platform @ $Ref" -ForegroundColor Cyan
Write-Host "  Platform: $PlatformDir"

# 1. Platform checkout
if (-not (Test-Path (Join-Path $PlatformDir '.git'))) {
  Write-Host "  [1/4] Cloning $Repo ..."
  git clone --quiet $Repo $PlatformDir
  git -C $PlatformDir checkout --quiet $Ref
} elseif ($PlatformDir -like '*\platform') {
  Write-Host "  [1/4] Updating the clone to $Ref ..."
  git -C $PlatformDir fetch --quiet --tags origin
  git -C $PlatformDir checkout --quiet $Ref
  if ($Ref -eq 'main') { git -C $PlatformDir pull --quiet --ff-only origin main }
} else {
  $current = git -C $PlatformDir rev-parse --abbrev-ref HEAD
  Write-Host "  [1/4] Developer folder on '$current' (version unchanged; use -Clone for a build of $Ref)"
}

# 2. Private layers
Write-Host "  [2/4] Applying private layers (env + brand) ..."
Copy-Item (Join-Path $Root 'env\.env.production') (Join-Path $PlatformDir '.env.production') -Force
if (Test-Path (Join-Path $Root 'env\.env.local')) {
  Copy-Item (Join-Path $Root 'env\.env.local') (Join-Path $PlatformDir '.env.local') -Force
}
$brandDst = Join-Path $PlatformDir '.brand\public'
if (Test-Path $brandDst) { Remove-Item $brandDst -Recurse -Force }
New-Item -ItemType Directory -Force (Split-Path $brandDst -Parent) | Out-Null
Copy-Item (Join-Path $Root 'brand\public') $brandDst -Recurse
$n = (Get-ChildItem $brandDst -Recurse -File | Measure-Object).Count
Write-Host "        $n brand files applied"

if ($ApplyOnly) { Write-Host "  Layers applied. (-ApplyOnly: no build)`n" -ForegroundColor Green; exit 0 }

# 3. Build with overlay
Push-Location $PlatformDir
try {
  if (-not (Test-Path 'node_modules')) { Write-Host "  [3/4] npm ci ..."; npm ci --no-audit --no-fund | Out-Null }
  Write-Host "  [3/4] npm run dist ..."
  npm run dist
  if ($LASTEXITCODE -ne 0) { throw "npm run dist failed (exit $LASTEXITCODE)" }

  # 4. Dated zip inside the instance repo (dist\ is gitignored)
  $version = (git describe --tags --always).Trim()
  $stamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
  New-Item -ItemType Directory -Force (Join-Path $Root 'dist') | Out-Null
  $out = Join-Path $Root "dist\community-platform-dist-$version-$stamp.zip"
  Copy-Item 'community-platform-dist.zip' $out -Force
  Write-Host "`n  [4/4] Instance zip: $out" -ForegroundColor Green
} finally { Pop-Location }
$global:LASTEXITCODE = 0
exit 0
