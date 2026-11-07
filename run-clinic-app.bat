@echo off
title DentoCare Clinic App Launcher
echo ===================================================
echo Starting the Dentist Management System...
echo ===================================================
cd /d "%~dp0"

:: Start the dev server in a new minimized window
start "DentoCare Server" /min "C:\Program Files\nodejs\npm.cmd" run dev

echo Waiting 5 seconds for the server to boot...
timeout /t 5 /nobreak >nul

echo Opening web browser to http://localhost:3000...
start http://localhost:3000

echo.
echo ===================================================
echo DentoCare Clinic App is now running!
echo You can use the app in your browser.
echo.
echo To stop the server and close the app, return here
echo and press any key...
echo ===================================================
pause >nul

echo Stopping the server...
taskkill /fi "windowtitle eq DentoCare Server*" /f >nul
echo Done!
timeout /t 2 /nobreak >nul
