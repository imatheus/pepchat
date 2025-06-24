// Utilitário para testar a tarja de período de avaliação
// Este arquivo pode ser usado para simular diferentes cenários de teste

export const simulateTrialStatus = (daysRemaining) => {
  const mockCompanyStatus = {
    isActive: true,
    isInTrial: true,
    isExpired: false,
    daysRemaining: daysRemaining,
    message: `Período de avaliação - ${daysRemaining} ${daysRemaining === 1 ? 'dia restante' : 'dias restantes'}`
  };

  // Simular localStorage para testes
  const mockUser = {
    id: 1,
    name: "Usuário Teste",
    company: {
      id: 1,
      name: "Empresa Teste",
      status: true,
      trialExpiration: new Date(Date.now() + (daysRemaining * 24 * 60 * 60 * 1000)).toISOString(),
      dueDate: new Date(Date.now() + (daysRemaining * 24 * 60 * 60 * 1000)).toISOString()
    }
  };

  console.log('🧪 Simulando período de avaliação:');
  console.log('📊 Status da empresa:', mockCompanyStatus);
  console.log('👤 Usuário:', mockUser);
  console.log('📅 Dias restantes:', daysRemaining);
  console.log('🎯 Deve mostrar tarja:', daysRemaining > 0);

  return { mockCompanyStatus, mockUser };
};

// Cenários de teste
export const testScenarios = {
  newUser: () => simulateTrialStatus(7), // Usuário recém-cadastrado
  midTrial: () => simulateTrialStatus(4), // Meio do período
  warning: () => simulateTrialStatus(3), // Aviso
  urgent: () => simulateTrialStatus(1), // Urgente
  lastDay: () => simulateTrialStatus(1), // Último dia
  expired: () => simulateTrialStatus(0), // Expirado (não deve mostrar)
};

// Função para testar todos os cenários
export const runAllTests = () => {
  console.log('🚀 Executando todos os cenários de teste da tarja de avaliação:');
  
  Object.entries(testScenarios).forEach(([scenario, testFn]) => {
    console.log(`\n📋 Cenário: ${scenario}`);
    testFn();
  });
};

// Instruções de uso:
// 1. Importe este arquivo no componente que você quer testar
// 2. Execute runAllTests() no console do navegador
// 3. Ou use simulateTrialStatus(dias) para testar um cenário específico

export default {
  simulateTrialStatus,
  testScenarios,
  runAllTests
};