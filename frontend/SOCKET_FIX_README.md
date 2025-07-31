# Socket Connection Fix - Correção de Múltiplas Conexões WebSocket

## Problema Identificado

O erro `WebSocket connection to 'wss://app.pepchat.com.br/socket.io/?companyId=null&userId=2&EIO=4&transport=websocket' failed` estava ocorrendo devido a:

1. **Múltiplas conexões WebSocket**: Muitos componentes criavam conexões independentes usando `socketConnection()` diretamente
2. **companyId=null**: Alguns componentes não conseguiam obter o companyId corretamente
3. **Sobrecarga de CORS**: Muitas tentativas de conexão simultâneas sobrecarregavam o servidor
4. **URL incorreta**: O frontend estava tentando conectar em `localhost:8080/api` em vez de `localhost:8080`

## Soluções Implementadas

### 1. Correção da URL do WebSocket
- **Problema**: APIs HTTP usam `/api` (ex: `https://app.pepchat.com.br/api/plans/public`)
- **Solução**: WebSocket conecta no domínio base (ex: `https://app.pepchat.com.br`)
- **Implementação**: O código automaticamente remove `/api` da URL para conexões WebSocket

### 2. Melhoria do Socket Service
- **Arquivo**: `frontend/src/services/socket.js`
- **Melhorias**:
  - Cache de conexão para evitar múltiplas conexões
  - Validação de companyId antes de criar conexão
  - URL correta do backend (remove `/api` automaticamente)
  - Limite de tentativas de reconexão (5 em vez de infinitas)
  - Logs mais informativos para debug

### 3. Aprimoramento do SocketManager
- **Arquivo**: `frontend/src/services/socketManager.js`
- **Melhorias**:
  - Gerenciamento robusto de conexões assíncronas
  - Prevenção de múltiplas tentativas de conexão simultâneas
  - Reconexão automática inteligente com limite de tentativas
  - Melhor tratamento de erros
  - Status de conexão detalhado

### 4. Hook useSocket para Componentes
- **Arquivo**: `frontend/src/hooks/useSocket.js` (NOVO)
- **Funcionalidades**:
  - Interface simplificada para componentes
  - Gerenciamento automático de listeners
  - Cleanup automático na desmontagem do componente
  - Uso do singleton socketManager

### 5. Atualização do Layout Principal
- **Arquivo**: `frontend/src/layout/index.jsx`
- **Mudanças**:
  - Uso do `socketManager` em vez de `socketConnection` direto
  - Melhor tratamento de erros
  - Cleanup adequado de listeners

## Como Migrar Outros Componentes

### Padrão Antigo (EVITAR):
```javascript
import { socketConnection } from "../../services/socket";

// No useEffect
const socket = socketConnection({ companyId });
socket.on('evento', callback);

// Cleanup
return () => {
  socket.disconnect(); // ❌ Desconecta para todos!
};
```

### Padrão Novo (RECOMENDADO):

#### Opção 1: Usar o Hook useSocket
```javascript
import useSocket from "../../hooks/useSocket";

const MyComponent = () => {
  const companyId = localStorage.getItem("companyId");
  const { on, off, emit, isConnected } = useSocket(companyId);

  useEffect(() => {
    const handleEvent = (data) => {
      // Processar evento
    };

    on('evento', handleEvent);

    return () => {
      off('evento'); // ✅ Remove apenas este listener
    };
  }, [on, off]);

  const sendMessage = () => {
    emit('evento', data);
  };
};
```

#### Opção 2: Usar socketManager Diretamente
```javascript
import { socketManager } from "../../services/socketManager";

const MyComponent = () => {
  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    
    const connectSocket = async () => {
      try {
        await socketManager.connect(companyId);
        
        socketManager.on('evento', handleEvent);
      } catch (error) {
        console.error('Failed to connect socket', error);
      }
    };

    connectSocket();

    return () => {
      socketManager.off('evento'); // ✅ Remove apenas este listener
    };
  }, []);
};
```

## Componentes que Precisam ser Migrados

Os seguintes componentes ainda usam `socketConnection` diretamente e devem ser migrados:

### Críticos (Alta Prioridade):
- `src/components/Ticket/index.jsx`
- `src/components/TicketsList/index.jsx`
- `src/components/MessagesList/index.jsx`
- `src/components/NotificationsPopOver/index.jsx`

### Importantes (Média Prioridade):
- `src/pages/Contacts/index.jsx`
- `src/pages/Users/index.jsx`
- `src/pages/Settings/index.jsx`
- `src/pages/Queues/index.jsx`

### Outros (Baixa Prioridade):
- Todos os outros componentes listados no arquivo de busca

## Benefícios da Migração

1. **Performance**: Uma única conexão WebSocket em vez de múltiplas
2. **Estabilidade**: Menos erros de conexão e CORS
3. **Manutenibilidade**: Código mais limpo e consistente
4. **Debug**: Logs mais informativos para troubleshooting
5. **Recursos**: Menor uso de memória e CPU

## Verificação da Correção

Para verificar se a correção funcionou:

1. Abra o DevTools do navegador
2. Vá para a aba Network
3. Filtre por "WS" (WebSocket)
4. Deve haver apenas UMA conexão WebSocket ativa
5. A URL deve ser `ws://localhost:8080/socket.io/` (sem `/api` e sem `companyId=null`)

## Monitoramento

Para monitorar o status da conexão:

```javascript
import { socketManager } from "../services/socketManager";

// Verificar status
const status = socketManager.getConnectionStatus();
console.log('Socket Status:', status);
// Output: { connected: true, connecting: false, companyId: "1", retryCount: 0 }
```

## Troubleshooting

### Se ainda aparecer "companyId=null":
1. Verificar se `localStorage.getItem("companyId")` retorna um valor válido
2. Verificar se o usuário está logado corretamente
3. Verificar se o tokenManager está funcionando

### Se ainda houver múltiplas conexões:
1. Verificar se todos os componentes foram migrados
2. Procurar por `socketConnection` no código
3. Substituir por `socketManager` ou `useSocket`

### Se a conexão falhar:
1. Verificar se o backend está rodando na porta 8080
2. Verificar se a URL no `.env` está correta
3. Verificar logs do console para erros específicos