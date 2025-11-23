# Quick Start Script for Laundry Management System Backend

Write-Host "=== Masbanat AlAkhawayn Laundry System - Quick Start ===" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "`nChecking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = docker ps --filter "name=laundry-db" --format "{{.Status}}" 2>$null

if (-not $pgStatus) {
    Write-Host "PostgreSQL not found. Starting Docker container..." -ForegroundColor Yellow
    docker run -d --name laundry-db -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=laundry_db postgres:15
    Write-Host "Waiting for PostgreSQL to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "PostgreSQL is running!" -ForegroundColor Green
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "`nCreating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ".env file created. Please update with your settings." -ForegroundColor Green
}

# Install dependencies
Write-Host "`nInstalling Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Start Flask app in background
Write-Host "`nStarting Flask backend..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "app.py" -NoNewWindow

Write-Host "`nWaiting for Flask to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Initialize machines
Write-Host "`nInitializing machines..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/initialize-machines" -Method Post -ContentType "application/json"
    Write-Host "Machines initialized: $($response.machines.Count) machines created" -ForegroundColor Green
} catch {
    Write-Host "Note: Machines may already be initialized" -ForegroundColor Yellow
}

# Generate slots for next 7 days
Write-Host "`nGenerating time slots for next 7 days..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/generate-week-slots" -Method Post -ContentType "application/json"
    Write-Host "Time slots created: $($response.slots_created) slots" -ForegroundColor Green
} catch {
    Write-Host "Error generating slots: $_" -ForegroundColor Red
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Backend is running at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend should connect to this backend URL" -ForegroundColor Cyan
Write-Host "`nAPI Endpoints:" -ForegroundColor Yellow
Write-Host "  POST /login - Login" -ForegroundColor White
Write-Host "  POST /register - Register new student" -ForegroundColor White
Write-Host "  GET  /api/slots - View available slots" -ForegroundColor White
Write-Host "  POST /api/bookings - Make a booking" -ForegroundColor White
Write-Host "  GET  /api/attendant/today - Attendant dashboard" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop the server" -ForegroundColor Yellow
