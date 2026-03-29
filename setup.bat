@echo off
echo === Chinese Learning App Setup ===
echo.

REM Add Node.js to PATH for this session
set PATH=C:\Program Files\nodejs;%PATH%

REM Verify Node is available
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found at C:\Program Files\nodejs
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found. Installing dependencies...
echo.

npm install

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo === Setup complete! ===
echo.
echo To start the app:
echo   1. Run: start.bat
echo   2. Install Expo Go on your phone
echo   3. Scan the QR code
echo.
pause
