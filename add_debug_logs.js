// Script para adicionar logs de debug detalhados

const fs = require('fs');
const path = require('path');

console.log('🔧 Adicionando logs de debug detalhados...');

const listenerPath = path.join(__dirname, 'backend', 'src', 'services', 'WbotServices', 'wbotMessageListener.ts');

if (!fs.existsSync(listenerPath)) {
  console.error('❌ Arquivo wbotMessageListener.ts não encontrado');
  process.exit(1);
}

// Ler o arquivo
let content = fs.readFileSync(listenerPath, 'utf8');

// Adicionar logs detalhados na seção de saudação
const oldSection = `    // Enviar mensagem de saudação para novos tickets (apenas se não for do bot e não for grupo)
    if (isNewTicket && !msg.key.fromMe && !isGroup && whatsapp.greetingMessage && whatsapp.greetingMessage.trim() !== "") {
      try {
        const greetingMessage = formatBody(whatsapp.greetingMessage, contact);
        await SendWhatsAppMessage({ body: greetingMessage, ticket });
        
        // Enviar arquivos de saudação se existirem
        await sendGreetingMediaFiles(wbot, ticket, contact, companyId);
        
        logger.info(\`Greeting message sent to new ticket \${ticket.id}\`);
      } catch (error) {
        logger.error(error, "Error sending greeting message");
      }
    }`;

const newSection = `    // Enviar mensagem de saudação para novos tickets (apenas se não for do bot e não for grupo)
    logger.info(\`Checking greeting conditions: isNewTicket=\${isNewTicket}, fromMe=\${msg.key.fromMe}, isGroup=\${isGroup}, hasGreeting=\${!!whatsapp.greetingMessage}, greetingText="\${whatsapp.greetingMessage?.substring(0, 50)}..."\`);
    
    if (isNewTicket && !msg.key.fromMe && !isGroup && whatsapp.greetingMessage && whatsapp.greetingMessage.trim() !== "") {
      try {
        logger.info(\`Sending greeting message to ticket \${ticket.id} (contact: \${contact.number})\`);
        
        const greetingMessage = formatBody(whatsapp.greetingMessage, contact);
        await SendWhatsAppMessage({ body: greetingMessage, ticket });
        
        logger.info(\`Text greeting sent, now checking for media files...\`);
        
        // Enviar arquivos de saudação se existirem
        await sendGreetingMediaFiles(wbot, ticket, contact, companyId);
        
        logger.info(\`Greeting message and media files sent to new ticket \${ticket.id}\`);
      } catch (error) {
        logger.error(error, "Error sending greeting message");
      }
    } else {
      logger.info(\`Greeting NOT sent - conditions not met for ticket \${ticket.id}\`);
    }`;

// Aplicar a correção
if (content.includes('Enviar mensagem de saudação para novos tickets')) {
  content = content.replace(oldSection, newSection);
  
  // Salvar o arquivo
  fs.writeFileSync(listenerPath, content, 'utf8');
  console.log('✅ Logs de debug adicionados com sucesso!');
  
  console.log('\n📋 Logs adicionados:');
  console.log('1. ✅ Verificação de condições para envio');
  console.log('2. ✅ Log antes de enviar texto');
  console.log('3. ✅ Log antes de enviar arquivos');
  console.log('4. ✅ Log quando condições não são atendidas');
  
} else {
  console.log('⚠️ Seção não encontrada ou já foi modificada');
}

console.log('\n🧪 Como testar:');
console.log('1. Reinicie o backend');
console.log('2. Use um número NOVO (que nunca enviou mensagem antes)');
console.log('3. Envie uma mensagem para a conexão');
console.log('4. Verifique os logs do backend');

console.log('\n📋 Logs esperados:');
console.log('- Checking greeting conditions: isNewTicket=true, fromMe=false...');
console.log('- Sending greeting message to ticket X...');
console.log('- Text greeting sent, now checking for media files...');
console.log('- Looking for greeting media files in: /uploads/...');
console.log('- Found X greeting media files...');

console.log('\n✅ Debug logs adicionados!');