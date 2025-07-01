# Teste das Melhorias - Campanhas de Marketing

## Como Testar as Melhorias Implementadas

### 1. Teste de Números Inválidos Descartados

**Objetivo:** Verificar se números inválidos são descartados sem gerar erro

**Passos:**
1. Acesse "Campanhas" > "Listas de Contatos"
2. Crie uma nova lista de contatos
3. Clique em "Importar" > "Planilha"
4. Crie uma planilha Excel com os seguintes dados:

```
nome        | numero      | email
João Silva  | 11999999999 | joao@email.com
Maria       | 123         | maria@email.com (número inválido)
Pedro       | abc123      | pedro@email.com (número inválido)
Ana Santos  | 11888888888 | ana@email.com
Carlos      |             | carlos@email.com (número vazio)
```

5. Importe a planilha
6. **Resultado Esperado:**
   - Sistema deve importar apenas João Silva e Ana Santos
   - Deve mostrar mensagem: "2 contatos importados, 3 descartados"
   - Deve listar números inválidos descartados
   - Não deve gerar erro

### 2. Teste de Limites de Contatos por Campanha

**Objetivo:** Verificar se o limite de contatos por campanha é respeitado

**Passos:**
1. Acesse "Administração" > "Planos"
2. Edite um plano e configure:
   - Campanhas: Habilitado
   - Contatos por Campanha: 5 (para teste)
   - Campanhas por Mês: 10

3. Crie uma lista com 10 contatos válidos
4. Tente criar uma campanha com essa lista
5. **Resultado Esperado:**
   - Sistema deve bloquear a criação
   - Deve mostrar erro: "A lista possui 10 contatos, mas seu plano permite apenas 5"

### 3. Teste de Limite de Campanhas por Mês

**Objetivo:** Verificar se o limite mensal de campanhas é respeitado

**Passos:**
1. Configure um plano com limite de 2 campanhas por mês
2. Crie 2 campanhas no mês atual
3. Tente criar uma terceira campanha
4. **Resultado Esperado:**
   - Sistema deve bloquear a criação
   - Deve mostrar erro: "Limite de 2 campanhas por mês atingido"

### 4. Teste de Importação com Limite

**Objetivo:** Verificar se a importação respeita o limite de contatos

**Passos:**
1. Configure um plano com limite de 3 contatos por campanha
2. Crie uma lista de contatos
3. Tente importar planilha com 5 contatos válidos
4. **Resultado Esperado:**
   - Sistema deve importar apenas 3 contatos
   - Deve mostrar aviso: "Limite atingido! Importando apenas 3 de 5 contatos"

### 5. Teste de Validação WhatsApp

**Objetivo:** Verificar se números são validados no WhatsApp

**Passos:**
1. Importe contatos com números reais e fictícios
2. Aguarde a validação automática
3. Verifique a coluna de status (ícone verde/cinza)
4. **Resultado Esperado:**
   - Números reais: ícone verde (válido)
   - Números fictícios: removidos automaticamente

## Cenários de Erro para Testar

### Cenário 1: Campanhas Desabilitadas
- Desabilite campanhas no plano
- Tente importar contatos
- **Esperado:** Erro "Campanhas não estão habilitadas no seu plano"

### Cenário 2: Arquivo Inválido
- Tente importar arquivo que não é Excel
- **Esperado:** Erro de formato de arquivo

### Cenário 3: Planilha Vazia
- Importe planilha sem dados
- **Esperado:** Mensagem "0 contatos importados"

## Verificações no Banco de Dados

### Verificar Campos de Limite nos Planos:
```sql
SELECT name, useCampaigns, campaignContactsLimit, campaignsPerMonthLimit 
FROM Plans 
WHERE useCampaigns = true;
```

### Verificar Contatos Válidos:
```sql
SELECT name, number, isWhatsappValid 
FROM ContactListItems 
WHERE contactListId = [ID_DA_LISTA];
```

### Verificar Campanhas do Mês:
```sql
SELECT COUNT(*) as campanhas_mes_atual
FROM Campaigns 
WHERE companyId = [ID_EMPRESA] 
AND createdAt >= DATE_TRUNC('month', CURRENT_DATE);
```

## Logs para Monitorar

### Backend Logs:
- Procure por: "Número de contato inválido descartado"
- Procure por: "Limite de contatos excedido"
- Procure por: "Importando apenas X de Y contatos"

### Frontend Toasts:
- Mensagens de sucesso da importação
- Avisos sobre contatos descartados
- Alertas sobre limites atingidos

## Resultados Esperados

✅ **Números inválidos são descartados silenciosamente**
✅ **Limites de contatos por campanha são respeitados**
✅ **Limites de campanhas por mês são respeitados**
✅ **Interface mostra informações detalhadas da importação**
✅ **Sistema não falha com dados inválidos**
✅ **Validação funciona tanto na criação quanto na edição**

## Troubleshooting

### Se números válidos estão sendo descartados:
- Verifique conexão WhatsApp
- Verifique logs do backend
- Confirme formato do número (mínimo 10 dígitos)

### Se limites não estão sendo respeitados:
- Verifique se migração foi executada
- Confirme configuração do plano
- Verifique logs de validação

### Se importação falha:
- Verifique formato da planilha
- Confirme colunas: nome, numero, email
- Verifique permissões de arquivo

---

**Nota:** Execute estes testes em ambiente de desenvolvimento primeiro, depois em homologação antes de ir para produção.