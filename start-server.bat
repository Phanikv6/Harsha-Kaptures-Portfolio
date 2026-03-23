@echo off
echo ========================================
echo   Harsha Kaptures Website Server
echo ========================================
echo.
echo Starting local web server...
echo.
echo Your website will be available at:
echo   http://localhost:8000
echo.
echo To access from your phone:
echo   1. Make sure your phone is on the same WiFi network
echo   2. Find your computer's IP address (shown below)
echo   3. Open browser on phone and go to: http://[YOUR_IP]:8000
echo.
echo ========================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo Your computer's IP address: %IP%
echo Phone URL: http://%IP%:8000
echo.
echo ========================================
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Python server...
    python -m http.server 8000
    goto :end
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Node.js server...
    npx http-server -p 8000 -c-1
    goto :end
)

REM If neither Python nor Node.js is found
echo ERROR: Python or Node.js not found!
echo.
echo Please install one of the following:
echo   1. Python: https://www.python.org/downloads/
echo   2. Node.js: https://nodejs.org/
echo.
pause
:end
