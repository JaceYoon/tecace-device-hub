
import { Device, DeviceRequest, User } from '@/types';
import { deviceService, userService } from './api.service';

/**
 * This service exclusively uses the API for all data operations
 */
export const dataService = {
  // Device methods
  getDevices: async (): Promise<Device[]> => {
    try {
      const devices = await deviceService.getAll();
      console.log('Fetched devices from API:', devices);
      
      // Ensure device IDs are strings for consistent comparison
      const formattedDevices = devices.map(device => {
        // Make sure ID is a string
        if (device.id) {
          device.id = String(device.id);
        }
        
        // Make sure assignedTo and assignedToId are always strings for proper comparison
        if (device.assignedTo) {
          device.assignedTo = String(device.assignedTo);
        }
        
        if (device.assignedToId) {
          device.assignedToId = String(device.assignedToId);
        }
        
        // Ensure proper assignment between assignedTo and assignedToId
        if (device.assignedToId && !device.assignedTo) {
          device.assignedTo = String(device.assignedToId);
        } else if (device.assignedTo && !device.assignedToId) {
          device.assignedToId = String(device.assignedTo);
        }
        
        // Log devices with assignments for debugging
        if (device.assignedTo || device.assignedToId) {
          console.log(`Device ${device.project} is assigned to: ${device.assignedTo || device.assignedToId}`);
        }
        
        return device;
      });
      
      return Array.isArray(formattedDevices) ? formattedDevices : [];
    } catch (error) {
      console.error('Error fetching devices from API', error);
      return [];
    }
  },

  getDeviceById: async (id: string): Promise<Device | undefined> => {
    try {
      const device = await deviceService.getById(id);
      return device || undefined;
    } catch (error) {
      console.error('Error fetching device from API', error);
      return undefined;
    }
  },

  getDeviceHistory: async (id: string): Promise<any[]> => {
    try {
      const history = await deviceService.getDeviceHistory(id);
      return history;
    } catch (error) {
      console.error('Error fetching device history from API', error);
      return [];
    }
  },

  addDevice: async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> => {
    try {
      console.log('Sending device to API:', device);
      const newDevice = await deviceService.create(device);
      console.log('API response for device creation:', newDevice);
      return newDevice;
    } catch (error) {
      console.error('Error adding device to API:', error);
      throw error; // Re-throw the error
    }
  },

  updateDevice: async (id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<Device | null> => {
    try {
      console.log('Updating device:', id, updates);
      const updatedDevice = await deviceService.update(id, updates);
      console.log('Updated device result:', updatedDevice);
      return updatedDevice;
    } catch (error) {
      console.error('Error updating device in API', error);
      throw error;
    }
  },

  deleteDevice: async (id: string): Promise<boolean> => {
    try {
      console.log('Deleting device with ID:', id);
      const result = await deviceService.delete(id);
      console.log('Delete API response:', result);
      return true;
    } catch (error) {
      console.error('Error deleting device from API:', error);
      throw error;
    }
  },

  // Request methods
  getRequests: async (): Promise<DeviceRequest[]> => {
    try {
      const requests = await deviceService.getAllRequests();
      console.log('Fetched requests from API:', requests);
      
      // Get devices and users to resolve names
      let devices: Device[] = [];
      let users: User[] = [];
      
      try {
        devices = await dataService.getDevices();
      } catch (error) {
        console.error('Error fetching devices for request mapping:', error);
        devices = [];
      }
      
      try {
        users = await dataService.getUsers();
      } catch (error) {
        console.error('Error fetching users for request mapping:', error);
        users = [];
      }
      
      // Ensure dates are properly formatted as Date objects and resolve references
      const formattedRequests = requests.map(request => {
        // Find the device and user for this request
        const device = devices.find(d => d.id === request.deviceId);
        const user = users.find(u => u.id === request.userId);
        
        return {
          ...request,
          deviceName: device?.project || 'Unknown Device',
          userName: user?.name || 'Unknown User',
          requestedAt: request.requestedAt ? new Date(request.requestedAt) : new Date(),
          processedAt: request.processedAt ? new Date(request.processedAt) : undefined,
          // Add an explicit device property if it doesn't exist
          device: request.device || device || undefined
        };
      });
      
      return Array.isArray(formattedRequests) ? formattedRequests : [];
    } catch (error) {
      console.error('Error fetching requests from API', error);
      
      // If we get the specific alias error, we'll have to work with a client-side workaround
      // until the backend is fixed
      if (error instanceof Error && 
          error.message.includes('alias') && 
          error.message.includes('device is associated')) {
        console.log('Using client-side workaround for device association error');
        
        try {
          // Get devices and manually create request objects
          const devices = await dataService.getDevices();
          const users = await dataService.getUsers();
          
          // We'll only get pending requests from devices with requestedBy field
          const pendingRequests: DeviceRequest[] = devices
            .filter(device => device.requestedBy)
            .map(device => {
              const user = users.find(u => u.id === device.requestedBy);
              return {
                id: `temp-${device.id}-${Date.now()}`,
                deviceId: device.id,
                userId: device.requestedBy || '',
                status: 'pending',
                type: 'assign', // Assuming assign as default
                requestedAt: new Date(),
                device: device,
                user: user,
                deviceName: device.project,
                userName: user?.name || 'Unknown User'
              };
            });
            
          console.log('Created temporary request objects:', pendingRequests);
          return pendingRequests;
        } catch (secondError) {
          console.error('Error in fallback request handling:', secondError);
          return [];
        }
      }
      
      return [];
    }
  },

  addRequest: async (request: Omit<DeviceRequest, 'id' | 'requestedAt'>): Promise<DeviceRequest> => {
    try {
      console.log('Adding request:', request);
      const newRequest = await deviceService.requestDevice(request.deviceId, request.type);
      console.log('Request result:', newRequest);
      
      // For release requests (user returning device), directly update the device status
      if (request.type === 'release') {
        try {
          console.log('Auto-releasing device:', request.deviceId);
          const updatedDevice = await dataService.updateDevice(request.deviceId, {
            assignedTo: undefined,
            status: 'available',
          });
          console.log('Device released successfully:', updatedDevice);
        } catch (releaseError) {
          console.error('Error auto-releasing device:', releaseError);
        }
      }
      
      // Ensure dates are properly formatted
      return {
        ...newRequest,
        requestedAt: newRequest.requestedAt ? new Date(newRequest.requestedAt) : new Date(),
        processedAt: newRequest.processedAt ? new Date(newRequest.processedAt) : undefined
      };
    } catch (error) {
      console.error('Error adding request to API', error);
      throw error; 
    }
  },

  processRequest: async (id: string, status: 'approved' | 'rejected', managerId: string): Promise<DeviceRequest | null> => {
    try {
      console.log(`Processing request ${id} with status ${status}`);
      const processedRequest = await deviceService.processRequest(id, status);
      console.log('Process result:', processedRequest);
      
      if (!processedRequest) return null;
      
      // If we successfully processed the request through the API,
      // make sure device state is updated accordingly
      if (status === 'approved' && processedRequest.type === 'assign') {
        try {
          console.log(`Updating device ${processedRequest.deviceId} assignment to ${processedRequest.userId}`);
          await dataService.updateDevice(processedRequest.deviceId, {
            assignedTo: processedRequest.userId,
            status: 'assigned',
            requestedBy: undefined
          });
        } catch (updateError) {
          console.error('Error updating device after request approval:', updateError);
        }
      } else if (status === 'rejected') {
        try {
          console.log(`Clearing requestedBy for device ${processedRequest.deviceId}`);
          await dataService.updateDevice(processedRequest.deviceId, {
            requestedBy: undefined
          });
        } catch (updateError) {
          console.error('Error updating device after request rejection:', updateError);
        }
      }
      
      // Ensure dates are properly formatted
      return {
        ...processedRequest,
        requestedAt: processedRequest.requestedAt ? new Date(processedRequest.requestedAt) : new Date(),
        processedAt: processedRequest.processedAt ? new Date(processedRequest.processedAt) : undefined
      };
    } catch (error) {
      console.error('Error processing request in API', error);
      throw error;
    }
  },

  // Special method for cancellation by the requester
  cancelRequest: async (id: string, userId: string): Promise<DeviceRequest | null> => {
    try {
      const cancelledRequest = await deviceService.cancelRequest(id);
      if (!cancelledRequest) return null;
      
      // Also update the device status to clear the requestedBy field
      try {
        console.log(`Clearing requestedBy for device ${cancelledRequest.deviceId}`);
        await dataService.updateDevice(cancelledRequest.deviceId, {
          requestedBy: undefined
        });
      } catch (updateError) {
        console.error('Error updating device after request cancellation:', updateError);
      }
      
      // Ensure dates are properly formatted
      return {
        ...cancelledRequest,
        requestedAt: cancelledRequest.requestedAt ? new Date(cancelledRequest.requestedAt) : new Date(),
        processedAt: cancelledRequest.processedAt ? new Date(cancelledRequest.processedAt) : undefined
      };
    } catch (error) {
      console.error('Error cancelling request in API', error);
      throw error;
    }
  },

  // User methods
  getUsers: async (): Promise<User[]> => {
    try {
      const users = await userService.getAll();
      console.log('Fetched users from API:', users);
      
      // Ensure user IDs are strings for consistent comparison
      const formattedUsers = users.map(user => {
        if (user.id) {
          user.id = String(user.id);
        }
        return user;
      });
      
      return Array.isArray(formattedUsers) ? formattedUsers : [];
    } catch (error) {
      console.error('Error fetching users from API', error);
      return [];
    }
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    try {
      const user = await userService.getById(id);
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user from API', error);
      return undefined;
    }
  }
};
