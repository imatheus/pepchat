// Utilities to detect audio recording support in the browser/environment

export function getAudioSupportStatus() {
  if (typeof window === 'undefined') {
    return { secure: false, mediaDevices: false, mediaRecorder: false, supported: false };
  }
  const secure = Boolean(window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost');
  const mediaDevices = !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const mediaRecorder = 'MediaRecorder' in window;
  return {
    secure,
    mediaDevices,
    mediaRecorder,
    supported: secure && mediaDevices && mediaRecorder,
  };
}

export function isAudioRecordingAvailable() {
  return getAudioSupportStatus().supported;
}

export default { getAudioSupportStatus, isAudioRecordingAvailable };
