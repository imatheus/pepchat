# Sistema de Cores Centralizado

Este documento explica como usar o sistema de cores centralizado do projeto. Com este sistema, você pode alterar todas as cores do site modificando apenas alguns arquivos.

## 📁 Estrutura dos Arquivos

```
src/styles/
├── colors.js          # Configurações JavaScript das cores
├── variables.css      # Variáveis CSS globais
└── README.md         # Esta documentação

src/hooks/
└── useColors.js      # Hook para acessar cores em componentes React

src/context/Theme/
└── ThemeContext.jsx  # Contexto do tema integrado com o sistema de cores
```

## 🎨 Como Alterar as Cores do Sistema

### Método 1: Alterando as Cores Principais (Recomendado)

Para alterar as cores principais do sistema, edite o arquivo `src/styles/colors.js`:

```javascript
export const SYSTEM_COLORS = {
  // ===== CORES PRINCIPAIS =====
  primary: {
    main: '#44b774',      // ← Altere esta cor para mudar a cor principal
    light: '#66bb6a',     // ← Cor clara da principal
    dark: '#2e7d32',      // ← Cor escura da principal
    contrastText: '#ffffff'
  },
  
  secondary: {
    main: '#f50057',      // ← Altere esta cor para mudar a cor secundária
    light: '#f48fb1',
    dark: '#c51162',
    contrastText: '#ffffff'
  },
  
  // ===== CORES DE STATUS =====
  status: {
    success: '#4caf50',   // ← Verde para sucesso
    error: '#f44336',     // ← Vermelho para erro
    warning: '#ff9800',   // ← Laranja para aviso
    info: '#2196f3',      // ← Azul para informação
  },
  
  // ... outras configurações
};
```

### Método 2: Usando Variáveis CSS

Você também pode alterar as variáveis CSS no arquivo `src/styles/variables.css`:

```css
:root {
  /* Cores principais */
  --color-primary: #44b774;        /* ← Altere aqui */
  --color-secondary: #f50057;      /* ← Altere aqui */
  
  /* Cores de status */
  --color-success: #4caf50;        /* ← Altere aqui */
  --color-error: #f44336;          /* ← Altere aqui */
  --color-warning: #ff9800;        /* ← Altere aqui */
  --color-info: #2196f3;           /* ← Altere aqui */
  
  /* ... outras variáveis */
}
```

## 🔧 Como Usar as Cores nos Componentes

### 1. Usando o Hook useColors (Recomendado)

```jsx
import { useColors } from '../hooks/useColors';

const MeuComponente = () => {
  const colors = useColors();
  
  return (
    <div style={{ 
      backgroundColor: colors.primary,
      color: colors.textInverse,
      border: `1px solid ${colors.border}`
    }}>
      <button style={colors.getButtonStyle(colors.success)}>
        Botão Verde
      </button>
      
      <span style={colors.getStatusStyle('ENVIADO')}>
        Status
      </span>
    </div>
  );
};
```

### 2. Usando o Contexto do Tema

```jsx
import { useCustomTheme } from '../context/Theme/ThemeContext';

const MeuComponente = () => {
  const { colors } = useCustomTheme();
  
  return (
    <div style={{ 
      backgroundColor: colors.background.paper,
      color: colors.text.primary 
    }}>
      Conteúdo
    </div>
  );
};
```

### 3. Usando Variáveis CSS

```jsx
const MeuComponente = () => {
  return (
    <div style={{ 
      backgroundColor: 'var(--color-primary)',
      color: 'var(--text-inverse)',
      border: '1px solid var(--border-color)'
    }}>
      Conteúdo
    </div>
  );
};
```

### 4. Usando Classes CSS Utilitárias

```jsx
const MeuComponente = () => {
  return (
    <div className="bg-primary text-inverse border-default">
      <span className="status-success">Sucesso</span>
      <span className="status-error">Erro</span>
    </div>
  );
};
```

## 🎯 Funções Utilitárias Disponíveis

### No Hook useColors:

```jsx
const colors = useColors();

// Cores básicas
colors.primary          // Cor principal
colors.secondary        // Cor secundária
colors.success          // Verde de sucesso
colors.error           // Vermelho de erro

// Funções utilitárias
colors.darkenColor('#44b774', 0.2)           // Escurece uma cor
colors.lightenColor('#44b774', 0.2)          // Clareia uma cor
colors.getContrastColor('#44b774')           // Retorna preto ou branco
colors.withOpacity('#44b774', 0.5)           // Adiciona transparência
colors.getStatusColor('ENVIADO')             // Cor baseada no status

// Estilos prontos
colors.getButtonStyle(colors.primary)        // Estilo de botão
colors.getChipStyle(colors.warning)          // Estilo de chip/tag
colors.getCardStyle(true)                    // Estilo de card
colors.getInputStyle()                       // Estilo de input
colors.getStatusStyle('PENDENTE')            // Estilo de status
```

### Importando Funções Diretamente:

```jsx
import { 
  darkenColor, 
  lightenColor, 
  getContrastColor, 
  getStatusColor 
} from '../styles/colors';

const corEscura = darkenColor('#44b774', 0.2);
const corClara = lightenColor('#44b774', 0.2);
const corContraste = getContrastColor('#44b774');
const corStatus = getStatusColor('ENVIADO');
```

## 🌙 Suporte a Tema Escuro

O sistema automaticamente suporta tema claro e escuro. As cores são ajustadas automaticamente baseadas na preferência do usuário.

```jsx
const colors = useColors();

// Verifica se está no modo escuro
if (colors.isDark) {
  // Lógica específica para tema escuro
}

// As cores já são ajustadas automaticamente
const estilo = {
  backgroundColor: colors.bgPaper,  // Branco no claro, cinza escuro no escuro
  color: colors.textPrimary         // Preto no claro, branco no escuro
};
```

## 📋 Classes CSS Utilitárias Disponíveis

### Cores de Texto:
- `.text-primary` - Cor de texto principal
- `.text-secondary` - Cor de texto secundária
- `.text-success` - Verde
- `.text-error` - Vermelho
- `.text-warning` - Laranja
- `.text-info` - Azul
- `.text-whatsapp` - Verde WhatsApp

### Cores de Fundo:
- `.bg-primary` - Fundo principal
- `.bg-secondary` - Fundo secundário
- `.bg-success` - Fundo verde
- `.bg-error` - Fundo vermelho
- `.bg-warning` - Fundo laranja
- `.bg-info` - Fundo azul
- `.bg-paper` - Fundo de papel
- `.bg-whatsapp` - Fundo WhatsApp

### Status:
- `.status-success` - Estilo de sucesso completo
- `.status-error` - Estilo de erro completo
- `.status-warning` - Estilo de aviso completo
- `.status-info` - Estilo de informação completo

### Outros:
- `.shadow-light` - Sombra leve
- `.shadow-medium` - Sombra média
- `.shadow-heavy` - Sombra pesada
- `.smooth-transition` - Transição suave
- `.custom-scrollbar` - Scrollbar personalizada

## 🔄 Migrando Cores Hardcoded

### Antes (❌):
```jsx
const estilo = {
  backgroundColor: '#44b774',
  color: '#ffffff',
  border: '1px solid #e0e0e0'
};
```

### Depois (✅):
```jsx
const colors = useColors();
const estilo = {
  backgroundColor: colors.primary,
  color: colors.textInverse,
  border: `1px solid ${colors.border}`
};
```

### Ou usando CSS (✅):
```jsx
const estilo = {
  backgroundColor: 'var(--color-primary)',
  color: 'var(--text-inverse)',
  border: '1px solid var(--border-color)'
};
```

## 🎨 Exemplos Práticos

### Botão Personalizado:
```jsx
const BotaoCustomizado = ({ variant = 'primary', children }) => {
  const colors = useColors();
  
  const estilos = {
    primary: colors.getButtonStyle(colors.primary),
    secondary: colors.getButtonStyle(colors.secondary),
    success: colors.getButtonStyle(colors.success),
    error: colors.getButtonStyle(colors.error),
  };
  
  return (
    <button style={estilos[variant]}>
      {children}
    </button>
  );
};
```

### Card com Status:
```jsx
const CardStatus = ({ status, children }) => {
  const colors = useColors();
  
  return (
    <div style={colors.getCardStyle(true)}>
      <div style={colors.getStatusStyle(status)}>
        {status}
      </div>
      {children}
    </div>
  );
};
```

### Input com Validação:
```jsx
const InputValidacao = ({ erro, ...props }) => {
  const colors = useColors();
  
  const estilo = {
    ...colors.getInputStyle(),
    borderColor: erro ? colors.error : colors.border,
  };
  
  return <input style={estilo} {...props} />;
};
```

## 🚀 Dicas e Melhores Práticas

1. **Use sempre o sistema de cores**: Evite cores hardcoded
2. **Prefira o hook useColors**: É mais fácil e oferece mais funcionalidades
3. **Use as funções utilitárias**: Para manipular cores de forma consistente
4. **Teste em ambos os temas**: Claro e escuro
5. **Use classes CSS para estilos simples**: São mais performáticas
6. **Documente cores customizadas**: Se criar novas cores, documente o uso

## 🔍 Troubleshooting

### Problema: Cores não estão mudando
- Verifique se importou o hook corretamente
- Certifique-se de que está dentro do ThemeProvider
- Limpe o cache do navegador

### Problema: Tema escuro não funciona
- Verifique se as variáveis CSS estão sendo aplicadas
- Confirme que o seletor `[data-theme="dark"]` está correto

### Problema: Performance
- Use variáveis CSS para estilos estáticos
- Use o hook apenas quando precisar de lógica dinâmica

## 📞 Suporte

Se tiver dúvidas sobre o sistema de cores, consulte:
1. Este README
2. Os comentários nos arquivos de código
3. Os exemplos nos componentes existentes