// Centralized audio recording config to avoid duplications and dynamic import errors

// Default audio options for MediaRecorder (will be validated at runtime)
export const DEFAULT_AUDIO_OPTIONS = { mimeType: 'audio/webm;codecs=opus' };

// Max recording duration safety (in ms)
export const MAX_RECORDING_MS = 220000; // 2 minutes

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
  MAX_RECORDING_MS,
  getMediaConstraints,
};
