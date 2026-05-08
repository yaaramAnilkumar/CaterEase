# CaterEase - Start all servers
$env:PATH += ";C:\Program Files\nodejs;$env:APPDATA\npm"

# ── Read backend port from backend/.env ──────────────────────────────────────
$backendPort = 8001
$backendEnvFile = "$PSScriptRoot\backend\.env"
if (Test-Path $backendEnvFile) {
    $match = Select-String -Path $backendEnvFile -Pattern "^\s*BACKEND_PORT\s*=\s*(\d+)" | Select-Object -First 1
    if ($match) { $backendPort = [int]$match.Matches[0].Groups[1].Value }
}

# ── Read frontend port from frontend/.env.local ───────────────────────────────
$frontendPort = 3000
$frontendEnvFile = "$PSScriptRoot\frontend\.env.local"
if (Test-Path $frontendEnvFile) {
    $match = Select-String -Path $frontendEnvFile -Pattern "^\s*NEXT_PUBLIC_FRONTEND_PORT\s*=\s*(\d+)" | Select-Object -First 1
    if ($match) { $frontendPort = [int]$match.Matches[0].Groups[1].Value }
}

Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process -Name "python*", "uvicorn*", "node*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Starting Backend (port $backendPort)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; uvicorn app.main:app --port $backendPort"

Write-Host "Waiting for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 8

$backendOk = $false
try { Invoke-RestMethod "http://localhost:$backendPort/" -TimeoutSec 5 | Out-Null; $backendOk = $true } catch {}
if ($backendOk) { Write-Host "Backend OK - http://localhost:$backendPort/docs" -ForegroundColor Green }
else { Write-Host "Backend failed to start. Check the backend window." -ForegroundColor Red }

Write-Host "Starting Frontend (port $frontendPort)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH += ';C:\Program Files\nodejs'; cd '$PSScriptRoot\frontend'; & 'C:\Program Files\nodejs\npm.cmd' run start -- --port $frontendPort"

Start-Sleep -Seconds 6
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host " CaterEase is running!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host " Frontend : http://localhost:$frontendPort" -ForegroundColor White
Write-Host " API Docs : http://localhost:$backendPort/docs" -ForegroundColor White
Write-Host " Admin    : Read from backend/.env (ADMIN_EMAIL / ADMIN_PASSWORD)" -ForegroundColor White
Write-Host "====================================" -ForegroundColor Green
