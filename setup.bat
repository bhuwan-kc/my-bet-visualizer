@echo off
REM Setup script for My Bet Visualizer (Windows)

echo ========================================
echo My Bet Visualizer - Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

REM Check if Yarn is installed
where yarn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Yarn is not installed!
    echo Please install Yarn from https://yarnpkg.com/
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.8+ from https://www.python.org/
    exit /b 1
)

echo [1/3] Installing JavaScript dependencies...
call yarn install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install JavaScript dependencies
    exit /b 1
)

echo.
echo [2/3] Setting up Python virtual environment...
if exist .venv (
    echo Virtual environment already exists, skipping creation...
) else (
    python -m venv .venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create Python virtual environment
        exit /b 1
    )
)

echo.
echo [3/3] Installing Python dependencies...
call .venv\Scripts\activate.bat && pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Python dependencies
    exit /b 1
)

echo.
echo ========================================
echo Setup complete! 
echo ========================================
echo.
echo To start the application:
echo   1. Run: yarn dev
echo   2. Open: http://localhost:3000
echo.
echo To activate Python environment manually:
echo   .venv\Scripts\activate.bat
echo.

