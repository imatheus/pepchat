@echo off
echo Installing audio conversion dependencies...
echo.

cd /d "%~dp0"

echo Current directory: %CD%
echo.

echo Installing ffmpeg-static and fluent-ffmpeg...
npm install ffmpeg-static@^5.2.0 fluent-ffmpeg@^2.1.3 @types/fluent-ffmpeg@^2.1.26

echo.
echo Installation completed!
echo.
echo You can now restart the development server.
pause