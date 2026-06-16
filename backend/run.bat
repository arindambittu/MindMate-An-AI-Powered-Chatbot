@echo off
echo Starting MindMate Backend...
cd /d %~dp0
if not exist venv (
    echo Virtual environment not found. Please create it first.
    pause
    exit /b
)
.\venv\Scripts\python app.py
pause
