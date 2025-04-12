
// API service constants and environment configuration

// Determine if we're in production or development
export const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;

// Set API URL based on environment
export const API_URL = isProduction 
  ? 'http://dm.tecace.com/api' // Production API URL
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'); // Development API URL

// Development mode flag - set to false to use the actual API
export const devMode = false; // Changed to false to use real MariaDB connection

// Log the API URL for debugging
console.log('Environment:', isProduction ? 'Production' : 'Development');
console.log('Using API URL:', API_URL);
console.log('Development mode with mock data:', devMode ? 'enabled' : 'disabled');

// Auth state
let userLoggedOut = false;

// Reset logged out state
export const resetLoggedOutState = () => {
  userLoggedOut = false;
};

// Set user as logged out
export const setUserLoggedOut = () => {
  userLoggedOut = true;
  // Also clear any stored auth data in localStorage
  localStorage.removeItem('dev-user-logged-in');
  localStorage.removeItem('dev-user-id');
};

export const getUserLoggedOut = () => userLoggedOut;
