import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "../Auth/AuthContext";
import api from "../../services/api";
import { socketConnection } from "../../services/socket";

const TutorialContext = createContext();

const TutorialProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [showQueuesTutorial, setShowQueuesTutorial] = useState(false);
  const [showConnectionsTutorial, setShowConnectionsTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Verificar se deve mostrar o tutorial de setores (apenas uma vez quando o usuário carrega)
  useEffect(() => {
    const checkShouldShowTutorial = async () => {
      if (!user || !user.id) return;

      try {
        // Verificar se a empresa tem setores cadastrados
        const { data: queues } = await api.get("/queue");
        
        // Se não há setores cadastrados e o usuário é admin, mostrar tutorial de setores
        if (queues && queues.length === 0 && (user.profile === "admin" || user.super)) {
          setShowQueuesTutorial(true);
          setShowConnectionsTutorial(false);
          setTutorialCompleted(false);
          return;
        }
        
        // Se há setores, verificar conexões WhatsApp
        if (queues && queues.length > 0 && (user.profile === "admin" || user.super)) {
          const { data: connections } = await api.get("/whatsapp");
          
          // Se não há conexões, mostrar tutorial de conexões
          if (connections && connections.length === 0) {
            setShowQueuesTutorial(false);
            setShowConnectionsTutorial(true);
            setTutorialCompleted(false);
            return;
          }
          
          // Se há setores e conexões, tutorial completo
          setShowQueuesTutorial(false);
          setShowConnectionsTutorial(false);
          setTutorialCompleted(true);
        }
      } catch (error) {
        console.error("Erro ao verificar tutorial:", error);
        setShowQueuesTutorial(false);
        setShowConnectionsTutorial(false);
      }
    };

    if (user && user.id) {
      checkShouldShowTutorial();
    }
  }, [user]);

  // Escutar mudanças nos setores via socket
  useEffect(() => {
    if (!user || !user.companyId) return;

    const companyId = user.companyId;
    const socket = socketConnection({ companyId });

    socket.on(`company-${companyId}-queue`, (data) => {
      if (data.action === "create") {
        // Quando um setor é criado, verificar se deve mostrar tutorial de conexões
        setShowQueuesTutorial(false);
        
        // Verificar se há conexões WhatsApp
        api.get("/whatsapp").then(({ data: connections }) => {
          if (connections && connections.length === 0) {
            setShowConnectionsTutorial(true);
          } else {
            setTutorialCompleted(true);
            setShowConnectionsTutorial(false);
          }
        }).catch(() => {
          setShowConnectionsTutorial(true);
        });
      }
    });

    // Escutar mudanças nas conexões WhatsApp
    socket.on(`company-${companyId}-whatsapp`, (data) => {
      if (data.action === "update" || data.action === "create") {
        // Quando uma conexão é criada/atualizada, esconder tutorial de conexões
        setShowConnectionsTutorial(false);
        setTutorialCompleted(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const completeTutorial = () => {
    // Apenas esconde o tutorial temporariamente, não salva no localStorage
    setShowQueuesTutorial(false);
    setShowConnectionsTutorial(false);
  };

  const dismissTutorial = () => {
    // Apenas esconde o tutorial temporariamente
    setShowQueuesTutorial(false);
    setShowConnectionsTutorial(false);
  };

  return (
    <TutorialContext.Provider
      value={{
        showQueuesTutorial,
        showConnectionsTutorial,
        tutorialCompleted,
        completeTutorial,
        dismissTutorial
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export { TutorialContext, TutorialProvider };