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
    
    // Regex para capturar diferentes tipos de imports
    const patterns = [
      // import ... from 'package'
      /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
      // import('package')
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // require('package')
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // const ... = require('package')
      /=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        
        // Filtrar apenas packages (não caminhos relativos)
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // Extrair o nome do package principal (antes do /)
          const packageName = importPath.split('/')[0];
          // Remover escopo se existir (ex: @types/node -> node)
          const cleanPackageName = packageName.startsWith('@') ? 
            packageName.split('/').slice(0, 2).join('/') : packageName;
          imports.add(cleanPackageName);
        }
      }
    });

    return imports;
  } catch (error) {
    console.warn(`Erro ao ler arquivo ${filePath}:`, error.message);
    return new Set();
  }
}

// Função principal
function checkUnusedDependencies() {
  console.log('🔍 Analisando dependências não utilizadas no backend...\n');

  // Ler package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  const allDependencies = [...dependencies, ...devDependencies];

  console.log(`📦 Total de dependências: ${allDependencies.length}`);
  console.log(`   - Produção: ${dependencies.length}`);
  console.log(`   - Desenvolvimento: ${devDependencies.length}\n`);

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
  console.log(`📁 Analisando ${allFiles.length} arquivos...\n`);

  // Extrair todos os imports
  const usedPackages = new Set();
  
  allFiles.forEach(file => {
    const imports = extractImports(file);
    imports.forEach(pkg => usedPackages.add(pkg));
  });

  // Packages especiais que podem não aparecer em imports diretos
  const specialPackages = new Set([
    'sequelize-cli', // usado via CLI
    'ts-node-dev', // usado em scripts
    'nodemon', // usado em scripts
    'typescript', // usado pelo compilador
    'jest', // usado para testes
    'ts-jest', // usado pelo jest
    '@types/node', // tipos do Node.js
    'reflect-metadata', // usado pelo TypeScript decorators
    'dotenv' // pode ser usado via require no início
  ]);

  // Verificar dependências não utilizadas
  const unusedDependencies = [];
  const unusedDevDependencies = [];

  dependencies.forEach(dep => {
    if (!usedPackages.has(dep) && !specialPackages.has(dep)) {
      unusedDependencies.push(dep);
    }
  });

  devDependencies.forEach(dep => {
    if (!usedPackages.has(dep) && !specialPackages.has(dep)) {
      unusedDevDependencies.push(dep);
    }
  });

  // Exibir resultados
  console.log('📊 RESULTADOS:\n');
  
  if (unusedDependencies.length === 0 && unusedDevDependencies.length === 0) {
    console.log('✅ Todas as dependências parecem estar sendo utilizadas!');
  } else {
    if (unusedDependencies.length > 0) {
      console.log('🚨 DEPENDÊNCIAS DE PRODUÇÃO NÃO UTILIZADAS:');
      unusedDependencies.forEach(dep => {
        console.log(`   - ${dep}`);
      });
      console.log(`\n💡 Para remover: npm uninstall ${unusedDependencies.join(' ')}\n`);
    }

    if (unusedDevDependencies.length > 0) {
      console.log('⚠️  DEPENDÊNCIAS DE DESENVOLVIMENTO NÃO UTILIZADAS:');
      unusedDevDependencies.forEach(dep => {
        console.log(`   - ${dep}`);
      });
      console.log(`\n💡 Para remover: npm uninstall --save-dev ${unusedDevDependencies.join(' ')}\n`);
    }
  }

  // Mostrar packages utilizados para debug
  console.log('📋 PACKAGES DETECTADOS COMO UTILIZADOS:');
  const sortedUsedPackages = Array.from(usedPackages).sort();
  sortedUsedPackages.forEach(pkg => {
    const isDep = dependencies.includes(pkg);
    const isDevDep = devDependencies.includes(pkg);
    const status = isDep ? '(prod)' : isDevDep ? '(dev)' : '(não listado)';
    console.log(`   - ${pkg} ${status}`);
  });

  console.log('\n📝 NOTA: Este script pode ter falsos positivos. Verifique manualmente antes de remover dependências.');
  console.log('   Algumas dependências podem ser usadas indiretamente ou em runtime.');
}

// Executar
checkUnusedDependencies();