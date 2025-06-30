# Instruções para Implementar Tipos de Chatbot

## Arquivo a ser modificado:
`/backend/src/services/WbotServices/wbotMessageListener.ts`

## Passo 1: Adicionar funções auxiliares

Adicione as seguintes funções **ANTES** da função `verifyQueue`:

```typescript
// Função para buscar o tipo de chatbot configurado
const getChatbotType = async (companyId: number): Promise<string> => {
  const setting = await Setting.findOne({
    where: { key: "chatBotType", companyId }
  });
  return setting?.value || "text";
};

// Função para enviar mensagem formatada baseada no tipo de chatbot
const sendChatbotMessage = async (
  wbot: Session,
  ticket: Ticket,
  message: string,
  options: string,
  chatbotType: string
): Promise<void> => {
  const contact = ticket.contact;
  const chatId = `${contact.number}@${contact.isGroup ? "g.us" : "s.whatsapp.net"}`;

  switch (chatbotType) {
    case "button":
      // Formato de botões do WhatsApp (máximo 3 botões)
      const optionLines = options.split('\n').filter(line => line.trim() && line.includes('*['));
      const buttons = optionLines.slice(0, 3).map((line) => {
        const match = line.match(/\*\[\s*(.+?)\s*\]\*\s*-\s*(.+)/);
        if (match) {
          return {
            buttonId: match[1].trim(),
            buttonText: { displayText: match[2].trim() },
            type: 1
          };
        }
        return null;
      }).filter(Boolean);

      if (buttons.length > 0) {
        const buttonMessage = {
          text: message,
          buttons: buttons,
          headerType: 1
        };
        
        try {
          const sentMessage = await wbot.sendMessage(chatId, buttonMessage);
          await verifyMessage(sentMessage, ticket, contact);
        } catch (error) {
          // Fallback para texto se botões falharem
          const textMessage = formatBody(`${message}\n\n${options}`, contact);
          await SendWhatsAppMessage({ body: textMessage, ticket });
        }
      } else {
        // Fallback para texto
        const textMessage = formatBody(`${message}\n\n${options}`, contact);
        await SendWhatsAppMessage({ body: textMessage, ticket });
      }
      break;

    case "list":
      // Formato de lista do WhatsApp
      const listLines = options.split('\n').filter(line => line.trim() && line.includes('*['));
      const rows = listLines.map((line) => {
        const match = line.match(/\*\[\s*(.+?)\s*\]\*\s*-\s*(.+)/);
        if (match) {
          return {
            rowId: match[1].trim(),
            title: match[2].trim(),
            description: ""
          };
        }
        return null;
      }).filter(Boolean);

      if (rows.length > 0) {
        const listMessage = {
          text: message,
          buttonText: "📋 Ver opções",
          sections: [{
            title: "Opções disponíveis",
            rows: rows
          }]
        };

        try {
          const sentMessage = await wbot.sendMessage(chatId, listMessage);
          await verifyMessage(sentMessage, ticket, contact);
        } catch (error) {
          // Fallback para texto se lista falhar
          const textMessage = formatBody(`${message}\n\n${options}`, contact);
          await SendWhatsAppMessage({ body: textMessage, ticket });
        }
      } else {
        // Fallback para texto
        const textMessage = formatBody(`${message}\n\n${options}`, contact);
        await SendWhatsAppMessage({ body: textMessage, ticket });
      }
      break;

    default:
      // Formato texto (padrão)
      const textMessage = formatBody(`${message}\n\n${options}`, contact);
      await SendWhatsAppMessage({ body: textMessage, ticket });
      break;
  }
};
```

## Passo 2: Modificar a função `handleChatbot`

Na função `handleChatbot`, substitua **TODAS** as chamadas de `SendWhatsAppMessage` que enviam opções do chatbot.

### Exemplo de substituição:

**ANTES:**
```typescript
const body = formatBody(`\u200e${selectedOption.message}\n\n${options}`, ticket.contact);
await SendWhatsAppMessage({ body, ticket });
```

**DEPOIS:**
```typescript
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, selectedOption.message, options, chatbotType);
```

### Locais específicos para modificar:

1. **Linha ~580** (aproximadamente) - Quando mostra subopções após selecionar opção principal:
```typescript
// ANTES:
const body = formatBody(`\u200e${selectedOption.message}\n\n${options}`, ticket.contact);
await SendWhatsAppMessage({ body, ticket });

// DEPOIS:
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, selectedOption.message, options, chatbotType);
```

2. **Linha ~590** (aproximadamente) - Quando mostra opções principais:
```typescript
// ANTES:
const textMessage = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact);
await SendWhatsAppMessage({ body: textMessage, ticket });

// DEPOIS:
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, queue.greetingMessage, options, chatbotType);
```

3. **Linha ~620** (aproximadamente) - Quando mostra opções do nível anterior:
```typescript
// ANTES:
const body = formatBody(`\u200e${parentOption?.message || queue.greetingMessage}\n\n${options}`, ticket.contact);
await SendWhatsAppMessage({ body, ticket });

// DEPOIS:
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, parentOption?.message || queue.greetingMessage, options, chatbotType);
```

4. **Linha ~650** (aproximadamente) - Quando mostra opções filhas:
```typescript
// ANTES:
const body = formatBody(`\u200e${selectedSubOption.message}\n\n${childOptionsText}`, ticket.contact);
await SendWhatsAppMessage({ body, ticket });

// DEPOIS:
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, selectedSubOption.message, childOptionsText, chatbotType);
```

5. **Linha ~680** (aproximadamente) - Quando mostra subopções:
```typescript
// ANTES:
const body = formatBody(`\u200e${currentOption?.message || 'Escolha uma opção:'}\n\n${options}`, ticket.contact);
await SendWhatsAppMessage({ body, ticket });

// DEPOIS:
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, currentOption?.message || 'Escolha uma opção:', options, chatbotType);
```

## Passo 3: Modificar a função `verifyQueue`

Na função `verifyQueue`, também substitua as chamadas que enviam opções de setores:

**ANTES:**
```typescript
const textMessage = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, contact);
await SendWhatsAppMessage({ body: textMessage, ticket });
```

**DEPOIS:**
```typescript
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, queue.greetingMessage, options, chatbotType);
```

## Resultado Esperado

Após as modificações:

- **Tipo "texto"**: Mensagens como texto normal (comportamento atual)
- **Tipo "botão"**: Mensagens com botões interativos (máximo 3 opções)
- **Tipo "lista"**: Mensagens com lista interativa (para mais opções)

## Observações Importantes

1. Mantenha as mensagens que NÃO são opções do chatbot (como confirmações) usando `SendWhatsAppMessage`
2. Apenas substitua as chamadas que enviam listas de opções
3. O sistema fará fallback automático para texto se os formatos interativos falharem
4. Teste cada tipo de chatbot após a implementação