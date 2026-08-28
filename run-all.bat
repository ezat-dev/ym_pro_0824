@echo off
cd /d "%~dp0"

if not exist "run-backend.bat" (
  echo [!] run-backend.bat not found.
  echo     Copy run-backend.bat.example to run-backend.bat and fill in DB_PASSWORD.
  pause
  exit /b 1
)

start "MES Backend"  cmd /k run-backend.bat
start "MES Frontend" cmd /k run-frontend.bat
start "PlcApiServer" cmd /k run-csharp.bat

echo Backend (http://localhost:9090), Frontend (http://localhost:5051), PlcApiServer (http://localhost:5050) started in separate windows.
