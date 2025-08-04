import notificationAudio from './audioImport';

// Utilitário otimizado para som de notificação sem delay
class NotificationSound {
  constructor() {
    this.isEnabled = true;
    this.volume = 0.5;
    this.userInteracted = false;
    this.audioPool = [];
    this.poolSize = 3;
    this.currentIndex = 0;
    
    // Detectar primeira interação do usuário
    this.setupUserInteractionDetection();
    
    // Pré-carregar pool de áudios para reprodução instantânea
    this.preloadAudioPool();
  }

  setupUserInteractionDetection() {
    const events = ['click', 'touchstart', 'keydown'];
    
    const handleFirstInteraction = () => {
      this.userInteracted = true;
      // Remover listeners após primeira interação
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true });
    });
  }

  preloadAudioPool() {
    // Criar pool de objetos Audio pré-carregados
    for (let i = 0; i < this.poolSize; i++) {
      const audio = new Audio(notificationAudio);
      audio.volume = this.volume;
      audio.preload = 'auto';
      
      // Resetar áudio quando terminar para reutilização
      audio.addEventListener('ended', () => {
        audio.currentTime = 0;
      });
      
      this.audioPool.push(audio);
    }
  }

  play() {
    if (!this.isEnabled) return Promise.resolve(false);

    try {
      // Usar próximo áudio disponível do pool
      const audio = this.audioPool[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.poolSize;
      
      // Resetar posição se necessário
      if (audio.currentTime > 0) {
        audio.currentTime = 0;
      }
      
      // Reproduzir imediatamente
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        return playPromise
          .then(() => true)
          .catch(() => false);
      }
      
      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Atualizar volume de todos os áudios no pool
    this.audioPool.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  isAudioEnabled() {
    return this.isEnabled;
  }

  hasUserInteracted() {
    return this.userInteracted;
  }

  // Método para testar o som (usado nas configurações)
  async test() {
    // Forçar interação do usuário se necessário
    if (!this.userInteracted) {
      this.userInteracted = true;
    }
    
    const success = await this.play();
    
    if (!success) {
      throw new Error('Erro ao reproduzir som. Verifique se o arquivo de áudio existe e se o navegador permite reprodução de áudio.');
    }
    
    return success;
  }
}

// Instância singleton
const notificationSound = new NotificationSound();

export default notificationSound;