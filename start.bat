@echo off
set PATH=C:\Program Files\nodejs;%PATH%
echo Starting Expo dev server...
echo Scan the QR code with Expo Go on your phone.
echo Using tunnel mode and clearing cache for reliable remote updates.
echo.
call npx expo start --tunnel --clear

if %ERRORLEVEL% NEQ 0 (
	echo.
	echo Tunnel failed. Falling back to LAN mode.
	echo Make sure your phone and PC are on the same Wi-Fi network.
	echo.
	call npx expo start --lan --clear
)
