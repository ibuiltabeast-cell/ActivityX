# Sync root static files to public/ directory for Cloudflare packaging
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$publicDir = Join-Path $rootDir "public"

if (!(Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir | Out-Null
}

$filesToSync = @("index.html", "style.css", "app.js")

foreach ($file in $filesToSync) {
    $src = Join-Path $rootDir $file
    $dest = Join-Path $publicDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dest -Force
        Write-Host "Synced $file -> public/$file" -ForegroundColor Green
    }
}

Write-Host "Build complete! Static assets are ready in public/ for Cloudflare deployment." -ForegroundColor Cyan

