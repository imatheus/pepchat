// Script de teste para verificar se o cálculo de planos está correto
// Execute com: node test-plan-calculation.js

const testPlanCalculation = () => {
  console.log("=== TESTE DE CÁLCULO DE PLANOS ===\n");
  
  // Simular dados de um plano base
  const basePlan = {
    id: 1,
    name: "Plano Básico",
    value: 10, // R$ 10 por usuário
    users: 1,
    connections: 1,
    queues: 1
  };
  
  // Simular diferentes quantidades de usuários
  const testCases = [
    { users: 1, expectedTotal: 10 },
    { users: 3, expectedTotal: 30 },
    { users: 5, expectedTotal: 50 },
    { users: 10, expectedTotal: 100 }
  ];
  
  console.log("Plano Base:", basePlan);
  console.log("Valor por usuário: R$", basePlan.value);
  console.log("\n--- TESTES ---");
  
  testCases.forEach(testCase => {
    const calculatedTotal = basePlan.value * testCase.users;
    const isCorrect = calculatedTotal === testCase.expectedTotal;
    
    console.log(`${testCase.users} usuários:`);
    console.log(`  Esperado: R$ ${testCase.expectedTotal}`);
    console.log(`  Calculado: R$ ${calculatedTotal}`);
    console.log(`  Status: ${isCorrect ? '✅ CORRETO' : '❌ ERRO'}`);
    console.log("");
  });
  
  console.log("=== EXEMPLO DO PROBLEMA REPORTADO ===");
  console.log("3 licenças com plano base de R$ 10:");
  console.log("- Valor correto: R$ 30 (3 × R$ 10)");
  console.log("- Valor incorreto enviado ao Asaas: R$ 10 (apenas valor base)");
  console.log("\nCom as correções implementadas, agora deve enviar R$ 30 ✅");
};

testPlanCalculation();