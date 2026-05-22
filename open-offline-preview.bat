@echo off
cd /d "%~dp0"
echo Building Japan Life offline files...
call "C:\Program Files\nodejs\npm.cmd" run build
if errorlevel 1 (
  echo Build failed. Please check the error above.
  pause
  exit /b 1
)
echo.
echo Starting offline local preview...
echo URL: http://127.0.0.1:4173/
start "Japan Life Offline Server" cmd /k ""C:\Program Files\nodejs\npm.cmd" run offline"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4173/
