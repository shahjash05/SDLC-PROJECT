@echo off
setlocal

echo ===================================================
echo       Stopping Collaborative SDLC Platform
echo ===================================================
echo.

cd /d "%~dp0"

echo Stopping Docker containers...
docker compose -f docker-compose.dev.yml down

echo.
echo Stopping any running Backend (port 8081) or Frontend (port 5173) processes...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
    echo Stopping backend process (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo Stopping frontend process (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All services have been stopped.
echo.
pause
