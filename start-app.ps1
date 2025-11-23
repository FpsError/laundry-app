# Masbana Laundry App - Quick Start Script
# This script starts both backend and frontend servers

Write-Host "Starting Masbana Laundry App..." -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
if (-Not (Test-Path "backend") -or -Not (Test-Path "frontend")) {
    Write-Host "Error: Please run this script from the Masbana root directory" -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    python app.py
}

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend Server (Port 3000)..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Backend running at:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend running at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Magenta
Write-Host ""

# Monitor jobs
try {
    while ($true) {
        if ($backendJob.State -eq "Failed") {
            Write-Host "Backend server failed!" -ForegroundColor Red
            Receive-Job $backendJob
        }
        if ($frontendJob.State -eq "Failed") {
            Write-Host "Frontend server failed!" -ForegroundColor Red
            Receive-Job $frontendJob
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "Servers stopped." -ForegroundColor Green
}
