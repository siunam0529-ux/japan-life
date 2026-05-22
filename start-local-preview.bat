@echo off
cd /d "%~dp0"
echo Starting Japan Life local preview...
echo.
echo Open this address in your browser:
echo http://localhost:3000
echo.
echo This runs only on your computer. Keep this window open while previewing.
echo Press Ctrl+C to stop.
echo.
"C:\Program Files\nodejs\npm.cmd" run start
