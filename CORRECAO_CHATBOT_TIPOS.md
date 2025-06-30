# Correção dos Tipos de Chatbot

## Problema
O sistema tem configuração para diferentes tipos de chatbot (texto, botão, lista), mas independente da configuração, sempre envia mensagens em formato de texto.

## Solução
Implementar as funções para buscar a configuração do tipo de chatbot e formatar as mensagens de acordo com o tipo selecionado.

## Código a ser adicionado

### 1. Adicionar antes da função `handleChatbot`:

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

### 2. Modificar a função `handleChatbot` para usar o tipo de chatbot:

Substituir todas as chamadas de `SendWhatsAppMessage` na função `handleChatbot` por chamadas para `sendChatbotMessage`.

#### Exemplo de modificação:

**Antes:**
```typescript
const body = formatBody(`\u200e${selectedOption.message}\n\n${options}`, ticket.contact);
await SendWhatsAppMessage({ body, ticket });
```

**Depois:**
```typescript
const chatbotType = await getChatbotType(ticket.companyId);
await sendChatbotMessage(wbot, ticket, selectedOption.message, options, chatbotType);
```

### 3. Aplicar as modificações em todos os pontos da função `handleChatbot`:

1. Quando mostra subopções após selecionar uma opção principal
2. Quando mostra opções principais
3. Quando mostra opções do nível anterior
4. Quando mostra opções filhas
5. Quando mostra subopções

## Resultado Esperado

Após a implementação:

- **Tipo "texto"**: Mensagens formatadas como texto normal (comportamento atual)
- **Tipo "botão"**: Mensagens com botões interativos do WhatsApp (máximo 3 opções)
- **Tipo "lista"**: Mensagens com lista interativa do WhatsApp (para mais de 3 opções)

## Observações

1. O WhatsApp Business API tem limitações:
   - Botões: máximo 3 opções
   - Listas: recomendado para mais de 3 opções
   
2. Fallback automático para texto se os formatos interativos falharem

3. Mantém compatibilidade com o sistema atual