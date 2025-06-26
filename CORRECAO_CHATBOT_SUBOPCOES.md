# Correção das Subopções do Chatbot

## Problema Identificado
As subopções do chatbot não aparecem no WhatsApp para o cliente final.

## Causa do Problema
A lógica de navegação entre opções e subopções no arquivo `wbotMessageListener.ts` não estava tratando corretamente:
1. A exibição de subopções após selecionar uma opção principal
2. A navegação entre níveis de opções
3. O botão de voltar ao menu anterior

## Solução Implementada

### Arquivo a ser modificado:
`/backend/src/services/WbotServices/wbotMessageListener.ts`

### Função a ser substituída:
Substituir a função `handleChatbot` completa pela versão corrigida abaixo:

```typescript
const handleChatbot = async (
  ticket: Ticket, 
  msg: proto.IWebMessageInfo, 
  wbot: Session, 
  dontReadTheFirstQuestion: boolean = false
): Promise<void> => {  
  const queue = await Queue.findByPk(ticket.queueId);
  
  if (!queue) {
    return;
  }

  const messageBody = getBodyMessage(msg);
  
  // Voltar para o menu inicial
  if (messageBody == "#") {
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await ticket.reload();
    await verifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  // Se o ticket não tem queueOptionId, é a primeira interação com o chatbot
  if (isNil(ticket.queueOptionId)) {
    const queueOptions = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [["option", "ASC"], ["createdAt", "ASC"]],
    });

    // Se o usuário enviou uma mensagem, verificar se corresponde a uma opção
    if (messageBody && !dontReadTheFirstQuestion) {
      const selectedOption = queueOptions.find((o) => o.option == messageBody);
      if (selectedOption) {
        await ticket.update({ queueOptionId: selectedOption.id });
        
        // Verificar se esta opção tem sub-opções
        const hasSubOptions = await QueueOption.count({
          where: { parentId: selectedOption.id }
        });

        if (hasSubOptions > 0) {
          // Se tem sub-opções, mostrar elas
          const subOptions = await QueueOption.findAll({
            where: { parentId: selectedOption.id },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          let options = "";
          subOptions.forEach((option) => {
            options += `*[ ${option.option} ]* - ${option.title}\n`;
          });
          options += `\n*[ 0 ]* - Voltar ao menu anterior\n*[ # ]* - Voltar ao Menu Principal`;

          const body = formatBody(`\u200e${selectedOption.message}\n\n${options}`, ticket.contact);
          await SendWhatsAppMessage({ body, ticket });
        } else {
          // Se não tem sub-opções, enviar apenas a mensagem
          const body = formatBody(`\u200e${selectedOption.message}\n\n*[ 0 ]* - Voltar ao menu anterior\n*[ # ]* - Voltar ao Menu Principal`, ticket.contact);
          await SendWhatsAppMessage({ body, ticket });
        }
        return;
      }
    }

    // Mostrar opções principais se não selecionou nenhuma válida
    if (queueOptions.length > 0) {
      let options = "";
      queueOptions.forEach((option) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ # ]* - Voltar ao Menu Principal`;

      const textMessage = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact);
      await SendWhatsAppMessage({ body: textMessage, ticket });
    } else {
      await ticket.update({ chatbot: false });
    }

  } else {
    // Usuário já está em uma opção, verificar sub-opções
    const subOptions = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [["option", "ASC"], ["createdAt", "ASC"]],
    });

    if (messageBody) {
      if (messageBody == "0") {
        // Voltar para o menu anterior
        const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
        if (currentOption && currentOption.parentId) {
          await ticket.update({ queueOptionId: currentOption.parentId });
          
          // Mostrar opções do nível anterior
          const parentOptions = await QueueOption.findAll({
            where: { parentId: currentOption.parentId },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          if (parentOptions.length > 0) {
            let options = "";
            parentOptions.forEach((option) => {
              options += `*[ ${option.option} ]* - ${option.title}\n`;
            });
            options += `\n*[ 0 ]* - Voltar ao menu anterior\n*[ # ]* - Voltar ao Menu Principal`;

            const parentOption = await QueueOption.findByPk(currentOption.parentId);
            const body = formatBody(`\u200e${parentOption?.message || queue.greetingMessage}\n\n${options}`, ticket.contact);
            await SendWhatsAppMessage({ body, ticket });
          }
        } else {
          // Voltar para as opções principais
          await ticket.update({ queueOptionId: null });
          const mainOptions = await QueueOption.findAll({
            where: { queueId: ticket.queueId, parentId: null },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          let options = "";
          mainOptions.forEach((option) => {
            options += `*[ ${option.option} ]* - ${option.title}\n`;
          });
          options += `\n*[ # ]* - Voltar ao Menu Principal`;

          const body = formatBody(`\u200e${queue.greetingMessage}\n\n${options}`, ticket.contact);
          await SendWhatsAppMessage({ body, ticket });
        }
        return;
      }

      // Verificar se selecionou uma sub-opção válida
      const selectedSubOption = subOptions.find((o) => o.option == messageBody);
      if (selectedSubOption) {
        await ticket.update({ queueOptionId: selectedSubOption.id });
        
        // Verificar se esta sub-opção tem filhos
        const hasChildren = await QueueOption.count({
          where: { parentId: selectedSubOption.id }
        });

        if (hasChildren > 0) {
          // Mostrar as opções filhas
          const childOptions = await QueueOption.findAll({
            where: { parentId: selectedSubOption.id },
            order: [["option", "ASC"], ["createdAt", "ASC"]]
          });

          let childOptionsText = "";
          childOptions.forEach((option) => {
            childOptionsText += `*[ ${option.option} ]* - ${option.title}\n`;
          });
          childOptionsText += `\n*[ 0 ]* - Voltar ao menu anterior\n*[ # ]* - Voltar ao Menu Principal`;

          const body = formatBody(`\u200e${selectedSubOption.message}\n\n${childOptionsText}`, ticket.contact);
          await SendWhatsAppMessage({ body, ticket });
        } else {
          // Opção final, sem filhos
          const body = formatBody(`\u200e${selectedSubOption.message}\n\n*[ 0 ]* - Voltar ao menu anterior\n*[ # ]* - Voltar ao Menu Principal`, ticket.contact);
          await SendWhatsAppMessage({ body, ticket });
        }
        return;
      }
    }

    // Se chegou aqui e tem sub-opções, mostrar elas
    if (subOptions.length > 0) {
      const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
      let options = "";
      subOptions.forEach((option) => {
        options += `*[ ${option.option} ]* - ${option.title}\n`;
      });
      options += `\n*[ 0 ]* - Voltar ao menu anterior\n*[ # ]* - Voltar ao Menu Principal`;

      const body = formatBody(`\u200e${currentOption?.message || 'Escolha uma opção:'}\n\n${options}`, ticket.contact);
      await SendWhatsAppMessage({ body, ticket });
    } else {
      // Opção final sem sub-opções
      const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
      if (currentOption) {
        const body = formatBody(`\u200e${currentOption.message}\n\n*[ 0 ]* - Voltar ao menu anterior\n*[ # ]* - Voltar ao Menu Principal`, ticket.contact);
        await SendWhatsAppMessage({ body, ticket });
      }
    }
  }
};
```

## Principais Melhorias Implementadas

### 1. **Navegação Hierárquica Corrigida**
- Agora verifica corretamente se uma opção tem sub-opções antes de exibi-las
- Implementa navegação entre níveis com o botão "0" (voltar ao menu anterior)
- Mantém o botão "#" para voltar ao menu principal

### 2. **Exibição de Subopções**
- Quando uma opção principal é selecionada, verifica se tem filhos
- Se tem filhos, exibe as subopções automaticamente
- Se não tem filhos, exibe apenas a mensagem da opção

### 3. **Navegação Melhorada**
- **"0"**: Volta ao menu anterior (um nível acima)
- **"#"**: Volta ao menu principal (reset completo)
- Navegação funciona em qualquer nível da hierarquia

### 4. **Suporte a Múltiplos Níveis**
- Suporta hierarquia infinita de opções (opção > subopção > sub-subopção...)
- Cada nível mantém sua própria numeração
- Navegação funciona corretamente em todos os níveis

## Como Testar

1. **Criar estrutura de teste**:
   - Setor: "Suporte"
   - Opção 1: "Problemas Técnicos"
     - Subopção 1.1: "Internet"
     - Subopção 1.2: "Equipamentos"
   - Opção 2: "Financeiro"
     - Subopção 2.1: "Boletos"
     - Subopção 2.2: "Pagamentos"

2. **Testar fluxo**:
   - Enviar mensagem para o WhatsApp
   - Selecionar setor "Suporte"
   - Selecionar opção "1" (Problemas Técnicos)
   - Verificar se aparecem as subopções (Internet, Equipamentos)
   - Testar navegação com "0" e "#"

3. **Verificar**:
   - Subopções aparecem corretamente
   - Navegação funciona em todos os níveis
   - Botões de voltar funcionam adequadamente

## Resultado Esperado

Após a implementação, o chatbot deve:
- Exibir subopções automaticamente quando uma opção principal for selecionada
- Permitir navegação fluida entre níveis
- Funcionar corretamente com hierarquias de múltiplos níveis
- Manter a experiência do usuário intuitiva e funcional