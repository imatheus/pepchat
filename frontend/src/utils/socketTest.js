// Utility para testar conectividade WebSocket em produção
import { io } from 'socket.io-client';

export const testSocketConnection = async (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const testSocket = io(url, {
      ...options,
      timeout: 10000,
      forceNew: true
    });

    const result = {
      url,
      success: false,
      transport: null,
      error: null,
      latency: null,
      timestamp: new Date().toISOString()
    };

    const startTime = Date.now();

    testSocket.on('connect', () => {
      result.success = true;
      result.transport = testSocket.io.engine.transport.name;
      result.latency = Date.now() - startTime;
      
      console.log('✅ Socket test successful:', result);
      testSocket.disconnect();
      resolve(result);
    });

    testSocket.on('connect_error', (error) => {
      result.error = {
        message: error.message,
        description: error.description,
        type: error.type
      };
      
      console.error('❌ Socket test failed:', result);
      testSocket.disconnect();
      reject(result);
    });

    // Timeout de segurança
    setTimeout(() => {
      if (!result.success && !result.error) {
        result.error = { message: 'Connection timeout' };
        testSocket.disconnect();
        reject(result);
      }
    }, 15000);
  });
};

export const runSocketDiagnostics = async () => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL.replace('/api', '');
  const isProduction = import.meta.env.PROD;
  
  console.log('🔍 Running Socket.IO diagnostics...');
  console.log('Environment:', isProduction ? 'Production' : 'Development');
  console.log('Base URL:', baseUrl);

  const tests = [
    {
      name: 'WebSocket Only',
      options: { transports: ['websocket'] }
    },
    {
      name: 'Polling Only', 
      options: { transports: ['polling'] }
    },
    {
      name: 'Auto (Polling + WebSocket)',
      options: { transports: ['polling', 'websocket'] }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    try {
      const result = await testSocketConnection(baseUrl, test.options);
      results.push({ ...result, testName: test.name });
    } catch (error) {
      results.push({ ...error, testName: test.name });
    }
  }

  console.log('\n📊 Diagnostics Summary:');
  console.table(results);

  return results;
};

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  // Aguardar um pouco para não interferir com a inicialização
  setTimeout(() => {
    runSocketDiagnostics();
  }, 3000);
}