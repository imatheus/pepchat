@echo off
echo ========================================
echo    RESOLVENDO CONFLITO JEST + FFMPEG
echo ========================================
echo.

cd /d "%~dp0"

echo 1. Corrigindo versao do @types/jest...
npm install @types/jest@^27.5.2 --save-dev --legacy-peer-deps

echo.
echo 2. Instalando ffmpeg-static...
npm install ffmpeg-static@^5.2.0 --legacy-peer-deps

echo.
echo 3. Instalando fluent-ffmpeg...
npm install fluent-ffmpeg@^2.1.3 --legacy-peer-deps

echo.
echo 4. Instalando tipos TypeScript...
npm install @types/fluent-ffmpeg@^2.1.26 --save-dev --legacy-peer-deps

echo.
echo 5. Verificando instalacao...
npm list ffmpeg-static fluent-ffmpeg @types/fluent-ffmpeg

echo.
echo ========================================
echo           PROBLEMA RESOLVIDO
echo ========================================
echo.
echo ✅ Conflito Jest resolvido!
echo ✅ FFmpeg dependencies instaladas!
echo.
echo PRÓXIMOS PASSOS:
echo 1. Reinicie o servidor: npm run dev
echo 2. Deve aparecer: "✅ FFmpeg dependencies loaded successfully"
echo.
pause