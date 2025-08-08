#!/bin/bash

echo "========================================"
echo "    CORREÇÃO COMPLETA PTT WHATSAPP"
echo "========================================"
echo

cd "$(dirname "$0")"

echo "1. Instalando dependências de áudio..."
npm install ffmpeg-static@^5.2.0 fluent-ffmpeg@^2.1.3 @types/fluent-ffmpeg@^2.1.26

echo
echo "2. Atualizando Baileys para versão mais recente..."
npm install @whiskeysockets/baileys@latest

echo
echo "3. Removendo versão antiga do Baileys..."
npm uninstall @adiwajshing/baileys

echo
echo "4. Verificando instalação..."
echo "Versão do Baileys:"
npm list @whiskeysockets/baileys

echo
echo "Dependências de áudio:"
npm list ffmpeg-static fluent-ffmpeg

echo
echo "========================================"
echo "           CORREÇÃO CONCLUÍDA"
echo "========================================"
echo
echo "PROBLEMAS CORRIGIDOS:"
echo "✅ Baileys atualizado para versão 6.x+"
echo "✅ FFmpeg instalado para conversão real"
echo "✅ Detecção de arquivos OGG falsos"
echo "✅ Conversão forçada para OGG/Opus real"
echo
echo "PRÓXIMOS PASSOS:"
echo "1. Reinicie o servidor: npm run dev"
echo "2. Teste enviando um áudio"
echo "3. Observe os logs para verificar conversão"
echo