/**
 * Configurações de áudio para compatibilidade iOS/Android
 * 
 * Este arquivo centraliza todas as configurações de conversão de áudio
 * para facilitar ajustes e troubleshooting de problemas de compatibilidade
 */

export interface AudioConfig {
  // Configurações gerais
  defaultBitrate: string;
  defaultSampleRate: number;
  defaultChannels: number;
  
  // Configurações específicas por formato
  formats: {
    aac: {
      codec: string;
      bitrate: string;
      sampleRate: number;
      channels: number;
      format: string;
      outputOptions: string[];
    };
    mp3: {
      codec: string;
      bitrate: string;
      sampleRate: number;
      channels: number;
      format: string;
      outputOptions: string[];
    };
    ogg: {
      codec: string;
      bitrate: string;
      sampleRate: number;
      channels: number;
      format: string;
      outputOptions: string[];
    };
  };
  
  // Configurações de validação
  validation: {
    maxSizeMB: number;
    minSizeKB: number;
    supportedExtensions: string[];
  };
  
  // Estratégia de conversão
  strategy: {
    preferredFormats: string[]; // Ordem de preferência para conversão
    enableFallback: boolean;
    enablePTTForOgg: boolean; // Enviar OGG como PTT
    enablePTTForAAC: boolean; // Enviar AAC como PTT
    enablePTTForMP3: boolean; // Enviar MP3 como PTT
  };
}

// Configuração padrão otimizada para iOS
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  defaultBitrate: '96k', // Aumentado para melhorar a qualidade
  defaultSampleRate: 24000,
  defaultChannels: 1,
  
  formats: {
    aac: {
      codec: 'aac',
      bitrate: process.env.AAC_BITRATE || '64k',
      sampleRate: parseInt(process.env.AAC_SAMPLE_RATE || '16000'),
      channels: parseInt(process.env.AAC_CHANNELS || '1'),
      format: 'm4a',
      outputOptions: [
        '-movflags', '+faststart', // Otimização para streaming
        '-profile:a', 'aac_low'    // Perfil AAC de baixa complexidade
      ]
    },
    mp3: {
      codec: 'libmp3lame',
      bitrate: process.env.MP3_BITRATE || '128k',
      sampleRate: parseInt(process.env.MP3_SAMPLE_RATE || '24000'),
      channels: parseInt(process.env.MP3_CHANNELS || '1'),
      format: 'mp3',
      outputOptions: [
        '-q:a', '2' // Qualidade VBR alta
      ]
    },
    ogg: {
      codec: 'libopus',
      bitrate: process.env.OGG_BITRATE || '96k',
      sampleRate: parseInt(process.env.OGG_SAMPLE_RATE || '24000'),
      channels: parseInt(process.env.OGG_CHANNELS || '1'),
      format: 'ogg',
      outputOptions: [
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts',
        '-application', 'voip'
      ]
    }
  },
  
  validation: {
    maxSizeMB: 16, // Limite do WhatsApp
    minSizeKB: 2,  // Mínimo para evitar arquivos corrompidos
    supportedExtensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma']
  },
  
  strategy: {
    preferredFormats: ['aac', 'mp3', 'ogg'], // AAC primeiro (melhor para iOS)
    enableFallback: true,
    enablePTTForOgg: true,  // OGG como PTT (padrão WhatsApp)
    enablePTTForAAC: false, // AAC enviar como áudio normal
    enablePTTForMP3: false  // MP3 enviar como áudio normal
  }
};

/**
 * Obtém a configuração de áudio atual
 * Permite override via variáveis de ambiente
 */
export function getAudioConfig(): AudioConfig {
  return {
    ...DEFAULT_AUDIO_CONFIG,
    // Permitir override de configurações via env vars
    defaultBitrate: process.env.AUDIO_DEFAULT_BITRATE || DEFAULT_AUDIO_CONFIG.defaultBitrate,
    defaultSampleRate: parseInt(process.env.AUDIO_DEFAULT_SAMPLE_RATE || DEFAULT_AUDIO_CONFIG.defaultSampleRate.toString()),
    defaultChannels: parseInt(process.env.AUDIO_DEFAULT_CHANNELS || DEFAULT_AUDIO_CONFIG.defaultChannels.toString()),
  };
}

/**
 * Obtém o mimetype correto para cada formato
 */
export function getMimetypeForFormat(format: string): string {
  const mimetypes: Record<string, string> = {
    'aac': 'audio/mp4',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg; codecs=opus',
    'm4a': 'audio/mp4',
    'wav': 'audio/wav',
    'original': 'audio/mp4' // Fallback seguro
  };
  
  return mimetypes[format] || mimetypes['original'];
}

/**
 * Verifica se um formato deve ser enviado como PTT
 */
export function shouldSendAsPTT(format: string): boolean {
  const config = getAudioConfig();
  
  switch (format) {
    case 'aac':
    case 'm4a':
      return config.strategy.enablePTTForAAC;
    case 'mp3':
      return config.strategy.enablePTTForMP3;
    case 'ogg':
      return config.strategy.enablePTTForOgg;
    default:
      return true; // Padrão para formatos desconhecidos
  }
}

export default DEFAULT_AUDIO_CONFIG;