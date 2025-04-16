
import { Device, DeviceRequest, User } from '@/types';
import { toast } from 'sonner';
import api from './api/index';
import { VERSION } from '@/constants/version';

// Log version information in dev mode
if (process.env.NODE_ENV === 'development') {
  console.log(`%c Tecace Device Management System v${VERSION} (Development Mode) `, 'background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;');
} else {
  console.log(`%c Tecace Device Management System v${VERSION} `, 'background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;');
}

// Create a global refresh callback mechanism
let refreshCallbacks: (() => void)[] = [];

// Import services after initializing variables to avoid circular dependencies
import { 
  deviceService, 
  authService, 
  resetLoggedOutState, 
  setUserLoggedOut 
} from './api.service';

// Import user service last to ensure all other imports are complete
import { userService } from './api/user.service';

// Create a unified dataService object that includes all the services
export const dataService = {
  // Export auth service
  auth: authService,
  
  // Export device service
  devices: deviceService,
  
  // Export user service
  users: userService,
  
  // Re-export utility functions for auth status management
  resetLoggedOutState,
  setUserLoggedOut,
  
  // Version information
  version: VERSION,
  
  // Add direct methods to maintain compatibility with existing code
  getDeviceHistory: deviceService.getDeviceHistory,
  getDevices: deviceService.getAll,
  getUsers: userService.getAll,
  getRequests: deviceService.getAllRequests,
  updateDevice: deviceService.update,
  deleteDevice: deviceService.delete,
  processRequest: deviceService.processRequest,
  addDevice: deviceService.create,
  
  addRequest: async (request: Omit<DeviceRequest, 'id' | 'requestedAt'>): Promise<DeviceRequest> => {
    console.log('Processing addRequest with:', request);
    
    try {
      // Now directly use the return type without special handling
      return await deviceService.requestDevice(
        request.deviceId,
        request.type as 'assign' | 'release' | 'report' | 'return',
        { 
          reportType: request.reportType as 'missing' | 'stolen' | 'dead',
          reason: request.reason
        }
      );
    } catch (error) {
      console.error('Error adding request:', error);
      toast.error('Failed to process device request');
      throw error;
    }
  },
  
  // Define triggerRefresh function
  triggerRefresh: () => {
    refreshCallbacks.forEach(callback => callback());
  },
  
  registerRefreshCallback: (callback: () => void) => {
    refreshCallbacks.push(callback);
    return () => {
      refreshCallbacks = refreshCallbacks.filter(cb => cb !== callback);
    };
  },
  
  // Helper methods for HTTP operations
  get: api.get,
  post: api.post,
  put: api.put,
  delete: api.delete
};

// Export the dataService as default as well for flexibility
export default dataService;
