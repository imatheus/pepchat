// Centralized audio recording config to avoid duplications and dynamic import errors

// Default audio options for MediaRecorder
export const DEFAULT_AUDIO_OPTIONS = { mimeType: 'audio/webm' };

// Function to get constraints for getUserMedia
export const getMediaConstraints = () => ({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000 // browsers may adjust, that's fine
  },
  video: false,
});

export default {
  DEFAULT_AUDIO_OPTIONS,
  getMediaConstraints,
};
