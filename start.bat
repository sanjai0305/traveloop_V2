@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo  Traveloop V2 - Ecosystem Docker Startup Script
echo ===================================================
echo.

:: 1. Verify Docker installation
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker CLI is not installed or not in system PATH.
    echo Please install Docker Desktop and start it before running this script.
    exit /b 1
)

:: 2. Verify Docker Compose plugin
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose plugin is not available.
    echo Please ensure Docker Desktop is running and Docker Compose is enabled.
    exit /b 1
)

echo [1/3] Building and starting all Docker containers in detached mode...
docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker Compose services.
    echo Run "docker compose logs" for detailed diagnostic logs.
    exit /b 1
)

echo.
echo [2/3] Waiting for all services to become healthy (polling status)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "^
    $timeout = 90; ^
    $startTime = Get-Date; ^
    echo 'Checking container health status...'; ^
    while (((Get-Date) - $startTime).TotalSeconds -lt $timeout) { ^
        $ps = docker compose ps --format json | ConvertFrom-Json; ^
        if (-not $ps) { Start-Sleep -Seconds 2; continue }; ^
        $unhealthy = $ps | Where-Object { $_.Health -ne 'healthy' -and $_.State -ne 'running' }; ^
        if (-not $unhealthy) { ^
            echo 'All containers are running and healthy!'; ^
            break; ^
        } ^
        Start-Sleep -Seconds 3; ^
    }"

echo.
echo [3/3] Current Container Status:
docker compose ps

echo.
echo Launching frontend applications in your default browser...
start "" "http://localhost:3001"
start "" "http://localhost:3002"
start "" "http://localhost:3003"
start "" "http://localhost:3004"
start "" "http://localhost:3005"

echo.
echo ===================================================
echo  Traveloop V2 Ecosystem is Running Successfully!
echo ===================================================
echo.
echo  Backend API:       http://localhost:5000
echo  Admin Portal:      http://localhost:3001
echo  Agent Portal:      http://localhost:3002
echo  Driver Portal:     http://localhost:3003
echo  User Application: http://localhost:3004
echo  User Website:     http://localhost:3005
echo.
echo ===================================================
echo.
