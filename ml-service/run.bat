@echo off
echo ============================================
echo   CivicPulse ML Priority Service - Startup
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Python not found! Install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
pip install -r requirements.txt --quiet

echo [2/3] Training ML model (first run only)...
python model/train.py

echo [3/3] Starting FastAPI ML Service on http://localhost:8000
echo        API Docs: http://localhost:8000/docs
echo.
python main.py

pause
