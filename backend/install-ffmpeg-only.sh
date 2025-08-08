#!/bin/bash

echo "========================================"
echo "    INSTALANDO APENAS DEPENDENCIAS FFMPEG"
echo "========================================"
echo

cd "$(dirname "$0")"

echo "Instalando ffmpeg-static..."
npm install ffmpeg-static@^5.2.0 --legacy-peer-deps

echo
echo "Instalando fluent-ffmpeg..."
npm install fluent-ffmpeg@^2.1.3 --legacy-peer-deps

echo
echo "Instalando tipos TypeScript..."
npm install @types/fluent-ffmpeg@^2.1.26 --save-dev --legacy-peer-deps

echo
echo "Verificando instalacao..."
npm list ffmpeg-static fluent-ffmpeg @types/fluent-ffmpeg

echo
echo "========================================"
echo "           INSTALACAO CONCLUIDA"
echo "========================================"
echo
echo "✅ FFmpeg dependencies instaladas com sucesso!"
echo
echo "PRÓXIMOS PASSOS:"
echo "1. Reinicie o servidor: npm run dev"
echo "2. Teste enviando um áudio"
echo "3. Verifique os logs para: '✅ FFmpeg dependencies loaded successfully'"
echo