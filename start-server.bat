@echo off
title Student Data Viewer - Local Server
echo ========================================================
echo   Student Data Viewer - Local Development Server
echo ========================================================
echo.
echo 1. Opening http://localhost:8000 in your browser...
start http://localhost:8000
echo.
echo 2. Starting Python HTTP Server on port 8000...
echo    (Keep this window open while testing the website)
echo    To close the server, press Ctrl + C or close this window.
echo.
python -m http.server 8000
pause
