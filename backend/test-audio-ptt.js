const fs = require('fs');
const path = require('path');

/**
 * Script de teste para validar arquivos de áudio PTT
 * Execute: node test-audio-ptt.js [caminho-do-arquivo]
 */

function validateAudioFile(filePath) {
  console.log('🔍 TESTE DE VALIDAÇÃO DE ÁUDIO PTT');
  console.log('=====================================');
  
  try {
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      console.log('❌ Arquivo não encontrado:', filePath);
      return false;
    }
    
    // Obter informações do arquivo
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    
    console.log('📁 INFORMAÇÕES DO ARQUIVO:');
    console.log('  Caminho:', filePath);
    console.log('  Extensão:', extension);
    console.log('  Tamanho:', stats.size, 'bytes');
    console.log('  Tamanho MB:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
    console.log('  Buffer length:', buffer.length);
    console.log('  Primeiros 16 bytes (hex):', buffer.slice(0, 16).toString('hex'));
    console.log('  Primeiros 16 bytes (string):', buffer.slice(0, 16).toString());
    
    // Verificar se é OGG válido (assinatura binária)
    const oggSignature = buffer.slice(0, 4).toString();
    const isRealOgg = oggSignature === 'OggS';
    const first10Hex = buffer.slice(0, 10).toString('hex');
    
    console.log('  Assinatura (primeiros 4 bytes):', oggSignature);
    console.log('  Primeiros 10 bytes (hex):', first10Hex);
    console.log('  É OGG REAL:', isRealOgg ? '✅' : '❌');
    
    // Detectar arquivos OGG falsos
    if (!isRealOgg) {
      if (first10Hex.startsWith('00000024667479706973')) {
        console.log('  ❌ DETECTADO: Arquivo MP4/ISOBMFF disfarçado de OGG!');
      } else if (first10Hex.startsWith('494433')) {
        console.log('  ❌ DETECTADO: Arquivo MP3 disfarçado de OGG!');
      } else {
        console.log('  ❌ DETECTADO: Formato desconhecido disfarçado de OGG!');
      }
    }
    
    // Verificar tamanho
    const isValidSize = stats.size > 0 && stats.size <= 16 * 1024 * 1024; // 16MB
    console.log('  Tamanho válido:', isValidSize ? '✅' : '❌');
    
    // Verificar se buffer é válido
    const isValidBuffer = Buffer.isBuffer(buffer) && buffer.length > 0;
    console.log('  Buffer válido:', isValidBuffer ? '✅' : '❌');
    
    console.log('');
    console.log('🎤 CONFIGURAÇÃO PTT RECOMENDADA:');
    console.log('  mimetype: "audio/ogg; codecs=opus"');
    console.log('  ptt: true');
    console.log('  audio: buffer (NÃO { url })');
    console.log('  SEM fileName');
    console.log('  SEM caption');
    
    console.log('');
    console.log('📋 RESULTADO FINAL:');
    const isValid = isRealOgg && isValidSize && isValidBuffer;
    console.log('  Arquivo válido para PTT:', isValid ? '✅ SIM' : '❌ NÃO');
    
    if (!isValid) {
      console.log('');
      console.log('🔧 PROBLEMAS ENCONTRADOS:');
      if (!isRealOgg) console.log('  - Não é um arquivo OGG REAL (assinatura binária incorreta)');
      if (!isValidSize) console.log('  - Tamanho inválido (deve ser > 0 e <= 16MB)');
      if (!isValidBuffer) console.log('  - Buffer inválido');
      
      console.log('');
      console.log('💡 COMO CORRIGIR:');
      console.log('  ffmpeg -i input.mp3 -ar 48000 -ac 1 -c:a libopus -b:a 32k output.ogg');
      console.log('  ⚠️ IMPORTANTE: Arquivo deve ter assinatura "OggS" no início!');
    }
    
    return isValid;
    
  } catch (error) {
    console.log('❌ Erro ao validar arquivo:', error.message);
    return false;
  }
}

// Executar teste
const filePath = process.argv[2];

if (!filePath) {
  console.log('❌ Uso: node test-audio-ptt.js <caminho-do-arquivo>');
  console.log('');
  console.log('Exemplo:');
  console.log('  node test-audio-ptt.js ./uploads/audio.ogg');
  console.log('  node test-audio-ptt.js ./temp/converted.ogg');
  process.exit(1);
}

validateAudioFile(filePath);