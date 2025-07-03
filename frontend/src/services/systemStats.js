import api from "./api";

const systemStatsService = {
  // Buscar estatísticas gerais do sistema
  getSystemStats: async () => {
    try {
      const response = await api.get("/system/stats");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar estatísticas do sistema:", error);
      throw error;
    }
  },

  // Buscar dados de crescimento de usuários
  getUserGrowthStats: async () => {
    try {
      const response = await api.get("/system/user-growth");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar dados de crescimento:", error);
      throw error;
    }
  },

  // Buscar estatísticas detalhadas das empresas
  getDetailedCompanyStats: async () => {
    try {
      const response = await api.get("/system/companies");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar estatísticas detalhadas:", error);
      throw error;
    }
  },

  // Buscar eventos de segurança
  getSecurityEvents: async (type = null, limit = 100) => {
    try {
      const params = { limit };
      if (type) params.type = type;
      
      const response = await api.get("/security/events", { params });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar eventos de segurança:", error);
      throw error;
    }
  },

  // Buscar resumo de segurança
  getSecuritySummary: async () => {
    try {
      const response = await api.get("/security/summary");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar resumo de segurança:", error);
      throw error;
    }
  }
};

export default systemStatsService;