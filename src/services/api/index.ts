
import apiCall from './apiCall';
import { resetLoggedOutState, setUserLoggedOut } from './constants';
import authService from './services/authService';
import deviceService from './services/deviceService';
import userService from './services/userService';

// Re-export utilities
export { 
  resetLoggedOutState,
  setUserLoggedOut,
  apiCall
};

// Export services
export {
  authService,
  deviceService,
  userService
};

// Export the api object that contains all methods
export const api = {
  auth: authService,
  devices: deviceService,
  users: userService,
  get: <T>(endpoint: string): Promise<T> => apiCall<T>(endpoint),
  post: <T>(endpoint: string, data: any): Promise<T> => apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: <T>(endpoint: string, data: any): Promise<T> => apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: <T>(endpoint: string): Promise<T> => apiCall<T>(endpoint, {
    method: 'DELETE'
  })
};

export default api;
