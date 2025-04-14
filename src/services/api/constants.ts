
// API URL configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag
export const devMode = false;

// Log configuration info
console.log('Using API URL:', API_URL);
console.log('Development mode with mock data:', devMode ? 'enabled' : 'disabled');
