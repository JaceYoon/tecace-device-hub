import { Device, DeviceRequest, User, UserRole } from '@/types';
import { toast } from 'sonner';

// You can override this with an environment variable if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag - set to false to always use real backend API
let devMode = false;

// Log the API URL for debugging
console.log('Using API URL:', API_URL);
console.log('Development mode with mock data:', devMode ? 'enabled' : 'disabled');

// Track if user is logged out
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

// Import the store data directly instead of using require()
import { deviceStore, userStore, requestStore } from '../utils/data';

// Helper function for API calls with dev mode fallback
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Log the request for debugging
    console.log(`API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`);
    
    // Before making the API call, check if we're sending a JSON body and process it
    if (options.body && typeof options.body === 'string') {
      try {
        // Parse the body to process any 'null' strings
        const parsedBody = JSON.parse(options.body);
        
        // Convert any 'null' strings or empty strings in assignedToId to null
        if (parsedBody.assignedToId === 'null' || parsedBody.assignedToId === '') {
          parsedBody.assignedToId = null;
        }
        
        // Re-stringify the processed body
        options.body = JSON.stringify(parsedBody);
      } catch (parseError) {
        // If parsing fails, just use the original body
        console.log('Failed to parse request body:', parseError);
      }
    }
    
    // Make the API call with a timeout of 15000ms (15 seconds) - increased timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Make the API call
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies/session
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Check for auth-related endpoints
    const isAuthEndpoint = endpoint.startsWith('/auth');
    
    // Log status for debugging
    console.log(`API Response status: ${response.status} for ${endpoint}`);
    
    // Handle unauthorized responses differently for non-auth endpoints
    if (response.status === 401 && !isAuthEndpoint) {
      // If we get 401 after logout, don't show error
      if (userLoggedOut) {
        console.log('Got 401 after logout, as expected');
        throw new Error('Unauthorized');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
      console.error(`API error response: ${response.status}`, errorData);
      throw new Error(errorData.message || 'Unauthorized');
    }
    
    // Handle other non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error response: ${response.status}`, errorData);
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    
    // Check if it's a connection error (ECONNREFUSED, Failed to fetch, etc.)
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('AbortError') || 
         error.message.includes('NetworkError'))) {
      // Show a more informative toast
      toast.error('Unable to connect to the server. Please check that the server is running.');
    } else if (
      // Only show toast for non-auth related errors and non-network errors
      // and not for 401 errors after logout
      !(error instanceof Error && error.message.includes('Unauthorized')) ||
      !userLoggedOut
    ) {
      toast.error(`API error: ${(error as Error).message || 'Unknown error'}`);
    }
    
    throw error;
  }
}

// Auth services
const authService = {
  checkAuth: (): Promise<{ isAuthenticated: boolean; user: User | null }> =>
    apiCall<{ isAuthenticated: boolean; user: User | null }>('/auth/check'),

  login: (email: string, password: string): Promise<{ success: boolean; user: User; isAuthenticated: boolean }> => {
    // Reset logged out state on login attempt
    resetLoggedOutState();
    return apiCall<{ success: boolean; user: User; isAuthenticated: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  logout: (): Promise<{ success: boolean }> => {
    // Set user as logged out first
    setUserLoggedOut();
    return apiCall<{ success: boolean }>('/auth/logout');
  },

  register: (name: string, email: string, password: string): Promise<{ success: boolean; user: User; message?: string }> => {
    // Reset logged out state on registration
    resetLoggedOutState();
    return apiCall<{ success: boolean; user: User; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },
};

// Define deviceService
const deviceService = {
  getAll: (): Promise<Device[]> =>
    apiCall<Device[]>('/devices'),

  getById: (id: string): Promise<Device | null> =>
    apiCall<Device | null>(`/devices/${id}`),

  getDeviceHistory: (id: string): Promise<any[]> =>
    apiCall<any[]>(`/devices/${id}/history`),

  create: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> =>
    apiCall<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device)
    }),

  update: (id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<Device | null> =>
    apiCall<Device | null>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    apiCall<{ success: boolean }>(`/devices/${id}`, {
      method: 'DELETE'
    }),

  requestDevice: (deviceId: string, type: 'assign' | 'release'): Promise<DeviceRequest> =>
    apiCall<DeviceRequest>(`/devices/${deviceId}/request`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),

  processRequest: (requestId: string, status: 'approved' | 'rejected'): Promise<DeviceRequest | null> =>
    apiCall<DeviceRequest | null>(`/devices/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  cancelRequest: (requestId: string): Promise<DeviceRequest | null> =>
    apiCall<DeviceRequest | null>(`/devices/requests/${requestId}/cancel`, {
      method: 'PUT'
    }),

  getAllRequests: (): Promise<DeviceRequest[]> =>
    apiCall<DeviceRequest[]>('/devices/requests/all'),
};

// User services
const userService = {
  getAll: (): Promise<User[]> =>
    apiCall<User[]>('/users'),

  getCurrentUser: (): Promise<User | null> =>
    apiCall<User | null>('/users/me'),

  getById: (id: string): Promise<User | null> =>
    apiCall<User | null>(`/users/${id}`),

  updateRole: (id: string, role: 'user' | 'admin'): Promise<User | null> =>
    apiCall<User | null>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
};

// Create a global refresh callback mechanism
let refreshCallbacks: (() => void)[] = [];

// Create a unified dataService object that includes all the services
export const dataService = {
  // Add services
  auth: authService,
  devices: deviceService,
  users: userService,
  
  // Add direct methods to maintain compatibility with existing code
  getDeviceHistory: deviceService.getDeviceHistory,
  getDevices: deviceService.getAll,
  getUsers: userService.getAll,
  getRequests: deviceService.getAllRequests, // Add this method for backward compatibility
  updateDevice: async (id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<Device | null> => {
    try {
      // Important: Check if this is a device that's assigned and make sure we preserve assignment
      const currentDevice = await deviceService.getById(id);
      
      // Special handling for assigned devices
      if (currentDevice && currentDevice.status === 'assigned' && currentDevice.assignedToId) {
        // Explicitly preserve the assignment when updating unless explicitly changing it
        if (updates.status === undefined && updates.assignedToId === undefined) {
          console.log(`Preserving assignment for device ${id} to user ${currentDevice.assignedToId}`);
          updates.status = 'assigned';
          updates.assignedToId = currentDevice.assignedToId;
        }
      }
      
      // Process assignedToId to ensure it's handled correctly for the database
      if (updates.assignedToId === '' || updates.assignedToId === 'null') {
        updates.assignedToId = null;
      }
      
      // For device releases, we need special handling
      if (updates.status === 'available' && updates.assignedToId === undefined) {
        console.log(`Special handling for device release: ${id}`);
        
        // Try to update the device via API first
        try {
          const updatedDevice = await deviceService.update(id, {
            ...updates,
            assignedToId: null  // Explicitly set to null for available devices
          });
          console.log(`Device ${id} released via API`);
          
          // Trigger refresh after a short delay
          setTimeout(() => dataService.triggerRefresh(), 500);
          
          return updatedDevice;
        } catch (apiError) {
          // If the API fails due to ownership issues, try the fallback approach
          if (apiError instanceof Error && apiError.message.includes('not assigned to you')) {
            console.log('Using fallback for device release due to ownership issue');
            
            // Try immediate local update as fallback
            const localDevice = await deviceStore.updateDevice(id, {
              assignedTo: undefined,
              assignedToId: undefined,
              status: 'available',
            });
            
            // Trigger refresh
            setTimeout(() => dataService.triggerRefresh(), 300);
            
            return localDevice;
          }
          throw apiError;
        }
      }
      
      // Regular device update
      const updatedDevice = await deviceService.update(id, updates);
      
      // Trigger refresh after a short delay
      setTimeout(() => dataService.triggerRefresh(), 500);
      
      return updatedDevice;
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
      throw error;
    }
  },
  deleteDevice: deviceService.delete,
  processRequest: deviceService.processRequest,
  addDevice: deviceService.create,
  
  addRequest: async (request: Omit<DeviceRequest, 'id' | 'requestedAt'>): Promise<DeviceRequest> => {
    try {
      // If it's a release request, first update the device to prevent loops
      if (request.type === 'release') {
        try {
          // First update the device to release it
          await dataService.updateDevice(request.deviceId, {
            assignedTo: undefined,
            assignedToId: undefined,
            status: 'available',
          });
          
          console.log(`Device ${request.deviceId} released directly during request creation`);
          
          // Small delay to ensure device updates are processed first
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Then create the request (which might fail, but that's ok since device is already released)
          try {
            const newRequest = await deviceService.requestDevice(
              request.deviceId,
              request.type as 'assign' | 'release'
            );
            
            console.log('Release request added successfully:', newRequest);
            return newRequest;
          } catch (requestError) {
            // If API request fails, create a local request record instead
            console.log('API release request failed, creating local record instead');
            const localRequest = requestStore.addRequest({
              ...request,
              status: 'approved' // Auto-approve local release requests
            });
            
            // Trigger refresh
            setTimeout(() => dataService.triggerRefresh(), 300);
            
            return localRequest;
          }
        } catch (deviceUpdateError) {
          console.error('Error updating device during release:', deviceUpdateError);
          // If direct update fails, try the API request as fallback
          const newRequest = await deviceService.requestDevice(
            request.deviceId,
            request.type as 'assign' | 'release'
          );
          
          console.log('Release request added via API fallback:', newRequest);
          
          // Trigger refresh
          setTimeout(() => dataService.triggerRefresh(), 300);
          
          return newRequest;
        }
      } else {
        // For non-release requests (assign), use normal flow
        const newRequest = await deviceService.requestDevice(
          request.deviceId,
          request.type as 'assign' | 'release'
        );
        
        console.log('Request added successfully:', newRequest);
        
        // Trigger refresh callback with a delay to avoid immediate refresh loops
        setTimeout(() => {
          dataService.triggerRefresh();
        }, 300);
        
        return newRequest;
      }
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
  }),
};

// Export the dataService as default as well for flexibility
export default dataService;
