# Como Instalar as Dependências de Áudio

## Problema
Você está vendo o erro: `Cannot find module 'fluent-ffmpeg'`

## Solução Rápida

### Opção 1: Script Automático (Windows)
Execute o arquivo `install-audio-deps.bat` no diretório backend:
```bash
cd backend
./install-audio-deps.bat
```

### Opção 2: Script Automático (Linux/Mac)
Execute o arquivo `install-audio-deps.sh` no diretório backend:
```bash
cd backend
chmod +x install-audio-deps.sh
./install-audio-deps.sh
```

### Opção 3: Instalação Manual
No diretório backend, execute:
```bash
cd backend
npm install ffmpeg-static@^5.2.0 fluent-ffmpeg@^2.1.3 @types/fluent-ffmpeg@^2.1.26
```

## Após a Instalação

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Verifique os logs**: Você deve ver a mensagem:
   ```
   ✅ FFmpeg dependencies loaded successfully
   ```

## Funcionalidade Atual (Sem FFmpeg)

Mesmo sem as dependências instaladas, o sistema **continua funcionando**:

- ✅ Áudios são enviados normalmente
- ✅ `ptt: true` é configurado corretamente
- ✅ Mimetypes otimizados são usados
- ⚠️ Conversão para OGG/Opus não acontece (fallback para formato original)

## Funcionalidade Completa (Com FFmpeg)

Após instalar as dependências:

- ✅ Conversão automática para OGG/Opus
- ✅ Máxima compatibilidade com todos os dispositivos
- ✅ Otimização para mensagens de voz (PTT)
- ✅ Limpeza automática de arquivos temporários

## Verificação

Para verificar se tudo está funcionando, envie um áudio e observe os logs:

### Sem FFmpeg:
```
⚠️ FFmpeg dependencies not available, using fallback mode
⚠️ FFmpeg not available, using original audio with best mimetype
📱 Using original audio with mimetype: audio/mp4
🎤 Audio message configured as PTT
```

### Com FFmpeg:
```
✅ FFmpeg dependencies loaded successfully
🔄 Converting audio to OGG/Opus for optimal PTT compatibility
✅ Audio successfully converted to OGG/Opus
🎤 Audio message configured as PTT
```

## Troubleshooting

### Se a instalação falhar:
1. Verifique sua conexão com a internet
2. Limpe o cache do npm: `npm cache clean --force`
3. Tente novamente: `npm install`

### Se ainda houver problemas:
1. Delete `node_modules`: `rm -rf node_modules`
2. Delete `package-lock.json`: `rm package-lock.json`
3. Reinstale tudo: `npm install`

## Resultado Final

Independente de ter o FFmpeg ou não, todos os áudios serão enviados como **mensagens de voz (PTT)** e funcionarão em:

- ✅ WhatsApp Web
- ✅ WhatsApp Mobile
- ✅ WhatsApp Desktop

A diferença é que **com FFmpeg**, a compatibilidade será ainda melhor devido à conversão para OGG/Opus.