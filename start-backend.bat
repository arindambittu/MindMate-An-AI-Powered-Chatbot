@echo off
echo ========================================
echo   MindMate Backend Server
echo ========================================
echo.

REM Change to the backend directory
cd /d "%~dp0backend"

REM Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please ensure backend\venv exists and is properly configured.
    echo.
    pause
    exit /b 1
)

echo Starting Flask backend server...
echo Server will run on http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the Flask application
venv\Scripts\python.exe app.py

REM If the script exits, pause so user can see any error messages
pause
