// Map technical microphone errors to friendly, actionable messages for end users

export function getFriendlyMicErrorMessage(err) {
  const name = err?.name || '';
  const message = err?.message || '';

  switch (name) {
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhum microfone Encontrado.';
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permissão para usar o microfone negada. Clique no cadeado na barra do navegador e permita o acesso ao microfone.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Não foi possível acessar o microfone. Ele pode estar em uso por outro aplicativo (Zoom/Teams/etc). Feche outros apps e tente novamente.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'O dispositivo de áudio não atende aos requisitos de gravação. Tente outro microfone ou remova dispositivos de áudio virtuais.';
    case 'SecurityError':
      return 'A gravação de áudio exige um contexto seguro. Acesse via HTTPS ou localhost.';
    case 'AbortError':
      return 'A captura de áudio foi interrompida. Tente iniciar a gravação novamente.';
    default:
      return 'Erro ao acessar o microfone: ' + message;
  }
}

export default { getFriendlyMicErrorMessage };
