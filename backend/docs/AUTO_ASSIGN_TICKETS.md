# Sistema de Auto-Atribuição de Tickets

## Visão Geral

O sistema de auto-atribuição de tickets foi implementado para distribuir automaticamente tickets "sem fila" para usuários que pertencem a filas quando o modo automático do chatbot está desabilitado.

## Como Funciona

### Condições para Ativação

A auto-atribuição é ativada quando:
1. O modo automático do chatbot está **desabilitado** (`chatbotAutoMode = 'disabled'`)
2. Existem tickets com status `pending` sem fila (`queueId = null`) e sem usuário atribuído (`userId = null`)
3. Existem usuários que pertencem a pelo menos uma fila

### Algoritmo de Distribuição

1. **Busca de Tickets**: Localiza todos os tickets "sem fila" na aba "aguardando" (status `pending`)
2. **Busca de Usuários**: Encontra todos os usuários que pertencem a pelo menos uma fila
3. **Cálculo de Carga**: Calcula a carga de trabalho atual de cada usuário (tickets ativos: `open` + `pending`)
4. **Distribuição Balanceada**: Distribui os tickets usando round-robin baseado na menor carga de trabalho
5. **Seleção de Fila**: Para cada usuário, seleciona a fila com menor carga de trabalho

### Execução Automática

- **Periodicidade**: Executa a cada 2 minutos para todas as empresas ativas
- **Trigger Imediato**: Quando um novo ticket "sem fila" é criado, dispara execução imediata
- **Processamento em Background**: Usa filas Redis quando disponível, senão executa diretamente

## Arquivos Implementados

### Serviços Principais

1. **`AutoAssignTicketService.ts`**
   - Lógica principal de distribuição de tickets
   - Verifica configurações do chatbot
   - Calcula carga de trabalho dos usuários
   - Distribui tickets de forma balanceada

2. **`ProcessAutoAssignJob.ts`**
   - Processador de jobs para execução em background
   - Integração com sistema de filas Redis

3. **`InitAutoAssignService.ts`**
   - Inicialização do serviço de auto-atribuição
   - Configuração de jobs periódicos
   - Execução imediata para empresas específicas

### Integração com Sistema Existente

1. **`FindOrCreateTicketService.ts`** (modificado)
   - Dispara auto-atribuição quando novo ticket "sem fila" é criado
   - Execução assíncrona para não bloquear criação do ticket

2. **`queues.ts`** (modificado)
   - Adicionada nova fila `AutoAssignQueue`
   - Configuração de processadores e event listeners

3. **`server.ts`** (modificado)
   - Inicialização do serviço durante startup da aplicação

### API Endpoints

1. **`POST /auto-assign/execute`**
   - Executa auto-atribuição para empresa do usuário logado
   - Requer autenticação

2. **`POST /auto-assign/execute-all`**
   - Executa auto-atribuição para todas as empresas
   - Apenas super admins

### Controllers e Rotas

1. **`AutoAssignController.ts`**
   - Endpoints para execução manual da auto-atribuição
   - Controle de permissões

2. **`autoAssignRoutes.ts`**
   - Definição das rotas da API
   - Middleware de autenticação

## Configuração

### Variáveis de Ambiente

O sistema usa as configurações existentes do Redis:
- `IO_REDIS_SERVER`: Servidor Redis (padrão: 127.0.0.1)
- `IO_REDIS_PORT`: Porta Redis (padrão: 6379)
- `IO_REDIS_PASSWORD`: Senha Redis (opcional)

### Configuração do Chatbot

A auto-atribuição é controlada pela configuração `chatbotAutoMode`:
- `enabled`: Chatbot automático ativo (auto-atribuição **desabilitada**)
- `disabled`: Chatbot automático inativo (auto-atribuição **ativada**)

## Logs e Monitoramento

### Logs Principais

- Inicialização do serviço
- Execução de jobs de auto-atribuição
- Tickets atribuídos com detalhes (usuário, fila, empresa)
- Erros e exceções

### Métricas

- Número de tickets distribuídos por execução
- Carga de trabalho dos usuários
- Tempo de execução dos jobs

## Benefícios

1. **Distribuição Automática**: Tickets "sem fila" são automaticamente distribuídos
2. **Balanceamento de Carga**: Usuários recebem tickets baseado em sua carga atual
3. **Resposta Rápida**: Execução imediata quando novos tickets são criados
4. **Flexibilidade**: Pode ser executado manualmente via API
5. **Escalabilidade**: Usa sistema de filas Redis para performance

## Casos de Uso

### Cenário Principal
- Empresa desabilita chatbot automático
- Clientes enviam mensagens criando tickets "sem fila"
- Sistema distribui automaticamente para usuários disponíveis
- Usuários veem tickets na aba "aguardando" já atribuídos a eles

### Execução Manual
- Administrador pode forçar redistribuição via API
- Útil após mudanças na configuração de usuários/filas
- Super admins podem executar para todas as empresas

## Limitações

1. Apenas funciona quando `chatbotAutoMode = 'disabled'`
2. Requer usuários com filas atribuídas
3. Não redistribui tickets já atribuídos
4. Execução limitada a tickets com status `pending`

## Troubleshooting

### Tickets não sendo distribuídos
1. Verificar se `chatbotAutoMode` está desabilitado
2. Confirmar se existem usuários com filas atribuídas
3. Verificar logs de execução do serviço
4. Testar execução manual via API

### Performance
1. Monitorar logs de execução dos jobs
2. Verificar conexão com Redis
3. Ajustar periodicidade se necessário (atualmente 2 minutos)

### Debugging
1. Logs detalhados em `logger.info` e `logger.error`
2. Endpoint de execução manual para testes
3. Verificação de configurações via banco de dados