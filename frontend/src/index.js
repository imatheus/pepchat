// PASSO 1: TODAS as importações de módulos vêm primeiro.
import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import App from "./App";
import { AuthProvider } from "./context/Auth/AuthContext"; 
import process from 'process';
import './index.css';

// PASSO 2: O código do polyfill (window.process) vem DEPOIS das importações.
window.process = process;

// PASSO 3: O resto do código permanece o mesmo, usando o nome correto <AuthProvider>.
ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <CssBaseline />
      <App />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);