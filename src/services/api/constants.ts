
// API URL configuration
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://dm.tecace.com/api' : 'http://localhost:5000/api');

export const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 
  (import.meta.env.PROD ? 'https://dm.tecace.com' : 'http://localhost:8080');

// Development mode flag - automatically disabled in production
export const devMode = import.meta.env.DEV && 
  (import.meta.env.VITE_FORCE_DEV_MODE === 'true' || false);

// Log configuration info
console.log(`Environment: ${import.meta.env.MODE}`);
console.log('Using API URL:', API_URL);
console.log('Client URL:', CLIENT_URL);
console.log('Development mode with mock data:', devMode ? 'enabled' : 'disabled');
