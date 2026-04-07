# ─────────────────────────────────────────────────────────────
# Q-SAGE AI  –  Start Script
# Double-click this file OR right-click → "Run with PowerShell"
# ─────────────────────────────────────────────────────────────

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  Q-SAGE AI - Starting..." -ForegroundColor Cyan
Write-Host ""

# ── Kill anything on port 3000 and 5000 cleanly ──────────────
foreach ($port in @(3000, 5000)) {
    $pids = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess
    foreach ($p in $pids) {
        if ($p -and $p -gt 0) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 1

# ── Start Backend ─────────────────────────────────────────────
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root'; `$host.UI.RawUI.WindowTitle = 'Q-SAGE Backend (port 5000)'; node server/index.js"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Start Frontend ────────────────────────────────────────────
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$root'; `$host.UI.RawUI.WindowTitle = 'Q-SAGE Frontend (port 3000)'; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Open browser ──────────────────────────────────────────────
Start-Process "http://localhost:3000"

Write-Host "  ✅ Backend  → http://localhost:5000" -ForegroundColor Green
Write-Host "  ✅ Frontend → http://localhost:3000  (opening in browser...)" -ForegroundColor Green
Write-Host ""
Write-Host "  Close the two terminal windows to stop the servers." -ForegroundColor Gray
Write-Host ""
