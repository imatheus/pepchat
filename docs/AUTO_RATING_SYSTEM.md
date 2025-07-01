# Sistema de Avaliação Automática

## Visão Geral

O sistema de avaliação automática foi implementado para enviar automaticamente uma solicitação de avaliação via WhatsApp quando uma conversa (ticket) for resolvida/fechada.

## Funcionalidades

### 1. Envio Automático
- Quando um ticket é fechado, o sistema automaticamente envia uma mensagem de avaliação para o cliente
- A mensagem é enviada apenas se a configuração `autoRating` estiver habilitada
- Não é enviada se o ticket for fechado forçadamente (parâmetro `justClose`)

### 2. Mensagem Personalizada
A mensagem de avaliação inclui:
- Mensagem personalizada configurada no WhatsApp (campo `ratingMessage`)
- Opções de avaliação (1-3)
- Emojis para melhor experiência visual
- Texto explicativo sobre a importância da avaliação

### 3. Configuração por Empresa
- Cada empresa pode habilitar/desabilitar a avaliação automática
- Configuração independente do sistema de avaliação manual legado
- Por padrão, novas empresas têm a avaliação automática habilitada

## Estrutura Técnica

### Arquivos Principais

1. **AutoRatingService.ts** - Serviço principal para envio de avaliações
2. **UpdateTicketService.ts** - Modificado para integrar com o sistema automático
3. **AutoRatingController.ts** - Controlador para gerenciar configurações
4. **autoRatingRoutes.ts** - Rotas da API

### Configurações

#### Chave de Configuração
- **Key**: `autoRating`
- **Valores**: `enabled` | `disabled`
- **Padrão**: `enabled`

#### Endpoints da API

```
GET /auto-rating/status
- Retorna o status atual da avaliação automática

PUT /auto-rating/status
- Atualiza o status da avaliação automática
- Body: { "enabled": boolean }

GET /auto-rating/settings
- Retorna todas as configurações de avaliação
```

### Fluxo de Funcionamento

1. **Fechamento do Ticket**
   - Usuário fecha um ticket no sistema
   - `UpdateTicketService` é chamado com `status: "closed"`

2. **Verificação de Configuração**
   - Sistema verifica se `autoRating` está habilitado
   - Verifica se já foi enviada uma avaliação para este ticket

3. **Envio da Mensagem**
   - Se habilitado e não enviado, chama `AutoRatingService`
   - Monta mensagem personalizada com opções de avaliação
   - Envia via WhatsApp, Facebook ou Instagram

4. **Atualização do Tracking**
   - Marca `ratingAt` com timestamp atual
   - Define `rated: false` para aguardar resposta

5. **Processamento da Resposta**
   - Cliente responde com número (1, 2 ou 3)
   - Sistema processa via `handleRating` no `wbotMessageListener`
   - Cria registro em `UserRating`
   - Finaliza o ticket

### Banco de Dados

#### Tabela Settings
```sql
INSERT INTO Settings (key, value, companyId) 
VALUES ('autoRating', 'enabled', 1);
```

#### Tabela TicketTraking
- `ratingAt`: Timestamp quando avaliação foi enviada
- `rated`: Boolean indicando se foi respondida

#### Tabela UserRatings
- `ticketId`: ID do ticket avaliado
- `rate`: Nota (1-3)
- `userId`: ID do usuário que atendeu
- `companyId`: ID da empresa

## Migração

### Para Empresas Existentes
Execute a migração para adicionar a configuração:
```bash
npm run db:migrate
```

### Para Novas Empresas
A configuração é criada automaticamente no `CreateCompanyService`.

## Personalização

### Mensagem de Avaliação
A mensagem pode ser personalizada através do campo `ratingMessage` na configuração do WhatsApp:

1. Acesse Configurações > WhatsApp
2. Edite o campo "Mensagem de Avaliação"
3. A mensagem será usada como prefixo da solicitação de avaliação

### Opções de Avaliação
Atualmente fixas:
- **1** - 😡 Insatisfeito
- **2** - 🙄 Satisfeito  
- **3** - 😁 Muito Satisfeito

## Logs e Monitoramento

O sistema gera logs para:
- Envio de avaliações automáticas
- Erros no processo
- Status das configurações

Logs podem ser encontrados nos arquivos de log da aplicação.

## Compatibilidade

### Canais Suportados
- ✅ WhatsApp
- ✅ Facebook Messenger
- ✅ Instagram Direct

### Versões
- Backend: Node.js + TypeScript
- Banco: PostgreSQL/MySQL
- WhatsApp: Baileys 6.x

## Troubleshooting

### Avaliação não é enviada
1. Verificar se `autoRating` está habilitado
2. Verificar se ticket não foi fechado com `justClose: true`
3. Verificar logs de erro no console

### Mensagem não personalizada
1. Verificar campo `ratingMessage` no WhatsApp
2. Verificar se empresa tem configuração válida

### Avaliação não é processada
1. Verificar se cliente respondeu com número válido (1-3)
2. Verificar logs do `wbotMessageListener`
3. Verificar se `TicketTraking` tem `ratingAt` definido