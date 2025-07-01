# Implementação: Avaliação Automática via WhatsApp

## 📋 Resumo da Implementação

Foi implementado um sistema de **avaliação automática** que envia uma solicitação de avaliação via WhatsApp sempre que uma conversa (ticket) for resolvida/fechada.

## 🚀 Funcionalidades Implementadas

### ✅ Envio Automático de Avaliação
- Quando um ticket é fechado, o sistema automaticamente envia uma mensagem de avaliação
- Mensagem personalizada com emojis e opções claras (1-3)
- Suporte para WhatsApp, Facebook e Instagram

### ✅ Configuração por Empresa
- Cada empresa pode habilitar/desabilitar a funcionalidade
- Configuração independente via API
- Por padrão, novas empresas têm a avaliação automática **habilitada**

### ✅ Mensagem Personalizada
```
🌟 AVALIAÇÃO DO ATENDIMENTO 🌟

Como você avalia nosso atendimento?

1 - 😡 Insatisfeito
2 - 🙄 Satisfeito
3 - 😁 Muito Satisfeito

Sua opinião é muito importante para melhorarmos nossos serviços! 🙏

Digite apenas o número correspondente à sua avaliação.
```

### ✅ Processamento de Respostas
- Sistema processa automaticamente as respostas (1, 2 ou 3)
- Salva a avaliação no banco de dados
- Finaliza o ticket após a avaliação

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
1. **`src/services/TicketServices/AutoRatingService.ts`** - Serviço principal
2. **`src/controllers/AutoRatingController.ts`** - Controlador da API
3. **`src/routes/autoRatingRoutes.ts`** - Rotas da API
4. **`src/scripts/setupAutoRating.ts`** - Script de configuração
5. **`src/database/migrations/20250101000000-add-auto-rating-setting.ts`** - Migração
6. **`docs/AUTO_RATING_SYSTEM.md`** - Documentação técnica

### Arquivos Modificados
1. **`src/services/TicketServices/UpdateTicketService.ts`** - Integração com avaliação automática
2. **`src/services/CompanyService/CreateCompanyService.ts`** - Configuração para novas empresas
3. **`src/routes/index.ts`** - Registro das novas rotas
4. **`src/database/seeds/20200904070007-create-default-settings.ts`** - Configuração padrão
5. **`package.json`** - Novo script de configuração

## 🔧 Como Usar

### 1. Executar Migração (Para Empresas Existentes)
```bash
cd backend
npm run db:migrate
```

### 2. Configurar Empresas Existentes
```bash
# Configurar todas as empresas existentes
npm run script:auto-rating setup

# Verificar status das configurações
npm run script:auto-rating status
```

### 3. Gerenciar via API

#### Verificar Status
```bash
GET /auto-rating/status
Authorization: Bearer <token>
```

#### Habilitar/Desabilitar
```bash
PUT /auto-rating/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true
}
```

#### Obter Todas as Configurações
```bash
GET /auto-rating/settings
Authorization: Bearer <token>
```

## 🎯 Fluxo de Funcionamento

1. **Usuário fecha um ticket** no sistema
2. **Sistema verifica** se avaliação automática está habilitada
3. **Se habilitada**, envia mensagem de avaliação via WhatsApp
4. **Cliente responde** com número (1, 2 ou 3)
5. **Sistema processa** a resposta e salva no banco
6. **Ticket é finalizado** automaticamente

## ⚙️ Configurações

### Banco de Dados
- **Tabela**: `Settings`
- **Chave**: `autoRating`
- **Valores**: `enabled` | `disabled`
- **Padrão**: `enabled`

### Personalização da Mensagem
A mensagem pode ser personalizada através do campo `ratingMessage` na configuração do WhatsApp de cada empresa.

## 🔍 Monitoramento

### Logs
O sistema gera logs detalhados para:
- Envio de avaliações automáticas
- Processamento de respostas
- Erros e problemas

### Verificação
```bash
# Verificar status de todas as empresas
npm run script:auto-rating status
```

## 🚨 Troubleshooting

### Problema: Avaliação não é enviada
**Soluções:**
1. Verificar se `autoRating` está habilitado para a empresa
2. Verificar se o ticket não foi fechado forçadamente
3. Verificar logs de erro no console

### Problema: Cliente não recebe mensagem
**Soluções:**
1. Verificar se o WhatsApp está conectado
2. Verificar se o número do cliente é válido
3. Verificar logs de envio de mensagem

### Problema: Resposta não é processada
**Soluções:**
1. Verificar se cliente respondeu com número válido (1-3)
2. Verificar se o sistema de avaliação está funcionando
3. Verificar logs do processamento de mensagens

## 📊 Impacto

### Benefícios
- ✅ **Automação completa** do processo de avaliação
- ✅ **Melhoria na experiência** do cliente
- ✅ **Coleta sistemática** de feedback
- ✅ **Configuração flexível** por empresa
- ✅ **Integração transparente** com o sistema existente

### Compatibilidade
- ✅ WhatsApp (Baileys 6.x)
- ✅ Facebook Messenger
- ✅ Instagram Direct
- ✅ Sistema de avaliação legado mantido

## 🔄 Próximos Passos

1. **Testar** em ambiente de produção
2. **Monitorar** logs e métricas
3. **Ajustar** mensagens conforme feedback
4. **Implementar** relatórios de avaliação (se necessário)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do sistema
2. Executar script de verificação: `npm run script:auto-rating status`
3. Consultar documentação técnica em `docs/AUTO_RATING_SYSTEM.md`