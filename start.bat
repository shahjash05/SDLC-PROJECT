@echo off
setlocal

echo ===================================================
echo       Starting Collaborative SDLC Platform
echo ===================================================
echo.

:: Ensure we are in the project root directory
cd /d "%~dp0"

:: 1. Start Docker Infrastructure (PostgreSQL & PlantUML)
echo [1/3] Starting Database and Infrastructure via Docker...
docker compose -f docker-compose.dev.yml up -d
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to start Docker containers.
    echo Please make sure Docker Desktop is running and try again.
    pause
    exit /b %ERRORLEVEL%
)

:: 2. Start Backend (Spring Boot) in a dedicated window
echo [2/3] Launching Backend service (Spring Boot) on port 8081...
start "SDLC Backend - Spring Boot" cmd /k "cd /d "%~dp0backend" && mvn spring-boot:run -Dspring-boot.run.profiles=dev"

:: 3. Start Frontend (React / Vite) in a dedicated window
echo [3/3] Launching Frontend service (Vite) on port 5173...
start "SDLC Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo  All services are launching:
echo    - Database (PostgreSQL): localhost:5432
echo    - PlantUML Server:       http://localhost:8085
echo    - Backend API:           http://localhost:8081
echo    - Frontend UI:           http://localhost:5173
echo ===================================================
echo.
echo Separate console windows have been opened for the Backend and Frontend.
echo To stop the servers, close those windows or press Ctrl+C in each.
echo To stop Docker containers, run: docker compose -f docker-compose.dev.yml down
echo.
pause
