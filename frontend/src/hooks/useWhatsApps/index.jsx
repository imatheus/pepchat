import { useState, useEffect, useReducer, useRef } from "react";
import toastError from "../../errors/toastError";

import api from "../../services/api";
import { socketManager } from "../../services/socketManager";
import { tokenManager } from "../../utils/tokenManager";

const reducer = (state, action) => {
  if (action.type === "LOAD_WHATSAPPS") {
    const whatsApps = action.payload;

    return [...whatsApps];
  }

  if (action.type === "UPDATE_WHATSAPPS") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex] = whatsApp;
      return [...state];
    } else {
      return [whatsApp, ...state];
    }
  }

  if (action.type === "UPDATE_SESSION") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex] = {
        ...state[whatsAppIndex],
        status: whatsApp.status,
        updatedAt: whatsApp.updatedAt,
        qrcode: whatsApp.qrcode,
        retries: whatsApp.retries
      };
      return [...state];
    } else {
      return [...state];
    }
  }

  if (action.type === "DELETE_WHATSAPPS") {
    const whatsAppId = action.payload;

    const whatsAppIndex = state.findIndex((s) => s.id === whatsAppId);
    if (whatsAppIndex !== -1) {
      state.splice(whatsAppIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useWhatsApps = () => {
  const [whatsApps, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/whatsapp/?session=0");
        if (isMountedRef.current) {
          dispatch({ type: "LOAD_WHATSAPPS", payload: data });
          setLoading(false);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setLoading(false);
          toastError(err);
        }
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const companyId = tokenManager.getCompanyId() || localStorage.getItem("companyId");
    
    if (!companyId || companyId === "null" || companyId === "undefined") {
      console.warn("useWhatsApps: No valid companyId found, skipping socket connection");
      return;
    }

    const handleWhatsappUpdate = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "update") {
        dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
      }
    };

    const handleSessionUpdate = (data) => {
      if (!isMountedRef.current) return;
      
      if (data.action === "update") {
        dispatch({ type: "UPDATE_SESSION", payload: data.session });
      }
    };

    // Connect using socketManager
    const connectSocket = async () => {
      try {
        await socketManager.connect(companyId);
        
        // Register event listeners
        socketManager.on(`company-${companyId}-whatsapp`, handleWhatsappUpdate);
        socketManager.on(`company-${companyId}-whatsappSession`, handleSessionUpdate);
        
      } catch (error) {
        console.error("useWhatsApps: Failed to connect socket", error);
      }
    };

    connectSocket();

    return () => {
      // Remove only the specific listeners for this hook
      socketManager.off(`company-${companyId}-whatsapp`);
      socketManager.off(`company-${companyId}-whatsappSession`);
    };
  }, []);

  return { whatsApps, loading };
};

export default useWhatsApps;
