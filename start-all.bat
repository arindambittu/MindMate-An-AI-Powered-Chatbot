@echo off
echo ========================================
echo   MindMate - Starting All Services
echo ========================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"

echo Starting Backend Server...
start "MindMate Backend" cmd /k "%SCRIPT_DIR%start-backend.bat"

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend Development Server...
cd /d "%SCRIPT_DIR%frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo WARNING: node_modules not found!
    echo You may need to run 'npm install' first.
    echo.
)

start "MindMate Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both services are starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Two terminal windows have been opened:
echo  1. Backend Server (Flask)
echo  2. Frontend Server (Vite)
echo.
echo Close those windows or press Ctrl+C in them to stop the services.
echo.
echo You can close this window now.
echo ========================================
pause
