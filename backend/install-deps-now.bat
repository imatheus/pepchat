@echo off
echo Instalando dependencias FFmpeg...
cd /d "%~dp0"

echo Executando npm install...
npm install

echo.
echo Verificando instalacao...
npm list ffmpeg-static fluent-ffmpeg

echo.
echo Concluido! Reinicie o servidor.
pause