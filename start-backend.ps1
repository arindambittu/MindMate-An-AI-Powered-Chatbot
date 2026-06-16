# MindMate Backend Startup Script
# PowerShell version with enhanced error handling

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MindMate Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"

# Change to backend directory
Set-Location $BackendDir

# Check if virtual environment exists
$VenvPython = Join-Path $BackendDir "venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Expected location: $VenvPython" -ForegroundColor Yellow
    Write-Host "Please ensure backend\venv exists and is properly configured." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if port 8000 is already in use
$Port = 8000
$Connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue

if ($Connection.TcpTestSucceeded) {
    Write-Host "WARNING: Port $Port is already in use!" -ForegroundColor Yellow
    Write-Host "Another instance of the backend may already be running." -ForegroundColor Yellow
    Write-Host ""
    $Response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($Response -ne 'y' -and $Response -ne 'Y') {
        Write-Host "Startup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Starting Flask backend server..." -ForegroundColor Green
Write-Host "Server will run on http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the Flask application
try {
    & $VenvPython app.py
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to start backend server" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
