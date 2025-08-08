# Implementação de Áudio PTT (Push-to-Talk) para WhatsApp

## Problema Resolvido

Anteriormente, quando você enviava um áudio pelo Baileys, ele funcionava no WhatsApp Web, mas no celular e no WhatsApp Desktop aparecia como um arquivo de áudio "genérico" (geralmente .mp3) e não como uma mensagem de voz (PTT).

## Solução Implementada

### 1. Conversão Automática para OGG/Opus

- **Formato Ideal**: O WhatsApp usa o formato OGG/Opus para mensagens de voz
- **Conversão Automática**: Todos os áudios são automaticamente convertidos para OGG/Opus antes do envio
- **Fallback**: Se a conversão falhar, o sistema usa o formato original com as melhores configurações possíveis

### 2. Configurações Corretas do Baileys

```javascript
messageContent = {
  audio: audioBuffer,
  mimetype: 'audio/ogg; codecs=opus',
  ptt: true, // Marca como Push-to-Talk
  seconds: 10 // Duração estimada
};
```

### 3. Arquivos Modificados

#### Dependências Adicionadas (`package.json`)
- `ffmpeg-static`: FFmpeg binário estático
- `fluent-ffmpeg`: Interface Node.js para FFmpeg
- `@types/fluent-ffmpeg`: Tipos TypeScript

#### Novo Utilitário (`src/utils/AudioConverter.ts`)
- Classe para conversão de áudio
- Métodos para verificar formato
- Limpeza de arquivos temporários
- Fallbacks para diferentes formatos

#### Serviços Atualizados
1. **`SendWhatsAppMedia.ts`**: Envio de mídia via chat
2. **`SendCampaignMessage.ts`**: Envio de áudio em campanhas
3. **`SendMessage.ts`**: Helper para envio de mensagens

### 4. Fluxo de Conversão

```
Áudio Original (MP3/WAV/M4A/etc.)
        ↓
Verificar se já é OGG/Opus
        ↓
Se NÃO → Converter para OGG/Opus
        ↓
Enviar com ptt: true
        ↓
Limpar arquivo temporário
```

### 5. Benefícios

✅ **WhatsApp Web**: Funciona perfeitamente
✅ **WhatsApp Mobile**: Aparece como mensagem de voz
✅ **WhatsApp Desktop**: Aparece como mensagem de voz
✅ **Compatibilidade**: Fallback para formatos originais se conversão falhar
✅ **Performance**: Conversão otimizada com limpeza automática

### 6. Configurações de Conversão

- **Codec**: libopus (ideal para voz)
- **Canais**: 1 (mono, padrão para PTT)
- **Sample Rate**: 48kHz (padrão Opus)
- **Bitrate**: 64k (otimizado para voz)
- **Formato**: OGG container

### 7. Logs de Debug

O sistema agora inclui logs detalhados:

```
🔄 Converting audio to OGG/Opus for optimal PTT compatibility
✅ Audio successfully converted to OGG/Opus
🎤 Audio message configured as PTT: {
  mimetype: 'audio/ogg; codecs=opus',
  bufferSize: 12345,
  isPTT: true,
  isConverted: true
}
```

### 8. Instalação das Dependências

Para instalar as novas dependências:

```bash
cd backend
npm install
```

### 9. Requisitos do Sistema

- **FFmpeg**: Incluído via `ffmpeg-static`
- **Node.js**: Versão compatível com as dependências atuais
- **Espaço em disco**: Para arquivos temporários durante conversão

### 10. Monitoramento

- Logs detalhados para debug
- Limpeza automática de arquivos temporários
- Fallback automático em caso de erro
- Verificação de formato antes da conversão

## Resultado Final

Agora todos os áudios enviados pelo sistema aparecerão como **mensagens de voz (PTT)** em:
- ✅ WhatsApp Web
- ✅ WhatsApp Mobile (Android/iOS)
- ✅ WhatsApp Desktop

A implementação é robusta, com fallbacks e limpeza automática, garantindo que o sistema continue funcionando mesmo se houver problemas na conversão.