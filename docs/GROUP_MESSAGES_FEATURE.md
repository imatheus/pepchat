# Funcionalidade: Receber Mensagens de Grupos

## Descrição
Esta funcionalidade permite que os usuários controlem se o sistema deve processar ou ignorar mensagens vindas de grupos do WhatsApp.

## Como Funciona

### Configuração
- **Localização**: `/settings` → "Ignorar Mensagens de Grupos"
- **Opções**:
  - **Desativado**: O sistema processa mensagens de grupos normalmente
  - **Ativado**: O sistema ignora todas as mensagens vindas de grupos

### Comportamento Técnico

#### Quando DESATIVADO (valor: "disabled")
- Mensagens de grupos são processadas normalmente
- Tickets são criados para grupos
- Chatbot funciona em grupos (se configurado)
- Todas as funcionalidades do sistema funcionam para grupos

#### Quando ATIVADO (valor: "enabled")
- Mensagens de grupos são completamente ignoradas
- Não são criados tickets para mensagens de grupos
- Não há processamento de chatbot para grupos
- Sistema funciona apenas para conversas individuais

## Implementação Técnica

### Backend

#### Arquivos Modificados:
1. **`CreateCompanyService.ts`**: Corrigido erro na criação da configuração
2. **`MessageFilterService.ts`**: Implementada lógica de filtro de grupos
3. **`wbotMessageListener.ts`**: Já utilizava o filtro (sem modificações necessárias)

#### Função Principal:
```typescript
export const shouldIgnoreGroupMessage = async (
  msg: proto.IWebMessageInfo,
  companyId: number
): Promise<boolean>
```

#### Lógica:
1. Verifica se a mensagem é de um grupo (`@g.us`)
2. Consulta a configuração `CheckMsgIsGroup` da empresa
3. Se configuração = "enabled", ignora a mensagem
4. Se configuração = "disabled" ou não existe, processa normalmente

### Frontend

#### Arquivo Modificado:
- **`Options.jsx`**: Interface de configuração já existia, apenas melhorada

#### Melhorias Implementadas:
- Estado de loading durante atualização
- Mensagem de sucesso específica
- Tratamento de erros aprimorado

### Banco de Dados

#### Tabela: `Settings`
- **key**: `"CheckMsgIsGroup"`
- **value**: `"enabled"` ou `"disabled"`
- **companyId**: ID da empresa

#### Valor Padrão:
- Novas empresas: `"enabled"` (ignora grupos por padrão)
- Empresas existentes: Mantém configuração atual

## Scripts de Manutenção

### Correção de Configurações
Arquivo: `scripts/fixGroupMessageSettings.ts`

**Função**: Corrige configurações criadas incorretamente devido ao bug anterior

**Execução**:
```bash
cd backend
npm run ts-node src/scripts/fixGroupMessageSettings.ts
```

## Logs

### Quando Mensagem de Grupo é Ignorada:
```
INFO: Ignoring group message from 123456789@g.us - Group messages disabled for company 1
```

### Em Caso de Erro:
```
ERROR: Error checking group message setting
```

## Testes

### Teste Manual:
1. Acesse `/settings`
2. Configure "Ignorar Mensagens de Grupos" como "Ativado"
3. Envie mensagem em um grupo
4. Verifique que não foi criado ticket
5. Configure como "Desativado"
6. Envie mensagem em um grupo
7. Verifique que foi criado ticket normalmente

### Verificação de Logs:
- Monitore os logs do backend para confirmar o comportamento
- Mensagens ignoradas devem aparecer nos logs

## Compatibilidade

### Baileys:
- ✅ Suporte completo para grupos
- ✅ Detecção de mensagens de grupos via `@g.us`
- ✅ Obtenção de metadados de grupos

### Funcionalidades Afetadas:
- **Tickets**: Não criados para grupos quando ativado
- **Chatbot**: Não funciona em grupos quando ativado
- **Avaliações**: Não aplicáveis a grupos quando ativado
- **Campanhas**: Não enviadas para grupos quando ativado

## Considerações

### Performance:
- Consulta adicional ao banco por mensagem
- Impacto mínimo devido ao cache do Sequelize
- Filtro aplicado antes do processamento principal

### Segurança:
- Configuração por empresa (isolamento)
- Fallback seguro em caso de erro (não ignora)
- Logs para auditoria

### Manutenibilidade:
- Código bem documentado
- Testes unitários recomendados
- Monitoramento via logs

## Próximos Passos Recomendados

1. **Testes Automatizados**: Criar testes unitários para a funcionalidade
2. **Métricas**: Adicionar métricas de mensagens ignoradas
3. **Interface Melhorada**: Adicionar contador de mensagens ignoradas
4. **Configuração Avançada**: Permitir whitelist de grupos específicos