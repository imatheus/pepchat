import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Verificar se ffmpeg está disponível
let ffmpegAvailable = false;
let ffmpeg: any = null;
let ffmpegStatic: any = null;

try {
  ffmpeg = require('fluent-ffmpeg');
  ffmpegStatic = require('ffmpeg-static');
  
  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }
  ffmpegAvailable = true;
  console.log('✅ FFmpeg dependencies loaded successfully');
} catch (error) {
  console.warn('⚠️ FFmpeg dependencies not available, using fallback mode:', error.message);
  ffmpegAvailable = false;
}

interface AudioConversionOptions {
  inputPath: string;
  outputPath?: string;
  format?: 'ogg' | 'mp3' | 'wav';
  codec?: 'libopus' | 'libmp3lame' | 'pcm_s16le';
  sampleRate?: number;
  channels?: number;
  bitrate?: string;
}

class AudioConverter {
  /**
   * Verifica se as dependências do FFmpeg estão disponíveis
   */
  static isFFmpegAvailable(): boolean {
    return ffmpegAvailable;
  }

  /**
   * Obtém o melhor mimetype para áudio baseado na extensão
   */
  static getBestMimetype(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.ogg':
        return 'audio/ogg; codecs=opus';
      case '.wav':
        return 'audio/wav';
      case '.mp4':
      case '.m4a':
        return 'audio/mp4';
      case '.mp3':
        return 'audio/mpeg';
      case '.aac':
        return 'audio/aac';
      default:
        return 'audio/mp4'; // Fallback mais compatível
    }
  }
  /**
   * Converte áudio para formato OGG/Opus (ideal para PTT no WhatsApp)
   */
  static async convertToOggOpus(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '.ogg');
    
    if (!ffmpegAvailable) {
      console.warn('⚠️ FFmpeg not available, using original file without conversion');
      // Se o arquivo de saída é diferente do de entrada, copiar
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('libopus') // Codec Opus (OBRIGATÓRIO para PTT)
        .audioChannels(1) // Mono (OBRIGATÓRIO para PTT - WhatsApp ignora PTT estéreo)
        .audioFrequency(48000) // 48kHz (padrão Opus para WhatsApp)
        .audioBitrate('32k') // Bitrate reduzido para PTT (32k é ideal para voz)
        .format('ogg') // Container OGG
        .outputOptions([
          '-avoid_negative_ts', 'make_zero', // Evitar timestamps negativos
          '-fflags', '+genpts', // Gerar timestamps corretos
          '-application', 'voip', // Otimizar Opus para voz (VOIP)
          '-compression_level', '10', // Máxima compressão
          '-frame_duration', '20', // Frame duration otimizado para voz
          '-packet_loss', '1' // Tolerância a perda de pacotes
        ])
        .on('start', (commandLine) => {
          console.log('🔄 Starting audio conversion:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('⏳ Conversion progress:', Math.round(progress.percent || 0) + '%');
        })
        .on('end', () => {
          console.log('✅ Audio conversion completed:', finalOutputPath);
          
          // 🔍 DIAGNÓSTICO: Verificar arquivo convertido
          try {
            const stats = fs.statSync(finalOutputPath);
            const buffer = fs.readFileSync(finalOutputPath);
            
            console.log('🔍 DIAGNÓSTICO CONVERSÃO:', {
              outputPath: finalOutputPath,
              fileExists: fs.existsSync(finalOutputPath),
              fileSize: stats.size,
              fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
              bufferLength: buffer.length,
              first10Bytes: buffer.slice(0, 10).toString('hex'),
              isValidOgg: buffer.slice(0, 4).toString() === 'OggS'
            });
            
            if (stats.size === 0) {
              throw new Error('Arquivo convertido está vazio!');
            }
            
          } catch (diagError) {
            console.error('❌ Erro no diagnóstico pós-conversão:', diagError);
          }
          
          resolve(finalOutputPath);
        })
        .on('error', (err) => {
          console.error('❌ Audio conversion failed:', err);
          console.error('🔍 DETALHES DO ERRO FFMPEG:', {
            inputPath,
            outputPath: finalOutputPath,
            inputExists: fs.existsSync(inputPath),
            errorMessage: err.message,
            errorStack: err.stack
          });
          reject(err);
        })
        .save(finalOutputPath);
    });
  }

  /**
   * Converte áudio para formato específico
   */
  static async convertAudio(options: AudioConversionOptions): Promise<string> {
    const {
      inputPath,
      outputPath,
      format = 'ogg',
      codec = 'libopus',
      sampleRate = 48000,
      channels = 1,
      bitrate = '64k'
    } = options;

    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), `.${format}`);
    
    if (!ffmpegAvailable) {
      console.warn('⚠️ FFmpeg not available, using original file without conversion');
      // Se o arquivo de saída é diferente do de entrada, copiar
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .audioCodec(codec)
        .audioChannels(channels)
        .audioFrequency(sampleRate)
        .audioBitrate(bitrate)
        .format(format);

      command
        .on('start', (commandLine) => {
          console.log('🔄 Starting custom audio conversion:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('⏳ Conversion progress:', Math.round(progress.percent || 0) + '%');
        })
        .on('end', () => {
          console.log('✅ Custom audio conversion completed:', finalOutputPath);
          resolve(finalOutputPath);
        })
        .on('error', (err) => {
          console.error('❌ Custom audio conversion failed:', err);
          reject(err);
        })
        .save(finalOutputPath);
    });
  }

  /**
   * Verifica se um arquivo é de áudio
   */
  static isAudioFile(filePath: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
    const extension = path.extname(filePath).toLowerCase();
    return audioExtensions.includes(extension);
  }

  /**
   * Obtém informações sobre um arquivo de áudio
   */
  static async getAudioInfo(filePath: string): Promise<any> {
    if (!ffmpegAvailable) {
      // Fallback: retornar informações básicas baseadas na extensão
      const extension = path.extname(filePath).toLowerCase();
      return {
        streams: [{
          codec_type: 'audio',
          codec_name: extension === '.ogg' ? 'opus' : 'unknown'
        }]
      };
    }
    
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  /**
   * Verifica se o arquivo já está no formato OGG/Opus REAL
   */
  static async isOggOpus(filePath: string): Promise<boolean> {
    try {
      // SEMPRE verificar assinatura binária primeiro
      const isRealOgg = this.isRealOggFile(filePath);
      
      if (!isRealOgg) {
        console.log('❌ Arquivo não é OGG real (assinatura binária incorreta)');
        return false;
      }
      
      if (!ffmpegAvailable) {
        console.log('⚠️ FFmpeg não disponível, mas arquivo tem assinatura OGG válida');
        console.log('📝 Para garantir que é Opus, instale FFmpeg: npm install');
        // Assumir que é válido se tem assinatura OGG correta
        return true;
      }
      
      const info = await this.getAudioInfo(filePath);
      const audioStream = info.streams.find((stream: any) => stream.codec_type === 'audio');
      
      const isValidOpus = audioStream && audioStream.codec_name === 'opus';
      
      console.log('🔍 Verificação OGG/Opus completa:', {
        isRealOgg,
        hasOpusCodec: isValidOpus,
        codecName: audioStream?.codec_name,
        channels: audioStream?.channels,
        sampleRate: audioStream?.sample_rate
      });
      
      return isRealOgg && isValidOpus;
    } catch (error) {
      console.error('Error checking audio format:', error);
      return false;
    }
  }

  /**
   * Verifica se o arquivo é realmente OGG pela assinatura binária
   */
  static isRealOggFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        console.log('❌ Arquivo não existe:', filePath);
        return false;
      }
      
      const buffer = fs.readFileSync(filePath, { start: 0, end: 9 });
      const signature = buffer.slice(0, 4).toString();
      const first10Hex = buffer.toString('hex');
      
      console.log('🔍 Assinatura do arquivo:', {
        filePath: path.basename(filePath),
        first4Bytes: buffer.slice(0, 4).toString('hex'),
        first10Hex,
        signature,
        isOggS: signature === 'OggS'
      });
      
      // Detectar tipos de arquivo falsos
      if (signature !== 'OggS') {
        if (first10Hex.startsWith('00000024667479706973')) {
          console.log('❌ DETECTADO: Arquivo MP4/ISOBMFF disfarçado de OGG!');
        } else if (first10Hex.startsWith('494433')) {
          console.log('❌ DETECTADO: Arquivo MP3 disfarçado de OGG!');
        } else if (first10Hex.startsWith('ffd8ff')) {
          console.log('❌ DETECTADO: Arquivo JPEG disfarçado de OGG!');
        } else {
          console.log('❌ DETECTADO: Formato desconhecido disfarçado de OGG!');
          console.log('📝 Primeiros 10 bytes:', first10Hex);
        }
        
        console.log('⚠️ Para corrigir, instale FFmpeg: npm install');
        return false;
      }
      
      console.log('✅ Arquivo é OGG real (assinatura válida)');
      return true;
    } catch (error) {
      console.error('Erro ao verificar assinatura OGG:', error);
      return false;
    }
  }

  /**
   * Limpa arquivos temporários
   */
  static cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Temporary file cleaned up:', filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  /**
   * Valida se o arquivo de áudio é adequado para PTT
   */
  static validateAudioForPTT(filePath: string): { valid: boolean; error?: string } {
    try {
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'Arquivo não encontrado' };
      }
      
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // WhatsApp tem limite de 16MB para áudios
      if (fileSizeMB > 16) {
        return { valid: false, error: `Arquivo muito grande: ${fileSizeMB.toFixed(2)}MB (máx: 16MB)` };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Erro ao validar arquivo: ${error}` };
    }
  }

  /**
   * Converte áudio para PTT (Push-to-Talk) otimizado para WhatsApp
   */
  static async convertToPTT(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '_ptt.ogg');
    
    // Validar arquivo antes da conversão
    const validation = this.validateAudioForPTT(inputPath);
    if (!validation.valid) {
      throw new Error(`Validação falhou: ${validation.error}`);
    }
    
    // Verificar se já está no formato correto
    if (await this.isOggOpus(inputPath)) {
      console.log('✅ Audio already in OGG/Opus format, copying...');
      fs.copyFileSync(inputPath, finalOutputPath);
      return finalOutputPath;
    }

    if (!ffmpegAvailable) {
      console.warn('⚠️ FFmpeg not available, using original file for PTT without conversion');
      // Se o arquivo de saída é diferente do de entrada, copiar
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }

    // Converter para OGG/Opus otimizado para PTT
    return this.convertToOggOpus(inputPath, finalOutputPath);
  }
}

export default AudioConverter;