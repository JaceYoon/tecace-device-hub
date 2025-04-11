
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { VERSION, APP_NAME } from './version'

// Log application version on startup
console.log(`Starting ${APP_NAME} ${VERSION}`);
console.log('Environment:', import.meta.env.MODE);

// Add React.StrictMode wrapper
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
