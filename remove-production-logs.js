const fs = require('fs');
const path = require('path');

// Função para processar arquivos recursivamente
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Pular node_modules e outras pastas desnecessárias
      if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
      processFile(fullPath);
    }
  });
}

// Função para processar um arquivo individual
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remover console.log simples
    const consoleLogRegex = /console\.log\([^;]*\);?\s*\n?/g;
    if (consoleLogRegex.test(content)) {
      content = content.replace(consoleLogRegex, '');
      modified = true;
    }
    
    // Remover console.warn, console.info, console.debug (mas manter console.error)
    const consoleOtherRegex = /console\.(warn|info|debug)\([^;]*\);?\s*\n?/g;
    if (consoleOtherRegex.test(content)) {
      content = content.replace(consoleOtherRegex, '');
      modified = true;
    }
    
    // Remover linhas que contêm apenas comentários de log
    const logCommentRegex = /^\s*\/\/.*(?:log|debug|console).*\n/gmi;
    if (logCommentRegex.test(content)) {
      content = content.replace(logCommentRegex, '');
      modified = true;
    }
    
    // Remover linhas vazias excessivas (mais de 2 consecutivas)
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Função principal
function main() {
  const frontendPath = path.join(__dirname, 'frontend', 'src');
  
  if (!fs.existsSync(frontendPath)) {
    console.error('❌ Frontend src directory not found');
    return;
  }
  
  console.log('🧹 Starting production log cleanup...');
  console.log(`📁 Processing directory: ${frontendPath}`);
  
  processDirectory(frontendPath);
  
  console.log('✅ Production log cleanup completed!');
  console.log('📝 Remember to test your application after running this script.');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { processDirectory, processFile };