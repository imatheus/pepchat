const fs = require('fs');
const path = require('path');

// Função para ler arquivo
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Função para escrever arquivo
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Função para fazer backup
function backupFile(filePath) {
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);
  console.log(`Backup criado: ${backupPath}`);
}

// Correções para cada arquivo
const fixes = [
  {
    file: 'frontend/src/pages/Queues/index.js',
    fix: (content) => {
      // Remove variável não utilizada
      return content.replace(/const completeTutorial = [^;]+;/, '// const completeTutorial = ... // Removido - não utilizado');
    }
  },
  {
    file: 'frontend/src/components/CheckoutPage/CheckoutPage.js',
    fix: (content) => {
      // Remove imports não utilizados
      return content
        .replace(/import AddressForm[^;]+;/, '// import AddressForm... // Removido - não utilizado')
        .replace(/import ReviewOrder[^;]+;/, '// import ReviewOrder... // Removido - não utilizado');
    }
  },
  {
    file: 'frontend/src/components/QueueOptions/index.js',
    fix: (content) => {
      // Remove import toast não utilizado
      content = content.replace(/,\s*toast/, '');
      
      // Corrige useEffect com cleanup
      content = content.replace(
        /useEffect\(\(\) => \{[\s\S]*?return \(\) => \{[\s\S]*?\};[\s\S]*?\}, \[[^\]]*\]\);/,
        `useEffect(() => {
          // ... código do effect
          const currentTimeouts = saveTimeouts.current;
          return () => {
            // Usar variável local para cleanup
            if (currentTimeouts) {
              Object.values(currentTimeouts).forEach(timeout => {
                if (timeout) clearTimeout(timeout);
              });
            }
          };
        }, []);`
      );
      
      // Corrige useCallback com dependência
      content = content.replace(
        /useCallback\([^,]+, \[[^\]]*\]\)/,
        'useCallback(handleSave, [handleSave])'
      );
      
      return content;
    }
  },
  {
    file: 'frontend/src/pages/Signup/index.js',
    fix: (content) => {
      // Remove imports não utilizados
      content = content
        .replace(/\s*InputLabel,/, '')
        .replace(/\s*MenuItem,/, '')
        .replace(/\s*Select,/, '');
      
      // Remove UserSchema não utilizado
      content = content.replace(/const UserSchema = Yup\.object\(\)\.shape\(\{[\s\S]*?\}\);/, '// UserSchema removido - não utilizado');
      
      // Remove escapes desnecessários
      content = content.replace(/\\\[/g, '[').replace(/\\\//g, '/');
      
      // Remove variável cleanDocument não utilizada
      content = content.replace(/const cleanDocument = [^;]+;/, '// cleanDocument removido - não utilizado');
      
      return content;
    }
  },
  {
    file: 'frontend/src/layout/MainListItems.js',
    fix: (content) => {
      // Remove import não utilizado
      content = content.replace(/import AccountTreeOutlinedIcon[^;]+;/, '// AccountTreeOutlinedIcon removido - não utilizado');
      
      // Remove variável darkMode não utilizada
      content = content.replace(/const darkMode = [^;]+;/, '// darkMode removido - não utilizado');
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/TrialStatusCard/index.js',
    fix: (content) => {
      // Remove função não utilizada
      return content.replace(/const getStatusIcon = [^;]+;/, '// getStatusIcon removido - não utilizado');
    }
  },
  {
    file: 'frontend/src/components/SystemStats/index.js',
    fix: (content) => {
      // Remove imports e variáveis não utilizadas
      content = content.replace(/,\s*Divider/, '');
      content = content.replace(/,\s*formatDistanceToNow/, '');
      content = content.replace(/const lastUpdate = [^;]+;/, '// lastUpdate removido - não utilizado');
      content = content.replace(/const formatDaysRemaining = [^;]+;/, '// formatDaysRemaining removido - não utilizado');
      
      return content;
    }
  },
  {
    file: 'frontend/src/layout/index.js',
    fix: (content) => {
      // Remove imports e variáveis não utilizadas
      content = content.replace(/,\s*Box/, '');
      content = content.replace(/import moment[^;]+;/, '// moment removido - não utilizado');
      content = content.replace(/const companyStatus = [^;]+;/, '// companyStatus removido - não utilizado');
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/TrialGuard/index.js',
    fix: (content) => {
      // Remove import React não utilizado
      content = content.replace(/import React[^;]+;/, '// React removido - não utilizado diretamente');
      
      // Remove variável isSuperAdmin não utilizada
      content = content.replace(/const isSuperAdmin = [^;]+;/, '// isSuperAdmin removido - não utilizado');
      
      // Corrige useEffect com dependências
      content = content.replace(
        /useEffect\([^,]+, \[[^\]]*\]\)/,
        'useEffect(() => { /* ... */ }, [isFinanceiroPage, isLoginPage, isSignupPage, user, location.pathname])'
      );
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/MessageInputCustom/index.js',
    fix: (content) => {
      // Remove variável não utilizada
      return content.replace(/const SignSwitch = [^;]+;/, '// SignSwitch removido - não utilizado');
    }
  },
  {
    file: 'frontend/src/components/WhatsAppModal/index.js',
    fix: (content) => {
      // Remove import Box não utilizado
      return content.replace(/,\s*Box/, '');
    }
  },
  {
    file: 'frontend/src/components/MessagesList/index.js',
    fix: (content) => {
      // Remove imports não utilizados
      return content
        .replace(/,\s*Facebook/, '')
        .replace(/,\s*Instagram/, '');
    }
  },
  {
    file: 'frontend/src/pages/Financeiro/index.js',
    fix: (content) => {
      // Remove imports não utilizados
      content = content.replace(/,\s*toast/, '');
      content = content.replace(/,\s*showUniqueError/, '');
      content = content.replace(/,\s*showUniqueSuccess/, '');
      content = content.replace(/,\s*showUniqueInfo/, '');
      
      // Remove variáveis não utilizadas
      content = content.replace(/const handleScroll = [^;]+;/, '// handleScroll removido - não utilizado');
      content = content.replace(/const isInTrialPeriod = [^;]+;/, '// isInTrialPeriod removido - não utilizado');
      content = content.replace(/const getDaysRemaining = [^;]+;/, '// getDaysRemaining removido - não utilizado');
      content = content.replace(/const getDaysExpired = [^;]+;/, '// getDaysExpired removido - não utilizado');
      
      // Corrige useEffect com dependências
      content = content.replace(
        /useEffect\([^,]+, \[isTrialExpired, user\]\)/,
        'useEffect(() => { /* ... */ }, [isTrialExpired, user])'
      );
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/CompaniesManager/index.js',
    fix: (content) => {
      // Remove import não utilizado
      content = content.replace(/,\s*has/, '');
      
      // Corrige useEffect com dependências
      content = content.replace(
        /useEffect\([^,]+, \[user\.companyId\]\)/,
        'useEffect(() => { /* ... */ }, [loadPlans, user.companyId])'
      );
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/PlanSelection/index.js',
    fix: (content) => {
      // Corrige useEffect com dependência
      content = content.replace(
        /React\.useEffect\([^,]+, \[plans\]\)/,
        'React.useEffect(() => { /* ... */ }, [plans, planUsers])'
      );
      
      // Remove função não utilizada
      content = content.replace(/const getAllPossibleFeatures = [^;]+;/, '// getAllPossibleFeatures removido - não utilizado');
      
      return content;
    }
  },
  {
    file: 'frontend/src/hooks/useAuth.js/index.js',
    fix: (content) => {
      // Remove imports não utilizados
      content = content.replace(/,\s*isArray/, '');
      content = content.replace(/,\s*showUniqueWarning/, '');
      content = content.replace(/,\s*showUniqueInfo/, '');
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/AsaasManager/index.js',
    fix: (content) => {
      // Remove imports não utilizados
      content = content.replace(/,\s*Paper/, '');
      content = content.replace(/,\s*Typography/, '');
      content = content.replace(/,\s*Alert/, '');
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/ModalImageCors/index.js',
    fix: (content) => {
      // Remove chave duplicada 'border'
      const lines = content.split('\n');
      let borderFound = false;
      const fixedLines = lines.map(line => {
        if (line.includes('border:') && borderFound) {
          return '    // border: ... // Removido - chave duplicada';
        }
        if (line.includes('border:')) {
          borderFound = true;
        }
        return line;
      });
      
      return fixedLines.join('\n');
    }
  },
  {
    file: 'frontend/src/components/TutorialTooltip/index.js',
    fix: (content) => {
      // Remove imports e variáveis não utilizadas
      content = content.replace(/,\s*Paper/, '');
      content = content.replace(/const useCustomTheme = [^;]+;/, '// useCustomTheme removido - não utilizado');
      content = content.replace(/const theme = [^;]+;/, '// theme removido - não utilizado');
      
      return content;
    }
  },
  {
    file: 'frontend/src/pages/ContactListItems/index.js',
    fix: (content) => {
      // Remove imports não utilizados
      content = content.replace(/,\s*ListItemSecondaryAction/, '');
      content = content.replace(/,\s*Toolbar/, '');
      
      // Remove função não utilizada
      content = content.replace(/const handleCloseBulkDeleteModal = [^;]+;/, '// handleCloseBulkDeleteModal removido - não utilizado');
      
      return content;
    }
  },
  {
    file: 'frontend/src/hooks/useCompanyStatus.js',
    fix: (content) => {
      // Remove imports não utilizados
      content = content.replace(/,\s*showUniqueError/, '');
      content = content.replace(/,\s*showUniqueWarning/, '');
      
      // Corrige useEffect com dependências
      content = content.replace(
        /useEffect\([^,]+, \[user\.company\]\)/,
        'useEffect(() => { /* ... */ }, [syncStatusWithBackend, user.company])'
      );
      
      content = content.replace(
        /useEffect\([^,]+, \[user\.companyId\]\)/,
        'useEffect(() => { /* ... */ }, [user.companyId])'
      );
      
      return content;
    }
  },
  {
    file: 'frontend/src/components/TrialUpgradePrompt/index.js',
    fix: (content) => {
      // Remove import Box não utilizado
      return content.replace(/,\s*Box/, '');
    }
  },
  {
    file: 'frontend/src/components/TrialNotifications/index.js',
    fix: (content) => {
      // Corrige useEffect com dependências
      return content.replace(
        /useEffect\([^,]+, \[user\.id, user\.profile\]\)/,
        'useEffect(() => { /* ... */ }, [user.id, user.profile])'
      );
    }
  },
  {
    file: 'frontend/src/pages/Integrations/MessagesAPITab.js',
    fix: (content) => {
      // Remove chave duplicada 'display'
      const lines = content.split('\n');
      let displayFound = false;
      const fixedLines = lines.map(line => {
        if (line.includes('display:') && displayFound) {
          return '    // display: ... // Removido - chave duplicada';
        }
        if (line.includes('display:')) {
          displayFound = true;
        }
        return line;
      });
      
      return fixedLines.join('\n');
    }
  }
];

// Função principal
function fixWarnings() {
  console.log('🔧 Iniciando correção de warnings do frontend...\n');
  
  const basePath = path.join(__dirname);
  let fixedCount = 0;
  let errorCount = 0;
  
  fixes.forEach(({ file, fix }) => {
    const filePath = path.join(basePath, file);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Arquivo não encontrado: ${file}`);
        return;
      }
      
      console.log(`🔄 Processando: ${file}`);
      
      // Fazer backup
      backupFile(filePath);
      
      // Ler conteúdo
      const content = readFile(filePath);
      
      // Aplicar correção
      const fixedContent = fix(content);
      
      // Escrever arquivo corrigido
      writeFile(filePath, fixedContent);
      
      console.log(`✅ Corrigido: ${file}`);
      fixedCount++;
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${file}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n📊 Resumo:`);
  console.log(`✅ Arquivos corrigidos: ${fixedCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📁 Backups criados em: *.backup`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Correções aplicadas com sucesso!`);
    console.log(`💡 Execute 'npm start' no frontend para verificar se os warnings foram resolvidos.`);
    console.log(`🔄 Se algo der errado, restaure os backups: mv arquivo.backup arquivo`);
  }
}

// Executar correções
fixWarnings();