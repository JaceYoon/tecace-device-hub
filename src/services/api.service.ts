
// This file is kept for backward compatibility
// It re-exports all functionality from the new modular API structure
import { api, resetLoggedOutState, setUserLoggedOut, authService, deviceService, userService } from './api';

// Re-export everything for backward compatibility
export { 
  resetLoggedOutState,
  setUserLoggedOut,
  authService,
  deviceService,
  userService
};

export default api;
