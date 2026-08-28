@echo off
echo Stopping MES Backend / Frontend / PlcApiServer...

REM 1) Kill by window title (covers run-all.bat and direct double-click, both set these titles)
taskkill /F /FI "WINDOWTITLE eq MES Backend*"  /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq MES Frontend*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PlcApiServer*" /T >nul 2>&1

REM 2) Also kill whatever is actually listening on the ports, in case the window
REM    was closed manually but the underlying java/node/dotnet process kept running.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":9090" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p /T >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5051" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p /T >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5050" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p /T >nul 2>&1
)

echo Done.
pause
