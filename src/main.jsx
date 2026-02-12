import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './Context/AppContext';
import { AuthProvider } from './Context/AuthContext'; // <--- 1. IMPORT OBLIGATOIRE

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    {/* 👇 2. ON AJOUTE LE AUTH PROVIDER ICI 👇 */}
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
    {/* 👆 FIN DES PROVIDERS 👆 */}
  </BrowserRouter>
);