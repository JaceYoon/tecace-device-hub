
/**
 * Application configuration settings
 * Environment variables can be set in the .env file or through the hosting platform
 */

// API URL configuration
export const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Feature flags
export const FEATURES = {
  // Enable/disable development mode with mock data
  ENABLE_DEV_MODE: import.meta.env.VITE_ENABLE_DEV_MODE === 'true' || false,
  
  // Debug settings (disable in production)
  ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true' || !import.meta.env.PROD
};

// Version info
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Helper function to determine if running in production mode
 */
export const isProduction = (): boolean => import.meta.env.PROD === true;

/**
 * Get the appropriate base URL for the environment
 */
export const getBaseUrl = (): string => {
  return isProduction() 
    ? window.location.origin 
    : 'http://localhost:8080';
};
