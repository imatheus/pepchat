#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Função para ler recursivamente todos os arquivos .ts e .js
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Ignorar node_modules, dist, uploads, temp, public
      if (!['node_modules', 'dist', 'uploads', 'temp', 'public'].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      // Incluir apenas arquivos .ts, .js, .json
      if (file.match(/\.(ts|js|json)$/)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// Função para extrair imports/requires de um arquivo
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = new Set();
    const importDetails = [];
    
    // Regex para capturar diferentes tipos de imports
    const patterns = [
      { 
        regex: /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g, 
        type: 'ES6 import' 
      },
      { 
        regex: /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, 
        type: 'Dynamic import' 
      },
      { 
        regex: /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, 
        type: 'CommonJS require' 
      },
      { 
        regex: /=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g, 
        type: 'CommonJS assignment' 
      }
    ];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        
        // Filtrar apenas packages (não caminhos relativos)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // Extrair o nome do package principal (antes do /)
          const packageName = importPath.split('/')[0];
          // Remover escopo se existir (ex: @types/node -> node)
          const cleanPackageName = packageName.startsWith('@') ? 
            packageName.split('/').slice(0, 2).join('/') : packageName;
          
          imports.add(cleanPackageName);
          importDetails.push({
            package: cleanPackageName,
            fullPath: importPath,
            type: type,
            file: path.relative(__dirname, filePath)
          });
        }
      }
    });

    return { imports, importDetails };
  } catch (error) {
    console.warn(`Erro ao ler arquivo ${filePath}:`, error.message);
    return { imports: new Set(), importDetails: [] };
  }
}

// Função para verificar se um package é usado indiretamente
function checkIndirectUsage(packageName, content) {
  const indirectPatterns = [
    // Baileys pode ser usado via string
    packageName === '@adiwajshing/baileys' && content.includes('baileys'),
    packageName === '@whiskeysockets/baileys' && content.includes('baileys'),
    // Sentry pode ser configurado via string
    packageName === '@sentry/node' && (content.includes('sentry') || content.includes('Sentry')),
    // Express async errors pode ser usado via middleware
    packageName === 'express-async-errors' && content.includes('async'),
    // PG pode ser usado via Sequelize
    packageName === 'pg' && (content.includes('postgres') || content.includes('postgresql')),
    // Pino pretty pode ser usado em configuração
    packageName === 'pino-pretty' && content.includes('pretty'),
    // QR Code terminal pode ser usado em configuração
    packageName === 'qrcode-terminal' && content.includes('qrcode'),
    // Faker pode ser usado em seeds
    packageName === 'faker' && content.includes('fake'),
    // Libphonenumber pode ser usado via string
    packageName === 'libphonenumber-js' && (content.includes('phone') || content.includes('Phone'))
  ];

  return indirectPatterns.some(pattern => pattern);
}

// Função principal
function checkUnusedDependencies() {
  console.log('🔍 Análise Detalhada de Dependências Não Utilizadas - Backend\n');
  console.log('=' .repeat(60) + '\n');

  // Ler package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  const allDependencies = [...dependencies, ...devDependencies];

  console.log(`📦 RESUMO DAS DEPENDÊNCIAS:`);
  console.log(`   Total: ${allDependencies.length} packages`);
  console.log(`   Produção: ${dependencies.length} packages`);
  console.log(`   Desenvolvimento: ${devDependencies.length} packages\n`);

  // Obter todos os arquivos do projeto
  const srcPath = path.join(__dirname, 'src');
  const configFiles = [
    path.join(__dirname, 'jest.config.js'),
    path.join(__dirname, 'tsconfig.json'),
    path.join(__dirname, '.eslintrc.json'),
    path.join(__dirname, 'prettier.config.js'),
    packageJsonPath
  ].filter(file => fs.existsSync(file));

  const allFiles = [...getAllFiles(srcPath), ...configFiles];
  console.log(`📁 ARQUIVOS ANALISADOS: ${allFiles.length} arquivos\n`);

  // Extrair todos os imports
  const usedPackages = new Set();
  const allImportDetails = [];
  const allFileContents = new Map();
  
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    allFileContents.set(file, content);
    
    const { imports, importDetails } = extractImports(file);
    imports.forEach(pkg => usedPackages.add(pkg));
    allImportDetails.push(...importDetails);
  });

  // Packages especiais que podem não aparecer em imports diretos
  const specialPackages = new Map([
    ['sequelize-cli', 'Usado via CLI para migrações e seeds'],
    ['ts-node-dev', 'Usado no script de desenvolvimento'],
    ['nodemon', 'Usado no script de start'],
    ['typescript', 'Usado pelo compilador TypeScript'],
    ['jest', 'Framework de testes'],
    ['ts-jest', 'Preset do Jest para TypeScript'],
    ['@types/node', 'Tipos do Node.js para TypeScript'],
    ['reflect-metadata', 'Usado por decorators do TypeScript'],
    ['dotenv', 'Pode ser carregado automaticamente']
  ]);

  // Verificar uso indireto
  const indirectlyUsed = new Set();
  dependencies.forEach(dep => {
    if (!usedPackages.has(dep)) {
      // Verificar uso indireto em todos os arquivos
      for (const [file, content] of allFileContents) {
        if (checkIndirectUsage(dep, content)) {
          indirectlyUsed.add(dep);
          break;
        }
      }
    }
  });

  // Categorizar dependências
  const trulyUnused = [];
  const possiblyUnused = [];
  const indirectlyUsedList = [];

  dependencies.forEach(dep => {
    if (usedPackages.has(dep)) {
      // Usado diretamente
    } else if (specialPackages.has(dep)) {
      // Package especial
    } else if (indirectlyUsed.has(dep)) {
      indirectlyUsedList.push(dep);
    } else {
      // Verificar se pode ser usado indiretamente
      const mightBeIndirect = ['@adiwajshing/baileys', '@whiskeysockets/baileys', '@sentry/node', 'pg', 'express-async-errors'].includes(dep);
      if (mightBeIndirect) {
        possiblyUnused.push(dep);
      } else {
        trulyUnused.push(dep);
      }
    }
  });

  const unusedDevDependencies = devDependencies.filter(dep => 
    !usedPackages.has(dep) && !specialPackages.has(dep)
  );

  // Exibir resultados
  console.log('📊 RESULTADOS DA ANÁLISE:\n');
  
  if (trulyUnused.length > 0) {
    console.log('🚨 DEPENDÊNCIAS PROVAVELMENTE NÃO UTILIZADAS:');
    trulyUnused.forEach(dep => {
      console.log(`   ❌ ${dep}`);
    });
    console.log(`\n💡 Comando para remover: npm uninstall ${trulyUnused.join(' ')}\n`);
  }

  if (possiblyUnused.length > 0) {
    console.log('⚠️  DEPENDÊNCIAS QUE PODEM ESTAR EM USO INDIRETO:');
    possiblyUnused.forEach(dep => {
      console.log(`   ⚡ ${dep} - Verificar manualmente`);
    });
    console.log('   (Podem ser usadas via configuração ou runtime)\n');
  }

  if (indirectlyUsedList.length > 0) {
    console.log('✅ DEPENDÊNCIAS DETECTADAS COMO USADAS INDIRETAMENTE:');
    indirectlyUsedList.forEach(dep => {
      console.log(`   ✓ ${dep}`);
    });
    console.log('');
  }

  if (unusedDevDependencies.length > 0) {
    console.log('🔧 DEPENDÊNCIAS DE DESENVOLVIMENTO NÃO UTILIZADAS:');
    unusedDevDependencies.forEach(dep => {
      console.log(`   📦 ${dep}`);
    });
    console.log(`\n💡 Comando para remover: npm uninstall --save-dev ${unusedDevDependencies.join(' ')}\n`);
  }

  // Mostrar packages especiais
  console.log('🛠️  PACKAGES ESPECIAIS (SEMPRE NECESSÁRIOS):');
  specialPackages.forEach((description, pkg) => {
    if (allDependencies.includes(pkg)) {
      console.log(`   🔧 ${pkg} - ${description}`);
    }
  });

  // Estatísticas finais
  console.log('\n' + '=' .repeat(60));
  console.log('📈 ESTATÍSTICAS FINAIS:');
  console.log(`   Dependências em uso direto: ${usedPackages.size}`);
  console.log(`   Dependências não utilizadas: ${trulyUnused.length}`);
  console.log(`   Dependências suspeitas: ${possiblyUnused.length}`);
  console.log(`   Dev dependencies não utilizadas: ${unusedDevDependencies.length}`);
  
  const totalUnused = trulyUnused.length + unusedDevDependencies.length;
  const totalDeps = allDependencies.length;
  const usagePercentage = ((totalDeps - totalUnused) / totalDeps * 100).toFixed(1);
  
  console.log(`   Taxa de utilização: ${usagePercentage}%`);

  console.log('\n📝 IMPORTANTE:');
  console.log('   - Sempre teste o projeto após remover dependências');
  console.log('   - Algumas dependências podem ser usadas apenas em produção');
  console.log('   - Verifique se há dependências peer que podem ser necessárias');
  
  // Salvar relatório detalhado
  const reportPath = path.join(__dirname, 'dependency-analysis-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalDeps,
      used: totalDeps - totalUnused,
      unused: totalUnused,
      usagePercentage: parseFloat(usagePercentage)
    },
    trulyUnused,
    possiblyUnused,
    unusedDevDependencies,
    usedPackages: Array.from(usedPackages),
    importDetails: allImportDetails
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Relatório detalhado salvo em: ${path.basename(reportPath)}`);
}

// Executar
checkUnusedDependencies();