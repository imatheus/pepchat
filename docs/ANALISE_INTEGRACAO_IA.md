# Integração do Agente de IA PepeAi

## 🎯 Visão Geral

O **Agente PepeAi** (Processador Eletrônico de Perguntas e Esclarecimentos) é um assistente de IA que será integrado ao sistema de atendimento para automatizar respostas básicas e reduzir a carga de trabalho dos operadores humanos.

### Características Principais
- **Usuário Dedicado**: Conta própria no sistema (`PepeAi@ai.system`)
- **Ativação**: Inicia após conclusão do chatbot básico dos setores
- **Controle**: Operadores podem pausar/retomar a qualquer momento 
- **Identificação**: Ícone (a definir) para identificar atendimento por IA
- **Sem Assinatura**: Mensagens enviadas sem identificação de remetente

### 📊 Fluxograma Completo do Processo
[📱 Cliente envia mensagem WhatsApp]
 ↓
[🤖 É mensagem válida?] ─┬─> [❌ Ignorar]
                         └─> [🎫 Criar/Buscar ticket]
                              ↓
                     [🏢 Empresa tem setores?]
                         ┬─> [👤 Transferir humano]
                         └─> [📋 Mostrar setores]
                                ↓
                      [⏳ Aguardar seleção]
                                ↓
                [✅ Cliente selecionou setor?]
                         ┬─> [🔄 Reenviar opções]
                         └─> [🎯 Atribuir setor]
                                ↓
                    [💎 Plano com IA habilitada?]
                         ┬─> [👤 Aguardar]
                         └─> [⏸️ IA pausada?]
                              ┬─> [👤 Aguardar]
                              └─> [🤖 Ativar PepeAi]
                                       ↓
                           [👤 Atribuir a PepeAi]
                                       ↓
                         [🎯 Mover para "Agente IA"]
                                       ↓
                         [📚 Buscar histórico]
                                       ↓
                     [🏢 Carregar dados da empresa]
                                       ↓
                       [🧠 Processar com IA]
                                       ↓
                    [🎯 IA conseguiu responder?]
                         ┬─> [🚨 Gerar alerta]
                         │     ↓
                         │ [👤 Aguardar] → [📧 Notificar operadores]
                         └─> [💬 Enviar resposta]
                                  ↓
                      [⏳ Aguardar nova mensagem]
                                  ↓
                [📱 Nova mensagem do cliente?]
                         ┬─> [↩️ Repetir com IA]
                         └─> [✅ Manter "Agente IA"]

# Controles Manuais
[👨‍💼 Operador pausa IA] ──> [⏸️ Pausar IA] ──> [👤 Aguardando]
[👨‍💼 Operador retoma IA] ─> [▶️ Reativar IA] ─> [🤖 Ativar PepeAi]

### Estrutura de Arquivos
```
backend/src/services/AIServices/
├── AiService.ts          # Serviço principal
├── OpenRouterService.ts      # Integração com API
├── AiControlService.ts       # Controles de pausa/retomada
└── AiConfigService.ts        # Configurações por empresa
```

## 🔧 Implementação Técnica

### 1. Banco de Dados
```sql
-- Habilitar IA por plano
ALTER TABLE plans ADD COLUMN ai_agent_enabled BOOLEAN DEFAULT false;

-- Configurações de IA por empresa
CREATE TABLE ai_configs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  enabled BOOLEAN DEFAULT false,
  training_data TEXT,
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessões de IA ativas
CREATE TABLE ai_sessions (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id),
  is_paused BOOLEAN DEFAULT false,
  paused_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar flag em tickets
ALTER TABLE tickets ADD COLUMN ai_assisted BOOLEAN DEFAULT false;

-- Criar usuário PepeAi
INSERT INTO users (name, email, profile, "isAI", avatar) 
VALUES ('PepeAi', 'PepeAi@ai.system', 'ai_agent', true, '🤖');
```

### 2. API de IA - OpenRouter com DeepSeek
- **Modelo**: `deepseek/deepseek-chat-v3-0324:free`
- **Custo**: $0 (totalmente gratuito)
- **Limite**: 20 requests/minuto
- **Qualidade**: Excelente para chatbot de atendimento

### 3. Integração no wbotMessageListener.ts
```typescript
// Após chatbot básico completado
if (ticket.queueId && !ticket.userId && company.plan.ai_agent_enabled) {
  const PepeAiUser = await User.findOne({ where: { email: 'PepeAi@ai.system' } });
  await ticket.update({ userId: PepeAiUser.id, aiAssisted: true });
  
  const response = await PepeAiService.generateResponse(message, companyInfo);
  
  if (response.needsHuman) {
    await ticket.update({ userId: null, status: 'pending' });
    await generateAlert(ticket.id, 'IA precisa de ajuda');
  } else {
    await SendWhatsAppMessage({ body: response.message, ticket });
  }
}
```

## 🎛️ Interface do Usuário

### 1. Nova Aba "Agente IA" nos Atendimentos
```typescript
const ticketTabs = [
  { name: 'Aguardando', status: 'pending' },
  { name: 'Atendendo', status: 'open' },
  { name: 'Pepe AI', status: 'ai_assisted' }  // NOVA ABA
];
```

### 2. Aba "Pepe AI" nas Integrações
- **Ativar/Desativar**: Checkbox para habilitar PepeAi
- **Treinamento**: Campo para informações da empresa
- **Controle de Acesso**: Visível apenas para planos habilitados

### 3. Controles no Chat
- **Pausar IA**: Botão para pausar PepeAi e assumir controle
- **Reativar IA**: Botão para retomar atendimento automático
- **Status Visual**: Indicador quando IA está ativa

## 📊 Sistema de Controle

### Transferência Automática para "Aguardando"
- IA não consegue responder
- Cliente solicita atendente humano
- Erro técnico detectado
- Operador pausa manualmente

### Sistema de Alertas
```typescript
const AIAlertTypes = {
  NEEDS_HUMAN: 'IA não conseguiu responder',
  TECHNICAL_ERROR: 'Erro técnico no sistema',
  CUSTOMER_REQUEST: 'Cliente solicitou humano'
};
```

## 🎓 Treinamento Personalizado

### Configuração por Empresa
- **Informações Básicas**:Nome da empresa, tipo de negócio, produtos/serviços
- **Políticas**: Horários, trocas, garantias, entrega
- **Perguntas Frequentes**: Q&A personalizado
- **Extração de Site**: Sistema busca informações automaticamente

### Prompt Personalizado
```typescript
const PepeAi_PROMPT = `
Você é PepeAi, assistente da ${companyName}.

INFORMAÇÕES DA EMPRESA:
${companyTrainingData}

REGRAS:
- Máximo 150 palavras
- Se não souber, transfira para atendente
- Seja educado e prestativo

Pergunta: ${customerMessage}
`;
```

## 🎯 Parâmetros por Plano

| Parâmetro                   | Plano Básico | Plano Pro           | Plano Enterprise |
| --------------------------- | ------------ | ------------------- | ---------------- |
| ✅ **IA Habilitada**         | ❌ Não        | ✅ Sim               | ✅ Sim            |
| 🔢 **Requests IA por mês**  | —            | 5.000               | 20.000           |
| 🧠 **Modelo IA**            | —            | DeepSeek (Gratuito) | GPT-4 (Premium)  |
| 🧾 **Tokens por resposta**  | —            | 500                 | 1.000            |
| 📚 **Base de conhecimento** | —            | 50 perguntas        | Ilimitado        |
| 🔍 **Busca semântica**      | —            | ✅ Sim              | ✅ Sim            |
| 📊 **Analytics IA**         | —            | Básico              | Avançado         |
| 🎛️ **Controles avançados** | —            | ❌ Não               | ✅ Sim            |



### 🔍 Sistema de Busca Semântica com Vetores

#### **Implementação com PostgreSQL (Gratuito)**
```sql
-- Habilitar extensão de vetores no PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para armazenar embeddings da base de conhecimento
CREATE TABLE knowledge_embeddings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings têm 1536 dimensões
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca de similaridade
CREATE INDEX ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Tabela para cache de embeddings de perguntas
CREATE TABLE question_embeddings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  question TEXT NOT NULL,
  embedding vector(1536),
  answer TEXT,
  similarity_threshold DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Serviço de Similaridade**
```typescript
// AIServices/SemanticSearchService.ts
import { Client } from 'pg';

export class SemanticSearchService {
  async generateEmbedding(text: string): Promise<number[]> {
    // Usar OpenAI embeddings (gratuito até certo limite)
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  }

  async findSimilarContent(
    companyId: number, 
    question: string, 
    threshold: number = 0.8
  ): Promise<any[]> {
    const questionEmbedding = await this.generateEmbedding(question);
    
    const query = `
      SELECT content, metadata, 
             1 - (embedding <=> $1::vector) as similarity
      FROM knowledge_embeddings 
      WHERE company_id = $2 
        AND 1 - (embedding <=> $1::vector) > $3
      ORDER BY similarity DESC 
      LIMIT 5
    `;
    
    const result = await db.query(query, [
      JSON.stringify(questionEmbedding),
      companyId,
      threshold
    ]);
    
    return result.rows;
  }

  async addToKnowledgeBase(
    companyId: number, 
    content: string, 
    metadata: any = {}
  ): Promise<void> {
    const embedding = await this.generateEmbedding(content);
    
    await db.query(`
      INSERT INTO knowledge_embeddings (company_id, content, embedding, metadata)
      VALUES ($1, $2, $3::vector, $4)
    `, [companyId, content, JSON.stringify(embedding), metadata]);
  }
}
```

#### **Integração com PepeAi**
```typescript
// Busca semântica antes de processar com IA
const semanticResults = await semanticSearchService.findSimilarContent(
  companyId, 
  customerMessage, 
  0.8
);

if (semanticResults.length > 0) {
  // Usar conteúdo similar encontrado no prompt
  const contextualPrompt = `
    CONTEXTO RELEVANTE ENCONTRADO:
    ${semanticResults.map(r => r.content).join('\n\n')}
    
    PERGUNTA DO CLIENTE: ${customerMessage}
    
    Use o contexto acima para responder de forma precisa.
  `;
  
  const response = await aiService.generateResponse(contextualPrompt);
} else {
  // Processar normalmente se não encontrar similaridade
  const response = await aiService.generateResponse(customerMessage);
}
```

### 🎛️ Controle de Acesso e Limites

```typescript
// Middleware para verificar limites do plano
const checkAILimits = async (companyId: number) => {
  const company = await Company.findByPk(companyId, { include: ['plan'] });
  
  if (!company.plan.ai_agent_enabled) {
    throw new Error("Faça upgrade para acessar o Agente de IA");
  }
  
  // Verificar limite mensal de requests
  const currentMonth = new Date().getMonth();
  const aiUsage = await AIUsage.findOne({
    where: { companyId, month: currentMonth }
  });
  
  if (aiUsage && aiUsage.requests >= company.plan.ai_monthly_requests) {
    throw new Error("Limite mensal de requests IA atingido");
  }
  
  // Verificar limite de base de conhecimento
  if (company.plan.ai_knowledge_base_limit > 0) {
    const knowledgeCount = await KnowledgeEmbeddings.count({
      where: { companyId }
    });
    
    if (knowledgeCount >= company.plan.ai_knowledge_base_limit) {
      throw new Error("Limite de base de conhecimento atingido");
    }
  }
  
  return {
    model: company.plan.ai_model,
    maxTokens: company.plan.ai_max_tokens,
    semanticSearch: company.plan.ai_semantic_search,
    analyticsLevel: company.plan.ai_analytics_level
  };
};
```

##  Segurança e Qualidade

### Controle de Alucinação
- **Prompt Restritivo**: Usar apenas informações fornecidas
- **Busca Semântica**: Encontrar conteúdo relevante antes de responder
- **Validação**: Detectar respostas incertas
- **Fallback**: Transferir quando não souber

### Monitoramento
- Taxa de resolução automática
- Tempo médio de resposta
- Satisfação do cliente
- Custo por interação
- Precisão da busca semântica

## 🚀 Passos

1. **Configurar OpenRouter** e criar estrutura base
2. **Implementar backend** do PepeAi e controles
3. **Desenvolver interface** de configuração
4. **Integrar sistema** de alertas

---
# Checklist de Implementações para Integração do Agente de IA PepeAi

## 🔧 Backend
1. Criar arquivos do backend em `backend/src/services/AIServices/`:
   - `AiService.ts` (serviço principal)
   - `OpenRouterService.ts` (integração com API OpenRouter)
   - `AiControlService.ts` (controles de pausa/retomada)
   - `AiConfigService.ts` (configurações por empresa)
2. Implementar serviço de busca semântica em `SemanticSearchService.ts`.
3. Configurar integração com OpenRouter usando o modelo `deepseek/deepseek-chat-v3-0324:free`.
4. Adicionar middleware `checkAILimits` para controle de limites por plano.
5. Integrar lógica de processamento do PepeAi no `wbotMessageListener.ts`.
6. Implementar sistema de alertas para falhas ou necessidade de intervenção humana.

## 🗄️ Banco de Dados
7. Modificar tabela `plans` para adicionar coluna `ai_agent_enabled`.
8. Criar tabela `ai_configs` para configurações de IA por empresa.
9. Criar tabela `ai_sessions` para gerenciar sessões de IA ativas.
10. Adicionar coluna `ai_assisted` na tabela `tickets`.
11. Criar usuário `PepeAi` no banco com email `PepeAi@ai.system`.
12. Configurar extensão de vetores no PostgreSQL (`CREATE EXTENSION vector`).
13. Criar tabelas `knowledge_embeddings` e `question_embeddings` para busca semântica.
14. Adicionar índices para busca de similaridade com vetores.

## 🎛️ Interface do Usuário
15. Adicionar aba "Pepe AI" na interface de atendimentos (`status: 'ai_assisted'`).
16. Criar aba "Pepe AI" na seção de integrações com:
    - Checkbox para ativar/desativar PepeAi
    - Campo para informações de treinamento
    - Controle de acesso por plano
17. Implementar controles no chat:
    - Botão para pausar IA
    - Botão para reativar IA
    - Indicador visual de status da IA
18. Desenvolver interface de configuração de treinamento personalizado por empresa.

## 📊 Configurações por Plano
19. Definir parâmetros de IA por plano:
    - Habilitar IA (Básico: Não, Pro/Enterprise: Sim)
    - Limite de requests mensais (Pro: 5.000, Enterprise: 20.000)
    - Modelo IA (Pro: DeepSeek, Enterprise: GPT-4)
    - Tokens por resposta (Pro: 500, Enterprise: 1.000)
    - Limite de base de conhecimento (Pro: 50, Enterprise: Ilimitado)
    - Busca semântica (Pro/Enterprise: Sim)
    - Analytics (Pro: Básico, Enterprise: Avançado)
    - Controles avançados (Enterprise: Sim)
20. Implementar validação de limites no backend para cada plano.

##  Segurança e Monitoramento
21. Configurar prompt restritivo para evitar alucinações.
22. Implementar validação de respostas incertas com fallback para humano.
23. Configurar monitoramento de métricas:
    - Taxa de resolução automática
    - Tempo médio de resposta
    - Satisfação do cliente
    - Custo por interação
    - Precisão da busca semântica

## 🚀 Configuração e Testes
24. Configurar chaves da API OpenRouter no ambiente.
25. Testar integração com DeepSeek e limites de 20 requests/minuto.
26. Validar fluxo completo do PepeAi (entrada de mensagem, processamento, resposta).
27. Testar cenários de falha (IA pausada, limite excedido, erro técnico).
28. Verificar transferência automática para "Aguardando" em casos de falha.
29. Testar busca semântica com diferentes thresholds de similaridade.
30. Realizar testes de carga com múltiplos tickets simultâneos.