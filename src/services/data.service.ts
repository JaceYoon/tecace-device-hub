
import { Device, DeviceRequest, User } from '@/types';
import { deviceService, userService } from './api.service';
import { deviceStore, userStore, requestStore } from '@/utils/data';

// Setting to true to force use of localStorage when API calls fail with auth errors
const USE_LOCAL_STORAGE = true;

/**
 * This service acts as a facade over both the API and localStorage implementations
 * allowing the application to transparently use either one
 */
export const dataService = {
  // Device methods
  getDevices: async (): Promise<Device[]> => {
    if (USE_LOCAL_STORAGE) {
      return deviceStore.getDevices();
    }

    try {
      const devices = await deviceService.getAll();
      console.log('Fetched devices from API:', devices);
      return Array.isArray(devices) ? devices : [];
    } catch (error) {
      console.error('Error fetching devices from API, falling back to localStorage', error);
      return deviceStore.getDevices();
    }
  },

  getDeviceById: async (id: string): Promise<Device | undefined> => {
    if (USE_LOCAL_STORAGE) {
      return deviceStore.getDeviceById(id);
    }

    try {
      const device = await deviceService.getById(id);
      return device || undefined;
    } catch (error) {
      console.error('Error fetching device from API, falling back to localStorage', error);
      return deviceStore.getDeviceById(id);
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
      if (USE_LOCAL_STORAGE) {
        console.log('Falling back to localStorage');
        return deviceStore.addDevice(device);
      }
      throw error; // Re-throw if we're not using localStorage fallback
    }
  },

  updateDevice: async (id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<Device | null> => {
    if (USE_LOCAL_STORAGE) {
      return deviceStore.updateDevice(id, updates);
    }

    try {
      const updatedDevice = await deviceService.update(id, updates);
      return updatedDevice;
    } catch (error) {
      console.error('Error updating device in API, falling back to localStorage', error);
      return deviceStore.updateDevice(id, updates);
    }
  },

  deleteDevice: async (id: string): Promise<boolean> => {
    if (USE_LOCAL_STORAGE) {
      return deviceStore.deleteDevice(id);
    }

    try {
      console.log('Deleting device with ID:', id);
      const result = await deviceService.delete(id);
      console.log('Delete API response:', result);
      return true; // Return true if no errors were thrown
    } catch (error) {
      console.error('Error deleting device from API:', error);
      // Try localStorage as a fallback
      const localResult = deviceStore.deleteDevice(id);
      return localResult;
    }
  },

  // Request methods
  getRequests: async (): Promise<DeviceRequest[]> => {
    if (USE_LOCAL_STORAGE) {
      return requestStore.getRequests();
    }

    try {
      const requests = await deviceService.getAllRequests();
      console.log('Fetched requests from API:', requests);
      
      // Ensure dates are properly formatted as Date objects
      const formattedRequests = requests.map(request => ({
        ...request,
        requestedAt: request.requestedAt ? new Date(request.requestedAt) : new Date(),
        processedAt: request.processedAt ? new Date(request.processedAt) : undefined
      }));
      
      return Array.isArray(formattedRequests) ? formattedRequests : [];
    } catch (error) {
      console.error('Error fetching requests from API, falling back to localStorage', error);
      return requestStore.getRequests();
    }
  },

  addRequest: async (request: Omit<DeviceRequest, 'id' | 'requestedAt'>): Promise<DeviceRequest> => {
    if (USE_LOCAL_STORAGE) {
      return requestStore.addRequest(request);
    }

    try {
      const newRequest = await deviceService.requestDevice(request.deviceId, request.type);
      // Ensure dates are properly formatted
      return {
        ...newRequest,
        requestedAt: newRequest.requestedAt ? new Date(newRequest.requestedAt) : new Date(),
        processedAt: newRequest.processedAt ? new Date(newRequest.processedAt) : undefined
      };
    } catch (error) {
      console.error('Error adding request to API, falling back to localStorage', error);
      return requestStore.addRequest(request);
    }
  },

  processRequest: async (id: string, status: 'approved' | 'rejected', managerId: string): Promise<DeviceRequest | null> => {
    if (USE_LOCAL_STORAGE) {
      return requestStore.processRequest(id, status, managerId);
    }

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
      console.error('Error processing request in API, falling back to localStorage', error);
      return requestStore.processRequest(id, status, managerId);
    }
  },

  // Special method for cancellation by the requester
  cancelRequest: async (id: string, userId: string): Promise<DeviceRequest | null> => {
    if (USE_LOCAL_STORAGE) {
      return requestStore.cancelRequest(id, userId);
    }

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
      console.error('Error cancelling request in API, falling back to localStorage', error);
      return requestStore.cancelRequest(id, userId);
    }
  },

  // User methods
  getUsers: async (): Promise<User[]> => {
    if (USE_LOCAL_STORAGE) {
      return userStore.getUsers();
    }

    try {
      const users = await userService.getAll();
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error('Error fetching users from API, falling back to localStorage', error);
      return userStore.getUsers();
    }
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    if (USE_LOCAL_STORAGE) {
      return userStore.getUserById(id);
    }

    try {
      const user = await userService.getById(id);
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user from API, falling back to localStorage', error);
      return userStore.getUserById(id);
    }
  }
};
