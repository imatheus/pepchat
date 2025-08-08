# Guia Completo: PTT (Push-to-Talk) no WhatsApp com Baileys

## 🎯 Problema Resolvido

Áudios apareciam como arquivos .ogg para download em vez de mensagens de voz (PTT) no WhatsApp mobile/desktop.

## ✅ Solução Implementada

### 1. Formato de Áudio Correto
- **Container**: OGG
- **Codec**: Opus
- **Canais**: 1 (Mono) - OBRIGATÓRIO para PTT
- **Sample Rate**: 48kHz
- **Bitrate**: 64k (otimizado para voz)

### 2. Metadados Baileys Corretos

```javascript
// ✅ CORRETO - Aparece como mensagem de voz
await wbot.sendMessage(jid, {
  audio: audioBuffer,                    // Buffer ou { url: path }
  mimetype: 'audio/ogg; codecs=opus',   // Mimetype EXATO
  ptt: true                             // Flag PTT OBRIGATÓRIA
  // NÃO incluir fileName!
  // NÃO incluir caption!
});

// ❌ ERRADO - Aparece como arquivo
await wbot.sendMessage(jid, {
  audio: audioBuffer,
  mimetype: 'audio/ogg; codecs=opus',
  ptt: true,
  fileName: 'audio.ogg',  // ❌ QUEBRA O PTT!
  caption: 'Áudio'        // ❌ PTT não tem caption!
});
```

### 3. Regras Críticas para PTT

#### ✅ OBRIGATÓRIO:
1. `audio: Buffer` ou `audio: { url: localPath }`
2. `mimetype: 'audio/ogg; codecs=opus'`
3. `ptt: true`
4. Áudio em formato mono (1 canal)

#### ❌ PROIBIDO:
1. `fileName` - Força modo arquivo
2. `caption` - PTT não tem caption
3. URLs externas diretas
4. Áudio estéreo (2 canais)
5. Mimetypes incorretos

### 4. Conversão FFmpeg Correta

```bash
ffmpeg -i input.mp3 \
  -c:a libopus \
  -ac 1 \
  -ar 48000 \
  -b:a 64k \
  -f ogg \
  -avoid_negative_ts make_zero \
  -fflags +genpts \
  output.ogg
```

## 🔧 Implementação no Código

### SendWhatsAppMedia.ts
```typescript
// Configuração PTT correta
messageContent = {
  audio: finalAudioBuffer,     // Buffer do áudio
  mimetype: finalMimetype,     // 'audio/ogg; codecs=opus'
  ptt: true                    // Flag PTT
  // SEM fileName!
  // SEM caption!
};
```

### AudioConverter.ts
```typescript
ffmpeg(inputPath)
  .audioCodec('libopus')       // Codec Opus
  .audioChannels(1)            // Mono (OBRIGATÓRIO)
  .audioFrequency(48000)       // 48kHz
  .audioBitrate('64k')         // Bitrate voz
  .format('ogg')               // Container OGG
  .outputOptions([
    '-avoid_negative_ts', 'make_zero',
    '-fflags', '+genpts'
  ])
```

## 🧪 Teste e Verificação

### Logs de Sucesso:
```
✅ Audio successfully converted to OGG/Opus
🎤 Audio message configured as PTT: {
  mimetype: 'audio/ogg; codecs=opus',
  bufferSize: 12345,
  isPTT: true,
  isConverted: true
}
✅ Message sent successfully
```

### Como Testar:
1. Envie um áudio via sistema
2. Verifique no WhatsApp Mobile
3. Deve aparecer com ícone de microfone 🎤
4. Deve reproduzir automaticamente ao tocar
5. NÃO deve mostrar opção "Download"

## 🚨 Troubleshooting

### Problema: Ainda aparece como arquivo
**Possíveis causas:**
1. `fileName` sendo enviado
2. Mimetype incorreto
3. Áudio não convertido para mono
4. Flag `ptt: false` ou ausente

### Problema: Erro na conversão
**Soluções:**
1. Verificar se FFmpeg está instalado
2. Verificar permissões de arquivo
3. Usar fallback com mimetype otimizado

### Problema: Áudio não reproduz
**Verificar:**
1. Formato OGG/Opus correto
2. Arquivo não corrompido
3. Tamanho do buffer válido

## 📱 Compatibilidade

### ✅ Funciona em:
- WhatsApp Web
- WhatsApp Mobile (Android/iOS)
- WhatsApp Desktop
- WhatsApp Business

### 🎯 Resultado Final:
- Ícone de microfone 🎤
- Reprodução automática
- Barra de progresso de áudio
- Sem opção de download
- Aparece como "Mensagem de voz"

## 🔄 Fluxo Completo

```
Áudio Original (MP3/WAV/etc.)
        ↓
Converter para OGG/Opus Mono
        ↓
Configurar metadados PTT corretos
        ↓
Enviar via Baileys SEM fileName
        ↓
WhatsApp reconhece como PTT ✅
```

## 📝 Checklist Final

- [ ] Áudio convertido para OGG/Opus
- [ ] Formato mono (1 canal)
- [ ] Mimetype: 'audio/ogg; codecs=opus'
- [ ] Flag ptt: true
- [ ] SEM fileName
- [ ] SEM caption
- [ ] Buffer ou arquivo local (não URL externa)
- [ ] Testado em dispositivo móvel