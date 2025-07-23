# Sistema de Distribuição de Tickets com Chatbot Desabilitado

## Visão Geral

Implementação que modifica o comportamento de distribuição de tickets "sem fila" baseado no status da configuração `chatbotAutoMode`. Quando o chatbot está desabilitado, tickets "sem fila" aparecem para **todos os usuários da empresa**, independentemente de terem filas atribuídas.

## Comportamento por Configuração

### Chatbot Habilitado (`chatbotAutoMode = 'enabled'`)
- **Comportamento Original**: Tickets "sem fila" aparecem apenas para usuários que têm filas atribuídas
- **Lógica**: Mantém compatibilidade com sistema existente

### Chatbot Desabilitado (`chatbotAutoMode = 'disabled'`)
- **Novo Comportamento**: Tickets "sem fila" aparecem para **todos os usuários da empresa**
- **Objetivo**: Permitir que qualquer usuário possa aceitar tickets novos

## Fluxo de Funcionamento

### Quando Chatbot está Desabilitado

1. **Ticket Novo Chega "Sem Fila"**
   - Cliente envia mensagem
   - Ticket criado com `queueId = null`, `status = "pending"`
   - Ticket aparece na aba "aguardando" de **todos os usuários da empresa**

2. **Visualização para Diferentes Tipos de Usuário**
   - **Usuário com filas**: vê tickets das suas filas + tickets sem fila
   - **Usuário sem filas**: vê apenas tickets sem fila
   - **Todos os usuários**: podem aceitar tickets sem fila

3. **Usuário Aceita Ticket**
   - Qualquer usuário pode clicar em "aceitar"
   - Sistema automaticamente atribui fila do usuário (se ele tiver)
   - Ticket muda para `status = "open"` com fila atribuída

## Implementação Técnica

### Arquivo Modificado: `ListTicketsService.ts`

#### Verificação do Status do Chatbot
```typescript
// Verificar se o chatbot está desabilitado
const chatbotAutoModeSetting = await Setting.findOne({
  where: { key: "chatbotAutoMode", companyId }
});
const isChatbotDisabled = chatbotAutoModeSetting?.value === 'disabled';
```

#### Lógica Principal
```typescript
// Nova lógica: quando chatbot está desabilitado, tickets "sem fila" aparecem para TODOS os usuários
if (queueCondition !== null) {
  if (isChatbotDisabled) {
    // Chatbot desabilitado: sempre incluir tickets sem fila para todos os usuários
    if (!includeNoQueue) {
      (whereCondition as any).queueId = {
        [Op.or]: [
          queueCondition,
          { [Op.is]: null }
        ]
      };
    }
  } else {
    // Chatbot habilitado: lógica original (apenas para usuários com filas)
    if (userQueueIds.length > 0) {
      // Lógica original mantida
    }
  }
}
```

#### Casos Sem Filtros Específicos
```typescript
if (isChatbotDisabled) {
  // Chatbot desabilitado: mostrar tickets das filas do usuário + tickets sem fila (para todos)
  if (userQueueIds.length > 0) {
    const queueFilter = { 
      [Op.or]: [
        { [Op.in]: userQueueIds }, 
        { [Op.is]: null }
      ] 
    };
    (whereCondition as any).queueId = queueFilter;
  } else {
    // Usuário sem filas: mostrar apenas tickets sem fila
    (whereCondition as any).queueId = { [Op.is]: null };
  }
}
```

## Cenários de Teste

### Cenário 1: Chatbot Habilitado
- **Usuário com fila**: vê tickets da sua fila + tickets sem fila
- **Usuário sem fila**: não vê tickets sem fila
- **Resultado**: Comportamento original mantido

### Cenário 2: Chatbot Desabilitado
- **Usuário com fila**: vê tickets da sua fila + tickets sem fila
- **Usuário sem fila**: vê tickets sem fila
- **Resultado**: Todos podem aceitar tickets sem fila

### Cenário 3: Filtros Específicos + Chatbot Desabilitado
- **Usuário seleciona fila específica**: vê tickets da fila selecionada + tickets sem fila
- **Usuário seleciona "sem fila"**: vê apenas tickets sem fila
- **Resultado**: Filtros funcionam + tickets sem fila sempre incluídos

## Logs de Debug

O sistema inclui logs detalhados para facilitar o debug:

```
[ListTicketsService] User 123 has queues: [1, 2, 3]
[ListTicketsService] queueCondition: { [Op.in]: [1, 2] }
[ListTicketsService] status: pending
[ListTicketsService] isChatbotDisabled: true
[ListTicketsService] Chatbot disabled - including no-queue tickets for all users
```

## Configuração da Empresa

### Como Verificar Status do Chatbot
```sql
SELECT key, value, companyId 
FROM Settings 
WHERE key = 'chatbotAutoMode' AND companyId = [COMPANY_ID];
```

### Como Alterar Status do Chatbot
```sql
-- Desabilitar chatbot (tickets sem fila para todos)
UPDATE Settings 
SET value = 'disabled' 
WHERE key = 'chatbotAutoMode' AND companyId = [COMPANY_ID];

-- Habilitar chatbot (comportamento original)
UPDATE Settings 
SET value = 'enabled' 
WHERE key = 'chatbotAutoMode' AND companyId = [COMPANY_ID];
```

## Benefícios da Implementação

1. **Flexibilidade**: Comportamento diferente baseado na configuração
2. **Compatibilidade**: Mantém funcionamento original quando chatbot habilitado
3. **Distribuição Ampla**: Quando desabilitado, todos podem aceitar tickets
4. **Controle Granular**: Configuração por empresa
5. **Logs Detalhados**: Facilita debug e monitoramento

## Casos de Uso

### Empresa com Chatbot Desabilitado
- **Cenário**: Empresa prefere atendimento manual
- **Comportamento**: Tickets novos aparecem para todos os usuários
- **Vantagem**: Maior flexibilidade na distribuição

### Empresa com Chatbot Habilitado
- **Cenário**: Empresa usa chatbot para triagem automática
- **Comportamento**: Tickets sem fila apenas para usuários com filas
- **Vantagem**: Mantém organização por setores

## Limitações

1. **Configuração Global**: Afeta toda a empresa, não por usuário
2. **Dependência de Configuração**: Requer configuração correta do `chatbotAutoMode`
3. **Performance**: Consulta adicional ao banco para verificar configuração

## Monitoramento

### Métricas Importantes
- Número de tickets sem fila por período
- Tempo médio para aceitação de tickets sem fila
- Distribuição de aceitação entre usuários

### Alertas Recomendados
- Tickets sem fila não aceitos por muito tempo
- Configuração de chatbot alterada
- Usuários sem filas aceitando muitos tickets

## Conclusão

A implementação permite que empresas tenham controle total sobre como tickets "sem fila" são distribuídos, oferecendo flexibilidade para diferentes modelos de atendimento enquanto mantém compatibilidade com o sistema existente.