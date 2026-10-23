@echo off
setlocal
cd /d "%~dp0"
title Student Data Viewer - Local Server

echo ========================================================
echo   Student Data Viewer - Local Development Server
echo ========================================================
echo.

:: Check if port 8000 is already in use
netstat -ano | findstr /R /C:":8000 " >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] A server is already running on port 8000.
    echo [INFO] Opening http://localhost:8000 in your default browser...
    start http://localhost:8000
    echo.
    echo To avoid duplicate servers, this launcher will not start
    echo another instance. Use the existing server window or press
    echo any key to exit this launcher.
    echo.
    pause
    exit /b 0
)

:: Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python was not detected in your system PATH.
    echo Please install Python or use the VS Code Live Server extension.
    echo.
    pause
    exit /b 1
)

echo [INFO] Project directory: %CD%
echo [INFO] Opening http://localhost:8000 in your default browser...
echo.
echo ========================================================
echo   Server is running at: http://localhost:8000
echo   KEEP THIS WINDOW OPEN while using the website.
echo   To stop the server, press Ctrl + C or close this window.
echo ========================================================
echo.

start http://localhost:8000
python -m http.server 8000
pause
