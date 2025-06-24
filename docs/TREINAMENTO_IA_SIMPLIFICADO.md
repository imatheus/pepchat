# Treinamento do Agente IA - Versão Simplificada

## 🚨 ESPECIFICAÇÃO FINAL SIMPLIFICADA

### Localização: Botão "Treinar IA" em "Minhas Conexões"
- **Onde:** Ao lado de cada conexão WhatsApp
- **Botão:** "Treinar IA" ou ícone 🎓
- **Função:** Abre modal simples de treinamento

## 📋 Modal de Treinamento SIMPLIFICADO

### Formulário Único - Informações da Empresa
```
┌─────────────────────────────────────────────┐
│ 🎓 Treinar IA - WhatsApp Empresa ABC       │
├─────────────────────────────────────────────┤
│                                             │
│ Nome da Empresa: [________________]         │
│                                             │
│ Tipo de Negócio: [Dropdown ▼]              │
│ ├ Loja/Varejo                              │
│ ├ Restaurante                              │
│ ├ Oficina/Automotivo                       │
│ ├ Beleza/Estética                          │
│ ├ Serviços                                 │
│ └ Outros                                   │
│                                             │
│ Descrição dos Produtos/Serviços:           │
│ [________________________________]         │
│ [________________________________]         │
│ [________________________________]         │
│                                             │
│ Horário de Funcionamento:                  │
│ [________________________________]         │
│                                             │
│ Informações de Contato:                    │
│ [________________________________]         │
│                                             │
│ Endereço:                                  │
│ [________________________________]         │
│                                             │
│ Site da Empresa (opcional):                │
│ [________________________________]         │
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancelar] [Treinar/Concluir] │
└─────────────────────────────────────────────┘
```

## 🎯 Comportamento do Botão "Treinar/Concluir"

### Ao clicar em "Treinar/Concluir":
1. **Salva as informações** no banco de dados
2. **Ativa automaticamente o PEPE** para essa conexão
3. **Fecha o modal**
4. **Mostra notificação:** "PEPE ativado com sucesso!"
5. **Botão muda para:** "IA Ativa ✅" ou "Editar Treinamento"

## ❌ O QUE NÃO TERÁ (Removido da Especificação)

### 🔧 Configurações Básicas (REMOVIDO)
- ~~Ativar/Desativar PEPE~~ → Ativação automática
- ~~Seleção de modelo de IA~~ → DeepSeek fixo
- ~~Configuração de temperatura~~ → Padrão fixo

### 📚 Treinamento Avançado (REMOVIDO)
- ~~Perguntas e respostas customizadas~~ → Apenas info da empresa
- ~~Extração automática do site~~ → Apenas URL opcional

### ⚙️ Controles Avançados (REMOVIDO)
- ~~Regras de transferência~~ → Regras padrão fixas
- ~~Teste do agente~~ → Sem teste manual
- ~~Monitoramento de uso~~ → Sem dashboard

## 🤖 Configuração Técnica Simplificada

### API de IA
- **Modelo Fixo:** DeepSeek (100% gratuito)
- **Sem OpenRouter inicialmente**
- **Configurações padrão fixas**

### Banco de Dados Vetorial
- **Banco próprio:** PostgreSQL + pgvector
- **Sem Pinecone ou serviços externos**
- **Embeddings locais**

### Estrutura do Banco
```sql
-- Tabela simplificada para treinamento
CREATE TABLE ai_training_simple (
  id SERIAL PRIMARY KEY,
  whatsapp_id INTEGER REFERENCES whatsapps(id),
  company_id INTEGER REFERENCES companies(id),
  company_name VARCHAR(255),
  business_type VARCHAR(100),
  description TEXT,
  working_hours VARCHAR(255),
  contact_info TEXT,
  address TEXT,
  website_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings no próprio PostgreSQL
CREATE TABLE ai_embeddings_local (
  id SERIAL PRIMARY KEY,
  training_id INTEGER REFERENCES ai_training_simple(id),
  content_text TEXT,
  embedding VECTOR(384), -- Modelo local menor
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 💻 Implementação Frontend Simplificada

```typescript
// Componente do modal simplificado
const SimpleTrainingModal = ({ connectionId, onClose }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    description: '',
    workingHours: '',
    contactInfo: '',
    address: '',
    websiteUrl: ''
  });

  const handleSubmit = async () => {
    try {
      // Salva dados e ativa PEPE automaticamente
      await api.post(`/ai-training/simple/${connectionId}`, formData);
      
      // Notificação de sucesso
      toast.success('PEPE ativado com sucesso!');
      
      // Fecha modal
      onClose();
      
      // Atualiza lista de conexões
      refreshConnections();
    } catch (error) {
      toast.error('Erro ao ativar PEPE');
    }
  };

  return (
    <Modal>
      <h2>🎓 Treinar IA</h2>
      
      <form>
        <input 
          placeholder="Nome da Empresa"
          value={formData.companyName}
          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
        />
        
        <select 
          value={formData.businessType}
          onChange={(e) => setFormData({...formData, businessType: e.target.value})}
        >
          <option value="">Selecione o tipo de negócio</option>
          <option value="retail">Loja/Varejo</option>
          <option value="restaurant">Restaurante</option>
          <option value="automotive">Oficina/Automotivo</option>
          <option value="beauty">Beleza/Estética</option>
          <option value="services">Serviços</option>
          <option value="other">Outros</option>
        </select>
        
        <textarea 
          placeholder="Descrição dos produtos/serviços"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
        
        <input 
          placeholder="Horário de funcionamento"
          value={formData.workingHours}
          onChange={(e) => setFormData({...formData, workingHours: e.target.value})}
        />
        
        <textarea 
          placeholder="Informações de contato"
          value={formData.contactInfo}
          onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
        />
        
        <input 
          placeholder="Endereço"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
        
        <input 
          placeholder="Site da empresa (opcional)"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
        />
      </form>
      
      <div className="modal-actions">
        <button onClick={onClose}>Cancelar</button>
        <button onClick={handleSubmit} className="primary">
          Treinar/Concluir
        </button>
      </div>
    </Modal>
  );
};
```

## 🔄 Fluxo Simplificado

1. **Usuário clica "Treinar IA"** na tela Minhas Conexões
2. **Modal simples abre** com formulário básico
3. **Usuário preenche** informações da empresa
4. **Clica "Treinar/Concluir"**
5. **Sistema salva dados** e ativa PEPE automaticamente
6. **Modal fecha** com notificação de sucesso
7. **PEPE está ativo** e pronto para atender

## 🎯 Estado do Botão Após Treinamento

### Antes do Treinamento
```
[🎓 Treinar IA]
```

### Após o Treinamento
```
[✅ IA Ativa] ou [📝 Editar Treinamento]
```

---

**Esta é a especificação final simplificada. O foco é na simplicidade e facilidade de uso, sem configurações complexas.**