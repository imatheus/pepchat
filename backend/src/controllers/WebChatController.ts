import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Message from "../models/Message";
import Whatsapp from "../models/Whatsapp";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../services/MessageServices/CreateMessageService";
import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";

export const receiveMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📨 Recebendo mensagem do webchat:", req.body);
    
    const { message, chatId, companyName } = req.body;

    if (!message || !chatId) {
      console.log("❌ Dados obrigatórios não fornecidos");
      res.status(400).json({ error: "Message and chatId are required" });
    }

    // Buscar conexão webchat (usar a primeira encontrada)
    let webChatConnection = await Whatsapp.findOne({
      where: {
        channel: "webchat"
      }
    });

    console.log("🔍 Conexão webchat encontrada:", webChatConnection ? "Sim" : "Não");

    // Se não existir, criar uma conexão webchat automaticamente
    if (!webChatConnection) {
      console.log("🔧 Criando conexão webchat automaticamente...");
      
      try {
        const { whatsapp } = await CreateWhatsAppService({
          name: "Chat Web - Auto",
          status: "CONNECTED",
          isDefault: false,
          greetingMessage: "Olá! Como posso ajudá-lo?",
          complationMessage: "",
          outOfHoursMessage: "",
          queueIds: [],
          companyId: 1, // Usar company ID 1 como padrão
          channel: "webchat",
          facebookUserId: "",
          facebookUserToken: "",
          facebookPageUserId: `webchat_auto_${Date.now()}`,
          tokenMeta: JSON.stringify({
            primaryColor: "#1976d2",
            position: "bottom-right",
            companyName: "PepChat",
            welcomeMessage: "Olá! Como posso ajudá-lo?"
          })
        });
        
        webChatConnection = whatsapp;
        console.log("✅ Conexão webchat criada automaticamente:", webChatConnection.id);
        
        // Emitir evento para atualizar a interface
        const io = getIO();
        io.emit(`company-1-whatsapp`, {
          action: "update",
          whatsapp: webChatConnection
        });
        
      } catch (createError) {
        console.error("❌ Erro ao criar conexão webchat:", createError);
        res.status(500).json({ error: "Failed to create webchat connection" });
      }
    }

    const companyId = webChatConnection.companyId;
    console.log("🏢 Company ID:", companyId);

    // Criar ou buscar contato baseado no chatId
    const contactData = {
      name: `Visitante Web ${chatId.slice(-8)}`,
      number: chatId,
      email: "",
      isGroup: false,
      companyId
    };

    console.log("👤 Criando/buscando contato:", contactData);
    const contact = await CreateOrUpdateContactService(contactData);
    console.log("✅ Contato criado/encontrado:", contact.id);

    // Criar ou buscar ticket
    console.log("🎫 Criando/buscando ticket...");
    const ticket = await FindOrCreateTicketService(
      contact,
      webChatConnection.id,
      0, // unreadMessages
      companyId
    );
    console.log("✅ Ticket criado/encontrado:", ticket.id, "Status:", ticket.status);

    // Criar mensagem
    const messageData = {
      id: `webchat_${Date.now()}`,
      ticketId: ticket.id,
      contactId: contact.id,
      body: message,
      fromMe: false,
      mediaType: "chat",
      mediaUrl: "",
      read: false,
      quotedMsgId: "",
      ack: 1,
      remoteJid: chatId,
      participant: "",
      dataJson: "",
      ticketTrakingId: null,
      isPrivate: false
    };

    console.log("💬 Criando mensagem:", messageData);
    const createdMessage = await CreateMessageService({ messageData, companyId });
    console.log("✅ Mensagem criada:", createdMessage.id);

    // Emitir eventos via socket
    const io = getIO();
    console.log("📡 Emitindo eventos via socket...");
    
    // Buscar ticket atualizado com relacionamentos
    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: Contact, as: "contact" },
        { model: Whatsapp, as: "whatsapp" }
      ]
    });
    
    // Atualizar ticket
    io.to(`company-${companyId}-${ticket.status}`)
      .to(`company-${companyId}-notification`)
      .to(`ticket-${ticket.id}`)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket: updatedTicket,
        contact
      });

    // Atualizar contador de não lidas
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-ticket`, {
      action: "updateUnread",
      ticketId: ticket.id
    });

    console.log("✅ Eventos emitidos com sucesso");

    // Resposta automática
    const autoReply = "Obrigado pela sua mensagem! Em breve um de nossos atendentes irá responder.";

    console.log("🎉 Processamento concluído com sucesso");

    res.status(200).json({
      success: true,
      reply: autoReply,
      ticketId: ticket.id,
      contactId: contact.id,
      debug: {
        companyId,
        ticketStatus: ticket.status,
        messageId: createdMessage.id,
        webChatConnectionId: webChatConnection.id
      }
    });

  } catch (error) {
    console.error("❌ Erro ao processar mensagem do webchat:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack
    });
  }
};