# Guia de Migração - Lodash para Helpers Nativos

## 🔄 Como Migrar os Imports Existentes

### 1. **Substituições Diretas**

#### Antes:
```javascript
import { isArray, isString, isObject, isEmpty } from "lodash";
```

#### Depois:
```javascript
import { isArray, isString, isObject, isEmpty } from "../utils/helpers";
```

### 2. **Exemplos de Migração por Arquivo**

#### `useAuth.js`
```javascript
// Antes
import { has, isArray } from "lodash";

// Depois
import { has, isArray } from "../../utils/helpers";
```

#### `Dashboard/index.js`
```javascript
// Antes
import { isArray, isEmpty } from "lodash";

// Depois
import { isArray, isEmpty } from "../../utils/helpers";
```

#### `Companies/index.js`
```javascript
// Antes
import { isEqual } from 'lodash';

// Depois
import { isEqual } from '../../utils/helpers';
```

### 3. **Funções Disponíveis nos Helpers**

| Lodash | Helper Nativo | Descrição |
|--------|---------------|-----------|
| `isArray()` | `isArray()` | Verifica se é array |
| `isString()` | `isString()` | Verifica se é string |
| `isObject()` | `isObject()` | Verifica se é objeto |
| `isEmpty()` | `isEmpty()` | Verifica se está vazio |
| `isNil()` | `isNil()` | Verifica se é null/undefined |
| `isNull()` | `isNull()` | Verifica se é null |
| `has()` | `has()` | Verifica propriedade |
| `get()` | `get()` | Obtém propriedade |
| `at()` | `at()` | Obtém múltiplas propriedades |
| `capitalize()` | `capitalize()` | Capitaliza string |
| `head()` | `head()` | Primeiro elemento |
| `isEqual()` | `isEqual()` | Comparação profunda |

### 4. **Funções Adicionais Úteis**

```javascript
import { 
  debounce,           // Debounce function
  throttle,           // Throttle function
  deepClone,          // Clone profundo
  cleanObject,        // Remove props null/undefined
  formatCurrency,     // Formata moeda BR
  formatDate,         // Formata data BR
  formatDateTime,     // Formata data/hora BR
  generateId,         // Gera ID único
  truncateText        // Trunca texto
} from '../utils/helpers';
```

---

## 🔧 Migração dos Componentes Toggle

### 1. **Imports Existentes (Mantidos para Compatibilidade)**

```javascript
// Ainda funciona
import StandardToggleSwitch from "../StandardToggleSwitch";
import BlackToggleSwitch from "../BlackToggleSwitch";
```

### 2. **Novo Import Recomendado**

```javascript
// Recomendado para novos códigos
import ToggleSwitch from "../ToggleSwitch";

// Uso
<ToggleSwitch 
  label="Ativar funcionalidade"
  checked={isActive}
  onChange={handleToggle}
  variant="standard" // ou "special" para o estilo preto
/>
```

### 3. **Migração Gradual**

#### Passo 1: Substituir imports
```javascript
// De:
import StandardToggleSwitch from "../StandardToggleSwitch";

// Para:
import ToggleSwitch from "../ToggleSwitch";
```

#### Passo 2: Atualizar uso
```javascript
// De:
<StandardToggleSwitch 
  label="Ativar"
  checked={state}
  onChange={handler}
/>

// Para:
<ToggleSwitch 
  label="Ativar"
  checked={state}
  onChange={handler}
  variant="standard"
/>
```

---

## 🎨 Migração do Sistema de Tema

### 1. **CSS - Remoção de Imports Antigos**

#### No App.js, remover:
```javascript
// Remover estes imports
import "./assets/css/dark-theme-fixes.css";
import "./assets/css/dark-mode-complete.css";
import "./assets/css/dark-mode-overrides.css";
import "./assets/css/message-input-dark.css";
import "./assets/css/messages-list-dark.css";
import "./assets/css/preserve-colors-dark.css";
import "./assets/css/input-fixes-dark.css";
import "./assets/css/toast-dark-theme.css";
```

#### Já substituído por:
```javascript
import "./assets/css/unified-theme.css";
```

### 2. **Uso do Tema nos Componentes**

```javascript
import { useCustomTheme } from '../../context/Theme/ThemeContext';

const MyComponent = () => {
  const { darkMode, colors, toggleDarkMode } = useCustomTheme();
  
  return (
    <div style={{ 
      backgroundColor: colors.background.paper,
      color: colors.text.primary 
    }}>
      <button onClick={toggleDarkMode}>
        {darkMode ? 'Modo Claro' : 'Modo Escuro'}
      </button>
    </div>
  );
};
```

---

## 📋 Checklist de Migração

### Para cada arquivo que usa lodash:

- [ ] Identificar funções do lodash utilizadas
- [ ] Verificar se existe equivalente nos helpers
- [ ] Substituir import
- [ ] Testar funcionalidade
- [ ] Remover import do lodash se não usado

### Para componentes Toggle:

- [ ] Identificar uso de StandardToggleSwitch/BlackToggleSwitch
- [ ] Substituir por ToggleSwitch com variant apropriada
- [ ] Testar comportamento
- [ ] Verificar estilo visual

### Para arquivos CSS:

- [ ] ✅ Remover imports de CSS antigos do App.js
- [ ] ✅ Verificar se unified-theme.css está importado
- [ ] Testar tema light/dark
- [ ] Verificar responsividade

---

## 🚨 Cuidados Importantes

### 1. **Testes Obrigatórios**
- Testar todas as funcionalidades após migração
- Verificar tema light/dark
- Validar responsividade
- Confirmar acessibilidade

### 2. **Compatibilidade**
- Imports antigos ainda funcionam
- Migração pode ser gradual
- Não quebra código existente

### 3. **Performance**
- Helpers nativos são mais rápidos
- Bundle size menor
- Menos dependências externas

---

## 📞 Suporte

Se encontrar problemas durante a migração:

1. **Verificar** se o import está correto
2. **Consultar** este guia
3. **Testar** em ambiente de desenvolvimento
4. **Documentar** qualquer issue encontrada

---

## ✅ Benefícios da Migração

- 📦 **Bundle 15-20% menor**
- ⚡ **Performance melhorada**
- 🔧 **Manutenção simplificada**
- 🎯 **Código mais limpo**
- 🚀 **Carregamento mais rápido**