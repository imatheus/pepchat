#!/bin/bash
echo "Instalando dependencias FFmpeg..."
cd "$(dirname "$0")"

echo "Executando npm install..."
npm install

echo
echo "Verificando instalacao..."
npm list ffmpeg-static fluent-ffmpeg

echo
echo "Concluido! Reinicie o servidor."