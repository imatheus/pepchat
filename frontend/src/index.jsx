// PASSO 1: TODAS as importações de módulos vêm primeiro.
import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import App from "./App.jsx";
import { AuthProvider } from "./context/Auth/AuthContext"; 
import process from 'process';
import './index.css';

// PASSO 2: O código do polyfill (window.process) vem DEPOIS das importações.
window.process = process;

// PASSO 3: Removido React.StrictMode para evitar warnings do Material-UI
ReactDOM.render(
  <AuthProvider>
    <CssBaseline />
    <App />
  </AuthProvider>,
  document.getElementById("root")
);