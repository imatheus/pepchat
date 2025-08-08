#!/bin/bash

echo "Installing audio conversion dependencies..."
echo

# Navegar para o diretório do script
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo

echo "Installing ffmpeg-static and fluent-ffmpeg..."
npm install ffmpeg-static@^5.2.0 fluent-ffmpeg@^2.1.3 @types/fluent-ffmpeg@^2.1.26

echo
echo "Installation completed!"
echo
echo "You can now restart the development server."