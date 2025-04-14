
// API URL configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const CLIENT_URL = import.meta.env.NODE_ENV === 'production' 
  ? 'https://dm.tecace.com'
  : 'http://localhost:8080';

// Development mode flag
export const devMode = false;

// Log configuration info
console.log('Using API URL:', API_URL);
console.log('Client URL:', CLIENT_URL);
console.log('Development mode with mock data:', devMode ? 'enabled' : 'disabled');
