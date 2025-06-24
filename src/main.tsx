
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { APP_VERSION, BUILD_TYPE } from './constants/version'
import { CLIENT_URL } from './services/api/constants'

// Log version and environment information
const envType = BUILD_TYPE === 'production' ? 'Production' : 'Development';
console.log(`Starting Tecace Device Management System ${APP_VERSION} (${envType} Mode)`);
console.log(`Application URL: ${CLIENT_URL}`);

// Add performance monitoring for v0.3
if (BUILD_TYPE === 'development') {
  console.log('🔧 Development mode: Performance monitoring enabled');
  console.log('📊 Mock data generator available in Device Management');
  console.log('📄 Pagination enabled for better performance with large datasets');
}

// Add React.StrictMode wrapper
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
