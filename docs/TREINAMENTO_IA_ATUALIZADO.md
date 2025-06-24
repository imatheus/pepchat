será # Treinamento do Agente IA - Especificação Atualizada

## 🚨 MUDANÇA IMPORTANTE: Localização do Treinamento

**ANTES:** Aba "Agente de IA" em Configurações > Integrações
**AGORA:** Botão "Treinar IA" na tela "Minhas Conexões"

## 📍 Nova Localização

### Tela: Minhas Conexões
- **Onde:** Ao lado de cada conexão WhatsApp
- **Botão:** "Treinar IA" ou ícone 🎓
- **Comportamento:** Abre modal de treinamento específico para aquela conexão

### Vantagens desta Abordagem
1. **Mais Intuitivo:** Usuário treina a IA onde gerencia as conexões
2. **Específico por Conexão:** Cada WhatsApp pode ter treinamento diferente
3. **Acesso Rápido:** Não precisa navegar até integrações
4. **Contexto Claro:** Óbvio que o treinamento é para aquela conexão

## 🎯 Comportamento do Botão

### ✅ Se Plano Permite IA
- Botão "Treinar IA" visível e ativo
- Abre modal de treinamento ao clicar
- Permite configurar informações da empresa
- Salva dados específicos por conexão

### ❌ Se Plano Não Permite IA
- Botão não aparece ou aparece desabilitado
- Tooltip: "Upgrade seu plano para usar IA"
- Redireciona para página de upgrade

## 📋 Modal de Treinamento

Quando o usuário clicar no botão "Treinar IA", deve abrir um modal com:

### 1. 📋 Informações da Empresa
```
- Nome da empresa
- Tipo de negócio (dropdown)
- Descrição dos produtos/serviços
- Horário de funcionamento
- Informações de contato
- Endereço
```

### 2. ❓ Perguntas e Respostas
```
- Lista de perguntas frequentes
- Respostas personalizadas
- Botão "Adicionar nova pergunta"
- Limite baseado no plano (10 básico, 50 premium)
```

### 3. 🌐 Extração do Site
```
- Campo para URL do site da empresa
- Botão "Extrair informações"
- Preview das informações extraídas
- Opção de editar informações extraídas
```

### 4. 🎯 Teste da IA
```
- Campo para testar perguntas
- Visualização da resposta da IA
- Score de confiança
- Sugestões de melhoria
```

## 💻 Implementação Técnica

### Frontend - Componente do Botão
```typescript
const TrainAIButton = ({ connection, userPlan }) => {
  const canUseAI = userPlan.ai_agent_enabled;
  
  if (!canUseAI) {
    return (
      <Tooltip title="Upgrade seu plano para usar IA">
        <Button disabled>
          🎓 Treinar IA
        </Button>
      </Tooltip>
    );
  }
  
  return (
    <Button onClick={() => openTrainingModal(connection.id)}>
      🎓 Treinar IA
    </Button>
  );
};
```

### Backend - API de Treinamento
```typescript
// Rota para salvar dados de treinamento
POST /api/ai-training/:connectionId
{
  "companyInfo": {
    "name": "Empresa ABC",
    "type": "retail",
    "description": "Loja de roupas femininas",
    "workingHours": "9h às 18h",
    "contact": "contato@empresa.com"
  },
  "customQA": [
    {
      "question": "Vocês fazem entrega?",
      "answer": "Sim, entregamos em toda a cidade"
    }
  ],
  "websiteUrl": "https://empresa.com.br"
}
```

### Banco de Dados
```sql
-- Tabela para dados de treinamento por conexão
CREATE TABLE ai_training_data (
  id SERIAL PRIMARY KEY,
  whatsapp_id INTEGER REFERENCES whatsapps(id),
  company_id INTEGER REFERENCES companies(id),
  company_info JSONB,
  custom_qa JSONB,
  website_url VARCHAR(500),
  extracted_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_training_whatsapp ON ai_training_data(whatsapp_id);
CREATE INDEX idx_ai_training_company ON ai_training_data(company_id);
```

## 🔄 Fluxo de Uso

1. **Usuário acessa "Minhas Conexões"**
2. **Vê botão "Treinar IA" ao lado de cada conexão**
3. **Clica no botão (se plano permite)**
4. **Modal abre com formulário de treinamento**
5. **Usuário preenche informações da empresa**
6. **Adiciona perguntas e respostas personalizadas**
7. **Opcionalmente, insere URL do site para extração**
8. **Testa a IA com perguntas de exemplo**
9. **Salva as configurações**
10. **IA fica treinada para essa conexão específica**

## 🎨 Interface Visual

### Tela Minhas Conexões
```
┌─────────────────────────────────────────────┐
│ Minhas Conexões                             │
├─────────────────────────────────────────────┤
│ WhatsApp 1 - Empresa ABC                    │
│ Status: Conectado                           │
│ [Desconectar] [QR Code] [🎓 Treinar IA]    │
├─────────────────────────────────────────────┤
│ WhatsApp 2 - Loja XYZ                      │
│ Status: Desconectado                        │
│ [Conectar] [QR Code] [🎓 Treinar IA]       │
└─────────────────────────────────────────────┘
```

### Modal de Treinamento
```
┌─────────────────────────────────────────────┐
│ 🎓 Treinar IA - WhatsApp Empresa ABC       │
├─────────────────────────────────────────────┤
│ [📋 Info Empresa] [❓ Q&A] [🌐 Site] [🎯 Teste] │
├─────────────────────────────────────────────┤
│                                             │
│ Conteúdo da aba selecionada                │
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancelar] [Salvar]     │
└─────────────────────────────────────────────┘
```

## 🔧 Sistema de Embeddings e Similaridade

### Como Funciona o Treinamento
1. **Coleta de Dados:** Informações da empresa, site, Q&A personalizado
2. **Processamento:** Segmentação em chunks, limpeza e normalização
3. **Geração de Embeddings:** Conversão em vetores usando modelos de embedding
4. **Armazenamento Vetorial:** Indexação em banco de dados vetorial
5. **Busca por Similaridade:** Recuperação de contexto relevante

### Modelos de Embedding
- **text-embedding-3-small:** Principal (OpenAI via OpenRouter)
- **text-embedding-3-large:** Alta precisão (documentos importantes)
- **multilingual-e5-large:** Fallback gratuito (Hugging Face)

### Banco de Dados Vetorial
- **Recomendado:** Pinecone ($70/mês para 100K vetores)
- **Alternativa:** PostgreSQL + pgvector (sem custo adicional)
- **Avançado:** Weaviate (self-hosted ou $25/mês cloud)

## 💰 Custos Estimados

### Embedding Generation
- **Modelo:** text-embedding-3-small
- **Custo:** $0.00002 por 1K tokens
- **Estimativa:** ~$2-5 por empresa (setup inicial)

### Vector Storage
- **Pinecone:** $70/mês para 100K vetores
- **PostgreSQL:** Incluído no servidor
- **Estimativa:** $0.70 por empresa/mês (Pinecone)

### Total Estimado
- **Setup inicial:** $2-5 por empresa
- **Custo mensal:** $2-6 por empresa
- **ROI esperado:** 300-500% (redução de atendimento manual)

## 📊 Tipos de Treinamento por Plano

### Treinamento Básico (Planos com IA)
- Informações b��sicas da empresa
- 10 perguntas e respostas personalizadas
- Configurações simples de transferência

### Treinamento Avançado (Planos Premium)
- Até 50 perguntas e respostas personalizadas
- Upload de documentos (catálogos, manuais)
- Integração com sistemas externos
- Analytics de performance da IA

### Treinamento Enterprise
- Treinamento ilimitado
- IA dedicada por empresa
- Suporte técnico especializado
- Customizações específicas

---

**Esta especificação substitui qualquer documentação anterior sobre a localização do treinamento da IA. O botão deve estar em "Minhas Conexões", não em "Integrações".**