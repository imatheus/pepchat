#!/usr/bin/env node

/**
 * Script para encontrar todos os arquivos que usam socketConnection diretamente
 * e precisam ser migrados para usar socketManager ou useSocket
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const excludeDirs = ['node_modules', '.git', 'build', 'dist'];

function findSocketUsage(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !excludeDirs.includes(file)) {
      findSocketUsage(filePath, results);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Procurar por import de socketConnection
        const hasSocketConnectionImport = content.includes('import { socketConnection }') || 
                                        content.includes('from "../services/socket"') ||
                                        content.includes('from "../../services/socket"') ||
                                        content.includes('from "../../../services/socket"');
        
        // Procurar por uso de socketConnection
        const hasSocketConnectionUsage = content.includes('socketConnection(');
        
        if (hasSocketConnectionImport || hasSocketConnectionUsage) {
          const relativePath = path.relative(srcDir, filePath);
          
          // Verificar se já foi migrado (usa socketManager)
          const alreadyMigrated = content.includes('socketManager') || content.includes('useSocket');
          
          results.push({
            file: relativePath,
            path: filePath,
            hasImport: hasSocketConnectionImport,
            hasUsage: hasSocketConnectionUsage,
            migrated: alreadyMigrated,
            priority: getPriority(relativePath)
          });
        }
      } catch (error) {
        console.warn(`Erro ao ler arquivo ${filePath}:`, error.message);
      }
    }
  }
  
  return results;
}

function getPriority(filePath) {
  // Definir prioridade baseada no tipo de componente
  if (filePath.includes('layout/') || filePath.includes('context/')) {
    return 'CRÍTICA';
  }
  
  if (filePath.includes('components/Ticket') || 
      filePath.includes('components/Message') || 
      filePath.includes('components/Notification')) {
    return 'ALTA';
  }
  
  if (filePath.includes('pages/')) {
    return 'MÉDIA';
  }
  
  if (filePath.includes('hooks/')) {
    return 'BAIXA';
  }
  
  return 'NORMAL';
}

function generateReport(results) {
  console.log('\n🔍 RELATÓRIO DE USO DO SOCKET\n');
  console.log('=' .repeat(60));
  
  const notMigrated = results.filter(r => !r.migrated);
  const migrated = results.filter(r => r.migrated);
  
  console.log(`📊 RESUMO:`);
  console.log(`   Total de arquivos: ${results.length}`);
  console.log(`   ✅ Já migrados: ${migrated.length}`);
  console.log(`   ❌ Precisam migrar: ${notMigrated.length}`);
  console.log('');
  
  if (migrated.length > 0) {
    console.log('✅ ARQUIVOS JÁ MIGRADOS:');
    migrated.forEach(item => {
      console.log(`   - ${item.file}`);
    });
    console.log('');
  }
  
  if (notMigrated.length > 0) {
    console.log('❌ ARQUIVOS QUE PRECISAM SER MIGRADOS:');
    console.log('');
    
    // Agrupar por prioridade
    const byPriority = notMigrated.reduce((acc, item) => {
      if (!acc[item.priority]) acc[item.priority] = [];
      acc[item.priority].push(item);
      return acc;
    }, {});
    
    const priorities = ['CRÍTICA', 'ALTA', 'MÉDIA', 'BAIXA', 'NORMAL'];
    
    priorities.forEach(priority => {
      if (byPriority[priority]) {
        console.log(`🔥 PRIORIDADE ${priority}:`);
        byPriority[priority].forEach(item => {
          console.log(`   - ${item.file}`);
          if (item.hasImport) console.log(`     └─ Tem import de socketConnection`);
          if (item.hasUsage) console.log(`     └─ Usa socketConnection()`);
        });
        console.log('');
      }
    });
  }
  
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('   1. Migrar arquivos de prioridade CRÍTICA primeiro');
  console.log('   2. Usar o hook useSocket() para componentes simples');
  console.log('   3. Usar socketManager diretamente para casos complexos');
  console.log('   4. Testar cada migração individualmente');
  console.log('   5. Verificar no DevTools se há apenas 1 conexão WebSocket');
  console.log('');
  console.log('📖 Consulte o arquivo SOCKET_FIX_README.md para detalhes');
}

// Executar o script
try {
  const results = findSocketUsage(srcDir);
  generateReport(results);
} catch (error) {
  console.error('Erro ao executar o script:', error);
}