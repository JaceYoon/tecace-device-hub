
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { VERSION, APP_NAME } from './version'
import { isProduction, API_URL } from './services/api/constants'

// Log application version on startup
console.log(`Starting ${APP_NAME} ${VERSION}`);
console.log('Environment Mode:', import.meta.env.MODE);
console.log('Is Production:', import.meta.env.PROD);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);
console.log('API URL:', API_URL);
console.log('Running in:', isProduction ? 'Production Mode' : 'Development Mode');

// Add React.StrictMode wrapper
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
