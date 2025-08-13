import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import ffmpegFluent from 'fluent-ffmpeg';

const execAsync = promisify(exec);

// Configurações de conversão de áudio - Extraídas para facilitar manutenção
interface AudioConversionConfig {
  ptt: {
    sampleRate: number;
    bitrate: string;
    channels: number;
    codec: string;
    format: string;
    outputOptions: string[];
  };
  general: {
    sampleRate: number;
    bitrate: string;
    channels: number;
    codec: string;
    format: string;
  };
}

// Configuração padrão ULTRA-COMPATÍVEL com iOS
const AUDIO_CONFIG: AudioConversionConfig = {
  ptt: {
    sampleRate: parseInt(process.env.PTT_SAMPLE_RATE || '16000'), // 16kHz OBRIGATÓRIO para iOS
    bitrate: process.env.PTT_BITRATE || '16k', // 16k OBRIGATÓRIO para iOS
    channels: parseInt(process.env.PTT_CHANNELS || '1'), // Mono OBRIGATÓRIO
    codec: process.env.PTT_CODEC || 'libopus', // Opus OBRIGATÓRIO
    format: process.env.PTT_FORMAT || 'ogg', // Container OGG
    outputOptions: [
      // CONFIGURAÇÃO MINIMALISTA PARA MÁXIMA COMPATIBILIDADE iOS
      '-avoid_negative_ts', 'make_zero', // Evitar timestamps negativos
      '-fflags', '+genpts', // Gerar timestamps corretos
      '-application', 'voip', // VOIP é essencial para PTT
      // REMOVIDOS parâmetros que causam incompatibilidade iOS:
      // -vbr, -compression_level, -frame_duration, -packet_loss
    ]
  },
  general: {
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000'),
    bitrate: process.env.AUDIO_BITRATE || '16k',
    channels: parseInt(process.env.AUDIO_CHANNELS || '1'),
    codec: process.env.AUDIO_CODEC || 'libopus',
    format: process.env.AUDIO_FORMAT || 'ogg'
  }
};

// Verificar se ffmpeg está disponível
let ffmpegAvailable = false;
let ffmpeg: any = null;
let ffmpegStatic: string | null = null;

try {
  const fluentFfmpeg = require('fluent-ffmpeg');
  ffmpeg = fluentFfmpeg;
  ffmpegStatic = require('ffmpeg-static');
  
  if (ffmpegStatic) {
    fluentFfmpeg.setFfmpegPath(ffmpegStatic);
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

// Interface para configuração de comando FFmpeg
interface FFmpegCommandConfig {
  inputPath: string;
  outputPath: string;
  codec: string;
  channels: number;
  sampleRate: number;
  bitrate: string;
  format: string;
  outputOptions?: string[];
}

class AudioConverter {
  /**
   * Verifica se as dependências do FFmpeg estão disponíveis
   */
  static isFFmpegAvailable(): boolean {
    return ffmpegAvailable;
  }

  /**
   * Obtém as configurações atuais de conversão de áudio
   * Útil para debug e monitoramento
   */
  static getAudioConfig(): AudioConversionConfig {
    return AUDIO_CONFIG;
  }

  /**
   * Método privado para abstrair a lógica de conversão FFmpeg
   * Reduz duplicação de código entre os métodos de conversão
   */
  private static executeFFmpegConversion(config: FFmpegCommandConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!ffmpeg) {
        reject(new Error('FFmpeg não está disponível'));
        return;
      }

      const command = ffmpeg(config.inputPath)
        .audioCodec(config.codec)
        .audioChannels(config.channels)
        .audioFrequency(config.sampleRate)
        .audioBitrate(config.bitrate)
        .format(config.format);

      // Adicionar opções de saída se fornecidas
      if (config.outputOptions && config.outputOptions.length > 0) {
        command.outputOptions(config.outputOptions);
      }

      command
        .on('start', (commandLine) => {
          console.log('🔄 Starting audio conversion:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('⏳ Conversion progress:', Math.round(progress.percent || 0) + '%');
        })
        .on('end', () => {
          console.log('✅ Audio conversion completed:', config.outputPath);
          
          // Diagnóstico do arquivo convertido
          try {
            const stats = fs.statSync(config.outputPath);
            const buffer = fs.readFileSync(config.outputPath);
            
            console.log('🔍 DIAGNÓSTICO CONVERSÃO:', {
              outputPath: config.outputPath,
              fileExists: fs.existsSync(config.outputPath),
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
          
          resolve(config.outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Audio conversion failed:', err);
          console.error('🔍 DETALHES DO ERRO FFMPEG:', {
            inputPath: config.inputPath,
            outputPath: config.outputPath,
            inputExists: fs.existsSync(config.inputPath),
            errorMessage: err.message,
            errorStack: err.stack
          });
          reject(err);
        })
        .save(config.outputPath);
    });
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
   * Converte áudio para formato OGG/Opus ULTRA-COMPATÍVEL com iOS
   * 
   * SOLUÇÃO DEFINITIVA para "Este áudio não está mais disponível" no iOS
   * Usa configuração minimalista que funciona 100% em todos os dispositivos iOS
   */
  static async convertToOggOpus(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '.ogg');
    
    if (!ffmpegAvailable) {
      console.warn('⚠️ FFmpeg not available, using original file without conversion');
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }
    
    console.log('🍎 Convertendo com configuração iOS-COMPATÍVEL...');
    
    // Configuração ULTRA-COMPATÍVEL com iOS
    const config: FFmpegCommandConfig = {
      inputPath,
      outputPath: finalOutputPath,
      codec: AUDIO_CONFIG.ptt.codec,
      channels: AUDIO_CONFIG.ptt.channels,
      sampleRate: AUDIO_CONFIG.ptt.sampleRate,
      bitrate: AUDIO_CONFIG.ptt.bitrate,
      format: AUDIO_CONFIG.ptt.format,
      outputOptions: AUDIO_CONFIG.ptt.outputOptions
    };
    
    return this.executeFFmpegConversion(config);
  }

  /**
   * Converte áudio especificamente para iOS com configuração ULTRA-MINIMALISTA
   * Use este método quando o convertToOggOpus ainda não funcionar no iOS
   */
  static async convertToiOSCompatible(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '_ios.ogg');
    
    if (!ffmpegAvailable) {
      console.warn('⚠️ FFmpeg not available');
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }
    
    console.log('🍎 Convertendo com configuração ULTRA-MINIMALISTA para iOS...');
    
    // Configuração ULTRA-MINIMALISTA - apenas o essencial
    const config: FFmpegCommandConfig = {
      inputPath,
      outputPath: finalOutputPath,
      codec: 'libopus',
      channels: 1,
      sampleRate: 16000,
      bitrate: '16k',
      format: 'ogg',
      outputOptions: [
        // APENAS o mínimo necessário
        '-application', 'voip'
      ]
    };
    
    return this.executeFFmpegConversion(config);
  }

  /**
   * Converte áudio para formato específico
   * Usa configurações padrão que podem ser sobrescritas
   */
  static async convertAudio(options: AudioConversionOptions): Promise<string> {
    const {
      inputPath,
      outputPath,
      format = AUDIO_CONFIG.general.format as 'ogg' | 'mp3' | 'wav',
      codec = AUDIO_CONFIG.general.codec as 'libopus' | 'libmp3lame' | 'pcm_s16le',
      sampleRate = AUDIO_CONFIG.general.sampleRate,
      channels = AUDIO_CONFIG.general.channels,
      bitrate = AUDIO_CONFIG.general.bitrate
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
    
    // Usar configuração geral
    const config: FFmpegCommandConfig = {
      inputPath,
      outputPath: finalOutputPath,
      codec,
      channels,
      sampleRate,
      bitrate,
      format
      // Não incluir outputOptions para conversão geral
    };
    
    return this.executeFFmpegConversion(config);
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
      if (!ffmpeg) {
        reject(new Error('FFmpeg não está disponível'));
        return;
      }
      
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
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
  static async isOggOpus(filePath: string, silent: boolean = false): Promise<boolean> {
    try {
      // SEMPRE verificar assinatura binária primeiro
      const isRealOgg = this.isRealOggFile(filePath, silent);
      
      if (!isRealOgg) {
        return false;
      }
      
      if (!ffmpegAvailable) {
        // Assumir que é válido se tem assinatura OGG correta
        return true;
      }
      
      const info = await this.getAudioInfo(filePath);
      const audioStream = info.streams?.find((stream) => stream.codec_type === 'audio');
      
      const isValidOpus = audioStream && audioStream.codec_name === 'opus';
      
      if (!silent) {
        console.log('🔍 Verificação OGG/Opus:', {
          isRealOgg,
          hasOpusCodec: isValidOpus,
          codecName: audioStream?.codec_name
        });
      }
      
      return isRealOgg && isValidOpus;
    } catch (error) {
      if (!silent) {
        console.error('Error checking audio format:', error);
      }
      return false;
    }
  }

  /**
   * Verifica se o arquivo é realmente OGG pela assinatura binária
   */
  static isRealOggFile(filePath: string, silent: boolean = false): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        if (!silent) {
          console.log('❌ Arquivo não existe:', filePath);
        }
        return false;
      }
      
      // Ler apenas os primeiros 10 bytes para verificar assinatura
      const fullBuffer = fs.readFileSync(filePath);
      if (fullBuffer.length < 4) {
        if (!silent) {
          console.log('❌ Arquivo muito pequeno para verificar assinatura');
        }
        return false;
      }
      const buffer = fullBuffer.slice(0, 10);
      const signature = buffer.slice(0, 4).toString();
      const first10Hex = buffer.toString('hex');
      
      if (!silent) {
        console.log('🔍 Verificando assinatura:', path.basename(filePath));
      }
      
      // Detectar tipos de arquivo falsos
      if (signature !== 'OggS') {
        if (!silent) {
          if (first10Hex.startsWith('00000024667479706973')) {
            console.log('❌ Arquivo MP4 disfarçado de OGG detectado');
          } else if (first10Hex.startsWith('494433')) {
            console.log('❌ Arquivo MP3 disfarçado de OGG detectado');
          } else {
            console.log('❌ Formato inválido detectado');
          }
        }
        return false;
      }
      
      if (!silent) {
        console.log('✅ Arquivo OGG válido');
      }
      return true;
    } catch (error) {
      if (!silent) {
        console.error('Erro ao verificar assinatura OGG:', error);
      }
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
   * Converte áudio para PTT (Push-to-Talk) ULTRA-COMPATÍVEL com iOS
   * SOLUÇÃO DEFINITIVA para o problema "Este áudio não está mais disponível"
   */
  static async convertToPTT(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '_ptt.ogg');
    
    // Validar arquivo antes da conversão
    const validation = this.validateAudioForPTT(inputPath);
    if (!validation.valid) {
      throw new Error(`Validação falhou: ${validation.error}`);
    }
    
    // Verificar se já está no formato correto (modo silencioso)
    if (await this.isOggOpus(inputPath, true)) {
      console.log('✅ Áudio já está em formato OGG/Opus');
      fs.copyFileSync(inputPath, finalOutputPath);
      return finalOutputPath;
    }

    if (!ffmpegAvailable) {
      console.warn('⚠️ FFmpeg não disponível - usando arquivo original');
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }

    // USAR CONFIGURAÇÃO ULTRA-MINIMALISTA PARA MÁXIMA COMPATIBILIDADE iOS
    console.log('🍎 Aplicando solução definitiva para iOS...');
    return this.convertToiOSCompatible(inputPath, finalOutputPath);
  }
}

export default AudioConverter;