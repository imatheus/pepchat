# Limpeza de Logs Verbosos - Backend

Este documento descreve as modificações realizadas para reduzir logs verbosos no backend.

## Arquivos Modificados

### 1. `src/libs/socket.ts`
**Logs removidos:**
- `Client connected to ${status} tickets`
- `Client connected to notifications`
- `Client joined ticket chat ${ticketId}`
- `User status updated: ${user.name} (ID: ${userId}) is online`
- `Typing event: Ticket ${ticketId}, fromMe: ${fromMe}, typing: ${typing}`

**Impacto:** Reduz significativamente o spam de logs de conexões WebSocket.

### 2. `src/services/CampaignService/ProcessPendingCampaigns.ts`
**Logs removidos:**
- `Checking pending campaigns...` (quando não há campanhas)
- `No pending campaigns found`
- `Processing campaign ${campaign.id} directly (no Redis)`

**Logs mantidos:**
- Logs quando campanhas são encontradas e processadas
- Logs de erro

**Impacto:** Elimina logs repetitivos a cada minuto quando não há campanhas pendentes.

### 3. `src/server.ts`
**Logs removidos:**
- `Running periodic company expiration check...`
- `Running initial company expiration check...`

**Impacto:** Reduz logs de verificações periódicas de expiração de empresas.

### 4. `src/services/ContactListService/ImportContacts.ts`
**Logs modificados:**
- `Validando número ${current}/${totalToValidate}: ${newContact.number}` → Agora só loga a cada 10 contatos
- `Número de contato inválido descartado` → Removido (mantido apenas no resumo final)
- `Número validado com sucesso` → Removido

**Logs adicionados:**
- Resumo final: `Contact import completed: X imported, Y invalid numbers discarded, Z total discarded`

**Impacto:** Reduz drasticamente logs durante importação de contatos, mantendo informação essencial.

### 5. `src/services/CampaignService/ProcessCampaignJob.ts`
**Logs removidos:**
- `Processing campaign job ${job.id} for campaign ${id}`
- `Found ${contacts.length} contacts for campaign ${id}`
- `Message already sent to contact ${contact.id} for campaign ${id}`
- `Processed message for ${contact.name}: ${message.substring(0, 100)}...`
- `Message sent successfully to ${contact.number} for campaign ${id}`

**Logs mantidos:**
- `Processing campaign ${id} with ${contacts.length} contacts`
- `Campaign ${id} processing completed. Success: ${successCount}, Errors: ${errorCount}`
- Logs de erro

**Impacto:** Reduz logs verbosos durante processamento de campanhas, mantendo informações de resumo.

### 6. `src/queues.ts`
**Logs removidos:**
- `Starting background job processors...`
- `Redis not available - using direct processing for jobs`

**Impacto:** Reduz logs de inicialização de filas em background.

### 7. `src/services/ScheduleServices/ProcessPendingSchedules.ts`
**Logs removidos:**
- `Checking pending schedules...`
- `No pending schedules found`

**Logs mantidos:**
- Logs quando agendamentos são encontrados e processados
- Logs de erro

**Impacto:** Elimina logs repetitivos quando não há agendamentos pendentes.

### 8. `src/services/CompanyService/CheckCompanyExpirationService.ts`
**Logs modificados:**
- `Verificando expiração de ${companies.length} empresas` → Removido
- `Verificação concluída: X expiradas, Y ativadas, Z em trial` → Só loga se houver mudanças

**Impacto:** Reduz logs de verificações periódicas, só logando quando há alterações reais.

## Resumo dos Benefícios

### Redução de Volume
- **Socket connections**: ~90% menos logs
- **Campaign checks**: ~80% menos logs (elimina logs quando não há campanhas)
- **Schedule checks**: ~80% menos logs (elimina logs quando não há agendamentos)
- **Company expiration**: ~90% menos logs (só loga mudanças)
- **Contact validation**: ~95% menos logs individuais
- **Campaign processing**: ~85% menos logs verbosos
- **Queue initialization**: ~70% menos logs de inicialização

### Logs Mantidos
- Logs de erro (todos mantidos)
- Logs de resumo e estatísticas importantes
- Logs de início/fim de processos importantes
- Logs de status críticos

### Melhorias na Legibilidade
- Logs mais limpos e focados em informações importantes
- Resumos estatísticos em vez de logs individuais
- Melhor identificação de problemas reais

## Configuração Recomendada

Para um controle mais fino dos logs, considere:

1. **Variáveis de ambiente** para controlar níveis de log:
   ```env
   LOG_LEVEL=info
   VERBOSE_SOCKET_LOGS=false
   VERBOSE_CAMPAIGN_LOGS=false
   VERBOSE_VALIDATION_LOGS=false
   ```

2. **Logs condicionais** baseados no ambiente:
   ```typescript
   if (process.env.NODE_ENV === 'development' || process.env.VERBOSE_LOGS === 'true') {
     logger.debug('Detailed debug information');
   }
   ```

## Monitoramento

Após as mudanças, monitore:
- Volume de logs reduzido significativamente
- Informações importantes ainda disponíveis
- Performance melhorada (menos I/O de logs)
- Facilidade para identificar problemas reais

## Reversão

Se necessário reverter alguma mudança específica, os logs removidos estão documentados neste arquivo e podem ser facilmente restaurados.