# 🚀 Comandos Diretos para Instalar FFmpeg

## ⚠️ Problema: Conflito de dependências Jest

O `npm install` está falhando por conflito entre versões do Jest. Vamos instalar apenas as dependências do FFmpeg.

## ✅ Solução: Instalar apenas FFmpeg

### Opção 1: Script Específico
```bash
cd backend
./install-ffmpeg-only.bat
```

### Opção 2: Comandos Manuais (Windows PowerShell/CMD)
```bash
cd backend
npm install ffmpeg-static@^5.2.0 --legacy-peer-deps
npm install fluent-ffmpeg@^2.1.3 --legacy-peer-deps
npm install @types/fluent-ffmpeg@^2.1.26 --save-dev --legacy-peer-deps
```

### Opção 3: Comandos Manuais (Linux/Mac)
```bash
cd backend
npm install ffmpeg-static@^5.2.0 --legacy-peer-deps
npm install fluent-ffmpeg@^2.1.3 --legacy-peer-deps
npm install @types/fluent-ffmpeg@^2.1.26 --save-dev --legacy-peer-deps
```

## 🔄 Após Instalação:

1. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

2. **Verifique se aparece**:
   ```
   ✅ FFmpeg dependencies loaded successfully
   ```

3. **Teste enviando um áudio**

## 📋 O que Cada Comando Faz:

- `ffmpeg-static`: Binário do FFmpeg
- `fluent-ffmpeg`: Interface Node.js para FFmpeg  
- `@types/fluent-ffmpeg`: Tipos TypeScript
- `--legacy-peer-deps`: Ignora conflitos de dependências

## 🎯 Resultado Esperado:

Após executar os comandos e reiniciar:
```
✅ FFmpeg dependencies loaded successfully
🔄 Converting to REAL OGG/Opus for PTT compatibility
✅ Conversion successful - now REAL OGG/Opus
```

Execute um dos comandos acima agora! 🚀