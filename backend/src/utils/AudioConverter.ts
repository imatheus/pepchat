import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import ffmpegFluent from 'fluent-ffmpeg';
import { getAudioConfig, getMimetypeForFormat, shouldSendAsPTT } from '../config/audio.config';

const execAsync = promisify(exec);

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

const AUDIO_CONFIG: AudioConversionConfig = {
  ptt: {
    sampleRate: parseInt(process.env.PTT_SAMPLE_RATE || '16000'),
    bitrate: process.env.PTT_BITRATE || '64k',
    channels: parseInt(process.env.PTT_CHANNELS || '1'),
    codec: process.env.PTT_CODEC || 'libopus',
    format: process.env.PTT_FORMAT || 'ogg',
    outputOptions: [
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+genpts',
      '-application', 'voip',
    ]
  },
  general: {
    sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000'),
    bitrate: process.env.AUDIO_BITRATE || '64k',
    channels: parseInt(process.env.AUDIO_CHANNELS || '1'),
    codec: process.env.AUDIO_CODEC || 'libopus',
    format: process.env.AUDIO_FORMAT || 'ogg'
  }
};

const IOS_AUDIO_CONFIG = {
  sampleRate: parseInt(process.env.IOS_SAMPLE_RATE || '16000'),
  bitrate: process.env.IOS_BITRATE || '64k',
  channels: parseInt(process.env.IOS_CHANNELS || '1'),
  codec: 'aac',
  format: 'm4a',
  outputOptions: [
    '-movflags', '+faststart',
    '-profile:a', 'aac_low'
  ]
};

const MP3_AUDIO_CONFIG = {
  sampleRate: parseInt(process.env.MP3_SAMPLE_RATE || '16000'),
  bitrate: process.env.MP3_BITRATE || '64k',
  channels: parseInt(process.env.MP3_CHANNELS || '1'),
  codec: 'libmp3lame',
  format: 'mp3',
  outputOptions: ['-q:a', '2']
};

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
} catch (error) {
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
  static isFFmpegAvailable(): boolean {
    return ffmpegAvailable;
  }

  static getAudioConfig(): AudioConversionConfig {
    return AUDIO_CONFIG;
  }

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

      if (config.outputOptions && config.outputOptions.length > 0) {
        command.outputOptions(config.outputOptions);
      }

      command
        .on('start', () => {})
        .on('progress', () => {})
        .on('end', () => {
          try {
            const stats = fs.statSync(config.outputPath);
            const buffer = fs.readFileSync(config.outputPath);
            if (stats.size === 0 || !buffer || buffer.length === 0) {
              throw new Error('Arquivo convertido está vazio!');
            }
          } catch (diagError) {
            // silencioso
          }
          resolve(config.outputPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .save(config.outputPath);
    });
  }

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
        return 'audio/mp4';
    }
  }

  static async convertToOggOpus(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '.ogg');
    if (!ffmpegAvailable) {
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }

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

  static async convertToiOSCompatible(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '_ios.ogg');
    if (!ffmpegAvailable) {
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }

    const config: FFmpegCommandConfig = {
      inputPath,
      outputPath: finalOutputPath,
      codec: 'libopus',
      channels: 1,
      sampleRate: 16000,
      bitrate: '64k',
      format: 'ogg',
      outputOptions: ['-application', 'voip']
    };

    return this.executeFFmpegConversion(config);
  }

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
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }

    const config: FFmpegCommandConfig = {
      inputPath,
      outputPath: finalOutputPath,
      codec,
      channels,
      sampleRate,
      bitrate,
      format
    };

    return this.executeFFmpegConversion(config);
  }

  static isAudioFile(filePath: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
    const extension = path.extname(filePath).toLowerCase();
    return audioExtensions.includes(extension);
  }

  static async getAudioInfo(filePath: string): Promise<any> {
    if (!ffmpegAvailable) {
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

  static async isOggOpus(filePath: string, silent: boolean = false): Promise<boolean> {
    try {
      const isRealOgg = this.isRealOggFile(filePath, silent);
      if (!isRealOgg) {
        return false;
      }
      if (!ffmpegAvailable) {
        return true;
      }
      const info = await this.getAudioInfo(filePath);
      const audioStream = info.streams?.find((stream) => stream.codec_type === 'audio');
      const isValidOpus = audioStream && audioStream.codec_name === 'opus';
      return isRealOgg && isValidOpus;
    } catch (error) {
      return false;
    }
  }

  static isRealOggFile(filePath: string, silent: boolean = false): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }
      const fullBuffer = fs.readFileSync(filePath);
      if (fullBuffer.length < 4) {
        return false;
      }
      const buffer = fullBuffer.slice(0, 10);
      const signature = buffer.slice(0, 4).toString();
      const first10Hex = buffer.toString('hex');
      if (signature !== 'OggS') {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  static cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // silencioso
    }
  }

  static validateAudioForPTT(filePath: string): { valid: boolean; error?: string } {
    try {
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'Arquivo não encontrado' };
      }
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      if (fileSizeMB > 16) {
        return { valid: false, error: `Arquivo muito grande: ${fileSizeMB.toFixed(2)}MB (máx: 16MB)` };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Erro ao validar arquivo: ${error}` };
    }
  }

  static async convertToPTT(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '_ptt.ogg');
    const validation = this.validateAudioForPTT(inputPath);
    if (!validation.valid) {
      throw new Error(`Validação falhou: ${validation.error}`);
    }
    if (await this.isOggOpus(inputPath, true)) {
      fs.copyFileSync(inputPath, finalOutputPath);
      return finalOutputPath;
    }
    if (!ffmpegAvailable) {
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }
    return this.convertToiOSCompatible(inputPath, finalOutputPath);
  }

  static async convertToAAC(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '.m4a');
    if (!ffmpegAvailable) {
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }
    const config: FFmpegCommandConfig = {
      inputPath,
      outputPath: finalOutputPath,
      codec: 'aac',
      channels: 1,
      sampleRate: 16000,
      bitrate: '64k',
      format: 'm4a',
      outputOptions: ['-movflags', '+faststart', '-profile:a', 'aac_low']
    };
    return this.executeFFmpegConversion(config);
  }

  static async convertToMP3(inputPath: string, outputPath?: string): Promise<string> {
    const finalOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '.mp3');
    if (!ffmpegAvailable) {
      if (finalOutputPath !== inputPath) {
        fs.copyFileSync(inputPath, finalOutputPath);
      }
      return finalOutputPath;
    }
    const config: FFmpegCommandConfig = {
      inputPath,
      outputPath: finalOutputPath,
      codec: 'libmp3lame',
      channels: 1,
      sampleRate: 16000,
      bitrate: '64k',
      format: 'mp3',
      outputOptions: ['-q:a', '2']
    };
    return this.executeFFmpegConversion(config);
  }

  static async convertWithFallback(inputPath: string, outputPath?: string): Promise<{ path: string; format: string; mimetype: string }> {
    const baseOutputPath = outputPath || inputPath.replace(path.extname(inputPath), '');
    try {
      const aacPath = await this.convertToAAC(inputPath, `${baseOutputPath}.m4a`);
      const stats = fs.statSync(aacPath);
      const sizeKB = stats.size / 1024;
      if (sizeKB > 2) {
        return { path: aacPath, format: 'aac', mimetype: 'audio/mp4' };
      }
    } catch {}
    try {
      const mp3Path = await this.convertToMP3(inputPath, `${baseOutputPath}.mp3`);
      const stats = fs.statSync(mp3Path);
      const sizeKB = stats.size / 1024;
      if (sizeKB > 2) {
        return { path: mp3Path, format: 'mp3', mimetype: 'audio/mpeg' };
      }
    } catch {}
    try {
      const oggPath = await this.convertToOggOpus(inputPath, `${baseOutputPath}.ogg`);
      const stats = fs.statSync(oggPath);
      const sizeKB = stats.size / 1024;
      if (sizeKB > 2) {
        return { path: oggPath, format: 'ogg', mimetype: 'audio/ogg; codecs=opus' };
      }
    } catch {}
    return { path: inputPath, format: 'original', mimetype: this.getBestMimetype(inputPath) };
  }

  static async convertToPTTNew(inputPath: string, outputPath?: string): Promise<{ path: string; format: string; mimetype: string }> {
    if (!ffmpegAvailable) {
      return { path: inputPath, format: 'original', mimetype: this.getBestMimetype(inputPath) };
    }
    return this.convertWithFallback(inputPath, outputPath);
  }
}

export default AudioConverter;
