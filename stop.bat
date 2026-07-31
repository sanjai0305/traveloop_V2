@echo off
echo ===================================================
echo  Stopping Traveloop V2 Ecosystem Containers...
echo ===================================================
echo.

docker compose down

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] All Traveloop V2 containers stopped successfully.
) else (
    echo.
    echo [ERROR] Failed to stop containers.
)
