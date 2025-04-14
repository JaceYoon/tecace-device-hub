
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { APP_VERSION } from './constants/version'

// Log version information
console.log(`Starting Tecace Device Management System ${APP_VERSION}`);

// Add React.StrictMode wrapper
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
