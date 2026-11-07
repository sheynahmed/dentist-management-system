@echo off
title DentoCare Clinic App Launcher
echo ===================================================
echo Starting DentoCare Clinic Application...
echo ===================================================
cd /d "%~dp0"

:: Start the background server silently
start "DentoCare Server" /min "C:\Program Files\nodejs\npm.cmd" run dev

echo Initializing clinic systems (waiting 5 seconds)...
timeout /t 5 /nobreak >nul

echo Launching DentoCare in Desktop App Window...
:: Launch in standalone desktop application window mode (no address bar or tabs)
start msedge.exe --app=http://localhost:3000 2>nul || start chrome.exe --app=http://localhost:3000 2>nul || start http://localhost:3000

echo.
echo ===================================================
echo DentoCare Clinic App is now running in Desktop Mode!
echo Close this window or press any key to shut down.
echo ===================================================
pause >nul

echo Closing DentoCare server...
taskkill /fi "windowtitle eq DentoCare Server*" /f >nul
echo Done!
timeout /t 2 /nobreak >nul
