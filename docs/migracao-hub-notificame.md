# Plano de Migração: Baileys → Hub Notificame

## Análise da Arquitetura Atual

### Dependências do Baileys Identificadas

O sistema PepChat atualmente utiliza o Baileys em múltiplas camadas:

#### 1. **Bibliotecas Baileys em Uso (A serem substituídas)**
- `@adiwajshing/baileys`: v4.4.0 (versão legacy) → Hub Notificame API
- `@whiskeysockets/baileys`: v6.7.18 (versão atual) → Hub Notificame SDK

#### 2. **Componentes Principais Afetados**

##### **Core Services**
- `libs/wbot.ts` - Gerenciamento de sessões WhatsApp → `libs/hubnotificame.ts`
- `services/WbotServices/` - Todos os serviços de WhatsApp → `services/HubNotificameServices/`
- `services/BaileysServices/` - Serviços específicos do Baileys → `services/HubNotificameServices/`
- `models/Baileys.ts` - Modelo de dados do Baileys → `models/HubNotificame.ts`

##### **Funcionalidades Críticas**
- **Autenticação e Sessões**: QR Code, reconexão automática
- **Envio de Mensagens**: Texto, mídia, botões, listas
- **Recebimento de Mensagens**: Listener de eventos
- **Gerenciamento de Contatos**: Sincronização e importação
- **Estados de Conexão**: Online/offline, bateria, etc.

## Estratégia de Migração Sem Impacto

### Fase 1: Preparação e Abstração (2-3 semanas)

#### 1.1 Criar Camada de Abstração
```typescript
// interfaces/IWhatsAppProvider.ts
interface IWhatsAppProvider {
  initSession(whatsapp: Whatsapp): Promise<Session>;
  sendMessage(data: MessageData): Promise<any>;
  sendMedia(data: MediaData): Promise<any>;
  getContacts(): Promise<Contact[]>;
  disconnect(): Promise<void>;
}

// providers/LegacyBaileysProvider.ts (implementação atual - temporária)
class LegacyBaileysProvider implements IWhatsAppProvider {
  // Implementação atual do Baileys (mantida temporariamente para rollback)
}

// providers/HubNotificameProvider.ts (nova implementação principal)
class HubNotificameProvider implements IWhatsAppProvider {
  // Nova implementação com Hub Notificame
}
```

#### 1.2 Implementar Factory Pattern
```typescript
// factories/WhatsAppProviderFactory.ts
class WhatsAppProviderFactory {
  static create(type: 'legacy-baileys' | 'hub-notificame'): IWhatsAppProvider {
    switch (type) {
      case 'legacy-baileys':
        return new LegacyBaileysProvider();
      case 'hub-notificame':
        return new HubNotificameProvider();
      default:
        throw new Error('Provider não suportado');
    }
  }
}
```

#### 1.3 Adicionar Configuração por Empresa
```sql
-- Migration: Adicionar campo provider na tabela Whatsapp
ALTER TABLE "Whatsapp" ADD COLUMN "provider_type" VARCHAR(50) DEFAULT 'hub-notificame';

-- Migration: Adicionar configurações do Hub Notificame
CREATE TABLE "HubNotificameConfig" (
  "id" SERIAL PRIMARY KEY,
  "whatsappId" INTEGER REFERENCES "Whatsapp"("id"),
  "apiKey" TEXT,
  "webhookUrl" TEXT,
  "instanceId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Fase 2: Implementação do Hub Notificame (3-4 semanas)

#### 2.1 Implementar HubNotificameProvider
```typescript
// services/HubNotificameServices/HubNotificameProvider.ts
class HubNotificameProvider implements IWhatsAppProvider {
  private apiKey: string;
  private baseUrl: string;
  private instanceId: string;

  async initSession(whatsapp: Whatsapp): Promise<Session> {
    // Implementar inicialização via API do Hub Notificame
    // - Criar instância
    // - Configurar webhook
    // - Gerar QR Code
  }

  async sendMessage(data: MessageData): Promise<any> {
    // Implementar envio via API REST do Hub Notificame
  }

  async sendMedia(data: MediaData): Promise<any> {
    // Implementar envio de mídia
  }

  // ... outras implementações
}
```

#### 2.2 Implementar Webhook Handler
```typescript
// controllers/HubNotificameWebhookController.ts
class HubNotificameWebhookController {
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const { type, data } = req.body;
    
    switch (type) {
      case 'message':
        await this.handleIncomingMessage(data);
        break;
      case 'status':
        await this.handleStatusUpdate(data);
        break;
      case 'qr':
        await this.handleQRCode(data);
        break;
    }
  }

  private async handleIncomingMessage(data: any): Promise<void> {
    // Converter formato Hub Notificame para formato interno
    // Chamar handleMessage existente
  }
}
```

#### 2.3 Mapeamento de Dados
```typescript
// mappers/HubNotificameMapper.ts
class HubNotificameMapper {
  static toInternalMessage(hubMessage: any): proto.IWebMessageInfo {
    // Converter mensagem do Hub Notificame para formato interno
  }

  static toHubMessage(internalMessage: any): any {
    // Converter mensagem interna para formato Hub Notificame
  }

  static toInternalContact(hubContact: any): Contact {
    // Converter contato do Hub Notificame para formato interno
  }
}
```

### Fase 3: Migração Gradual (4-6 semanas)

#### 3.1 Implementar Feature Flag por Empresa
```typescript
// services/CompanyService/GetWhatsAppProvider.ts
async function getWhatsAppProvider(companyId: number): Promise<IWhatsAppProvider> {
  const company = await Company.findByPk(companyId);
  const providerType = company.whatsappProvider || 'hub-notificame';
  
  return WhatsAppProviderFactory.create(providerType);
}
```

#### 3.2 Migração Empresa por Empresa
```typescript
// scripts/migrateCompanyToHubNotificame.ts
async function migrateCompany(companyId: number): Promise<void> {
  try {
    // 1. Backup dos dados atuais
    await backupCompanyWhatsAppData(companyId);
    
    // 2. Criar configuração Hub Notificame
    await createHubNotificameConfig(companyId);
    
    // 3. Migrar instâncias WhatsApp
    const whatsapps = await Whatsapp.findAll({ where: { companyId } });
    
    for (const whatsapp of whatsapps) {
      await migrateWhatsAppInstance(whatsapp);
    }
    
    // 4. Atualizar provider da empresa
    await Company.update(
      { whatsappProvider: 'hub-notificame' },
      { where: { id: companyId } }
    );
    
    // 5. Validar funcionamento
    await validateMigration(companyId);
    
  } catch (error) {
    // Rollback em caso de erro
    await rollbackMigration(companyId);
    throw error;
  }
}
```

#### 3.3 Processo de Validação
```typescript
// services/ValidationService/MigrationValidator.ts
class MigrationValidator {
  async validateMigration(companyId: number): Promise<ValidationResult> {
    const tests = [
      this.testConnection,
      this.testSendMessage,
      this.testReceiveMessage,
      this.testMediaUpload,
      this.testWebhook
    ];

    const results = await Promise.all(
      tests.map(test => test(companyId))
    );

    return {
      success: results.every(r => r.success),
      details: results
    };
  }
}
```

### Fase 4: Monitoramento e Otimização (2-3 semanas)

#### 4.1 Dashboard de Monitoramento
```typescript
// services/MonitoringService/ProviderMonitor.ts
class ProviderMonitor {
  async getProviderStats(companyId: number): Promise<ProviderStats> {
    return {
      provider: await this.getCurrentProvider(companyId),
      messagesPerHour: await this.getMessageRate(companyId),
      errorRate: await this.getErrorRate(companyId),
      uptime: await this.getUptime(companyId),
      lastError: await this.getLastError(companyId)
    };
  }
}
```

#### 4.2 Sistema de Alertas
```typescript
// services/AlertService/ProviderAlerts.ts
class ProviderAlerts {
  async checkProviderHealth(companyId: number): Promise<void> {
    const stats = await ProviderMonitor.getProviderStats(companyId);
    
    if (stats.errorRate > 0.05) { // 5% de erro
      await this.sendAlert({
        type: 'HIGH_ERROR_RATE',
        companyId,
        details: stats
      });
    }
  }
}
```

## Cronograma de Implementação

### Semana 1-3: Preparação
- [ ] Criar interfaces de abstração
- [ ] Implementar factory pattern
- [ ] Adicionar configurações de banco
- [ ] Criar testes unitários base

### Semana 4-7: Desenvolvimento Hub Notificame
- [ ] Implementar HubNotificameProvider
- [ ] Criar webhook handler
- [ ] Implementar mapeadores de dados
- [ ] Testes de integração

### Semana 8-13: Migração Gradual
- [ ] Migrar empresa piloto (menor volume)
- [ ] Monitorar e ajustar
- [ ] Migrar empresas médias
- [ ] Migrar empresas grandes

### Semana 14-16: Finalização
- [ ] Remover código legacy (Baileys) obsoleto
- [ ] Otimizar performance Hub Notificame
- [ ] Documentação final da nova arquitetura

## Estratégias de Mitigação de Riscos

### 1. **Rollback Automático**
```typescript
// services/RollbackService/AutoRollback.ts
class AutoRollback {
  async monitorMigration(companyId: number): Promise<void> {
    const healthCheck = setInterval(async () => {
      const isHealthy = await this.checkHealth(companyId);
      
      if (!isHealthy) {
        await this.executeRollback(companyId);
        clearInterval(healthCheck);
      }
    }, 30000); // Check a cada 30 segundos
  }
}
```

### 2. **Backup Automático**
```typescript
// services/BackupService/WhatsAppBackup.ts
class WhatsAppBackup {
  async createBackup(companyId: number): Promise<string> {
    const backup = {
      whatsapps: await this.exportWhatsApps(companyId),
      messages: await this.exportRecentMessages(companyId),
      contacts: await this.exportContacts(companyId),
      sessions: await this.exportSessions(companyId)
    };
    
    return await this.saveBackup(backup);
  }
}
```

### 3. **Modo Híbrido Temporário**
```typescript
// services/HybridService/HybridProvider.ts
class HybridProvider implements IWhatsAppProvider {
  private primaryProvider: IWhatsAppProvider;
  private fallbackProvider: IWhatsAppProvider;

  async sendMessage(data: MessageData): Promise<any> {
    try {
      return await this.primaryProvider.sendMessage(data);
    } catch (error) {
      logger.warn('Primary provider failed, using fallback');
      return await this.fallbackProvider.sendMessage(data);
    }
  }
}
```

## Configurações Necessárias

### 1. **Variáveis de Ambiente**
```env
# Hub Notificame
HUB_NOTIFICAME_API_URL=https://api.hubnotificame.com
HUB_NOTIFICAME_WEBHOOK_SECRET=your_webhook_secret

# Migration Settings
MIGRATION_MODE=hybrid # legacy-baileys | hub-notificame | hybrid
MIGRATION_ROLLBACK_TIMEOUT=300000 # 5 minutos
```

### 2. **Configuração por Empresa**
```typescript
interface CompanyWhatsAppConfig {
  provider: 'legacy-baileys' | 'hub-notificame' | 'hybrid';
  hubNotificame?: {
    apiKey: string;
    instancePrefix: string;
    webhookUrl: string;
  };
  migration?: {
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    rollbackCount: number;
  };
}
```

## Benefícios Esperados

### 1. **Estabilidade**
- Redução de desconexões
- Melhor gerenciamento de sessões
- Suporte oficial da Meta

### 2. **Performance**
- Menor uso de recursos do servidor
- Processamento distribuído
- Cache otimizado

### 3. **Manutenibilidade**
- Menos dependências complexas
- Atualizações automáticas
- Suporte técnico especializado

### 4. **Escalabilidade**
- Suporte a mais instâncias simultâneas
- Balanceamento de carga automático
- Infraestrutura gerenciada

## Métricas de Sucesso

### 1. **Técnicas**
- Uptime > 99.5%
- Latência de mensagens < 2s
- Taxa de erro < 1%
- Tempo de reconexão < 30s

### 2. **Negócio**
- Zero interrupção no atendimento
- Manutenção da satisfação do cliente
- Redução de custos operacionais
- Melhoria na velocidade de entrega

## Conclusão

Esta estratégia de migração garante:

1. **Zero Downtime**: Migração gradual empresa por empresa
2. **Rollback Seguro**: Backup automático e rollback em caso de problemas
3. **Monitoramento Contínuo**: Alertas e métricas em tempo real
4. **Flexibilidade**: Modo híbrido para transição suave
5. **Validação**: Testes automatizados em cada etapa

A implementação seguirá o padrão de **Strangler Fig**, onde o novo sistema (Hub Notificame) gradualmente substitui o antigo (Baileys) sem interromper o funcionamento do sistema.