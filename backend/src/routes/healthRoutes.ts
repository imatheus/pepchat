import { Router } from "express";

const healthRoutes = Router();

// Rota de teste para verificar se o backend está funcionando
healthRoutes.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend is running", 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8080
  });
});

export default healthRoutes;