// Robust helper to acquire a microphone MediaStream with graceful fallbacks
// - Tries preferred constraints from config
// - Falls back to minimal constraints (audio: true)
// - Enumerates devices and tries available audioinputs more carefully
// Returns: { stream, deviceId, tried, devices }

export async function getMicrophoneStream() {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia não é suportado neste navegador/ambiente. Use HTTPS e um navegador atualizado.');
  }

  const tried = [];

  // Try with configured constraints first
  try {
    const { getMediaConstraints } = await import('../config/audioConfig.js');
    const preferred = getMediaConstraints();
    tried.push({ type: 'preferred', constraints: preferred });
    const stream = await navigator.mediaDevices.getUserMedia(preferred);
    const audioTrack = stream.getAudioTracks()[0];
    return { stream, deviceId: audioTrack?.getSettings?.().deviceId, tried };
  } catch (err) {
    tried.push({ type: 'preferred_error', name: err?.name, message: err?.message });
    // Continue to fallbacks
  }

  // Fallback 1: minimal constraints
  try {
    const minimal = { audio: true, video: false };
    tried.push({ type: 'minimal', constraints: minimal });
    const stream = await navigator.mediaDevices.getUserMedia(minimal);
    const audioTrack = stream.getAudioTracks()[0];
    return { stream, deviceId: audioTrack?.getSettings?.().deviceId, tried };
  } catch (err) {
    tried.push({ type: 'minimal_error', name: err?.name, message: err?.message });
    // Continue to deviceId-based fallback
  }

  // Fallback 2: pick first available audioinput from enumerateDevices
  try {
    if (!navigator.mediaDevices.enumerateDevices) {
      throw new Error('enumerateDevices não é suportado.');
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter((d) => d.kind === 'audioinput');
    if (mics.length === 0) {
      const err = new Error('Nenhum dispositivo de microfone foi encontrado.');
      err.name = 'NotFoundError';
      err.devices = devices;
      err.tried = tried;
      throw err;
    }

    // Try each mic until one works
    for (const mic of mics) {
      try {
        // Avoid using exact on empty/default deviceIds; prefer ideal
        const useIdeal = !mic.deviceId || mic.deviceId === 'default' || mic.deviceId === 'communications';
        const constraints = useIdeal
          ? { audio: { deviceId: { ideal: mic.deviceId } }, video: false }
          : { audio: { deviceId: { exact: mic.deviceId } }, video: false };
        tried.push({ type: 'by_device', constraints });
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        return { stream, deviceId: mic.deviceId, tried, devices };
      } catch (e) {
        tried.push({ type: 'by_device_error', deviceIdTried: mic.deviceId, name: e?.name, message: e?.message });
        // try next device
      }
    }

    const err = new Error('Não foi possível acessar nenhum microfone disponível.');
    err.name = 'NotReadableError';
    err.devices = devices;
    err.tried = tried;
    throw err;
  } catch (finalErr) {
    finalErr.tried = finalErr.tried || tried;
    throw finalErr;
  }
}

export default { getMicrophoneStream };
