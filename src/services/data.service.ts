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
        // Make sure assignedTo is always a string for proper comparison
        if (device.assignedTo) {
          device.assignedTo = String(device.assignedTo);
        }
        
        // Ensure proper assignment between assignedTo and assignedToId
        if (device.assignedToId && !device.assignedTo) {
          device.assignedTo = String(device.assignedToId);
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
      const updatedDevice = await deviceService.update(id, updates);
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
      const devices = await dataService.getDevices();
      const users = await dataService.getUsers();
      
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
          processedAt: request.processedAt ? new Date(request.processedAt) : undefined
        };
      });
      
      return Array.isArray(formattedRequests) ? formattedRequests : [];
    } catch (error) {
      console.error('Error fetching requests from API', error);
      return [];
    }
  },

  addRequest: async (request: Omit<DeviceRequest, 'id' | 'requestedAt'>): Promise<DeviceRequest> => {
    try {
      const newRequest = await deviceService.requestDevice(request.deviceId, request.type);
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
      const processedRequest = await deviceService.processRequest(id, status);
      if (!processedRequest) return null;
      
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
