/**
 * Utilitários para manipulação de URLs
 */

/**
 * Converte URL da API para URL do WebSocket
 * @param {string} apiUrl - URL da API (ex: https://app.pepchat.com.br/api)
 * @returns {string} URL para WebSocket (ex: https://app.pepchat.com.br)
 */
export function getWebSocketUrl(apiUrl) {
  if (!apiUrl) {
    throw new Error('URL da API é obrigatória');
  }
  
  // Remove /api do final da URL para conexões WebSocket
  return apiUrl.replace(/\/api$/, '');
}

/**
 * Exemplos de uso:
 * 
 * Desenvolvimento:
 * - API: http://localhost:8080/api
 * - WebSocket: http://localhost:8080
 * 
 * Produção:
 * - API: https://app.pepchat.com.br/api
 * - WebSocket: https://app.pepchat.com.br
 */

// Testes unitários (podem ser executados no console)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🧪 Testando conversão de URLs:');
  
  const tests = [
    {
      input: 'http://localhost:8080/api',
      expected: 'http://localhost:8080',
      description: 'Desenvolvimento local'
    },
    {
      input: 'https://app.pepchat.com.br/api',
      expected: 'https://app.pepchat.com.br',
      description: 'Produção'
    },
    {
      input: 'https://staging.pepchat.com.br/api',
      expected: 'https://staging.pepchat.com.br',
      description: 'Staging'
    }
  ];
  
  tests.forEach(test => {
    const result = getWebSocketUrl(test.input);
    const success = result === test.expected;
    console.log(
      `${success ? '✅' : '❌'} ${test.description}:`,
      `${test.input} → ${result}`
    );
  });
}