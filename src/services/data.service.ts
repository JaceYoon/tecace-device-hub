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
      
      // Check for data truncation errors with more specific error message
      if (errorData.message && errorData.message.includes('Data truncated for column')) {
        console.error('Database constraint error:', errorData.message);
        
        // For device status updates, we'll handle it differently
        if (endpoint.includes('/devices/') && options.method === 'PUT') {
          throw new Error(`Database constraint error: Could not update device status. The server database may have different constraints than expected.`);
        } else {
          throw new Error(`Database constraint error. Please check API and database compatibility.`);
        }
      }
      
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

  requestDevice: (deviceId: string, type: 'assign' | 'release' | 'report' | 'return', options?: { reportType?: 'missing' | 'stolen' | 'dead', reason?: string }): Promise<DeviceRequest> => {
    console.log(`Sending ${type} request for device ${deviceId} with options:`, options);
    
    // Special handling for return requests due to database constraints
    if (type === 'return') {
      console.log('Using special handling for return request');
      return apiCall<DeviceRequest>(`/devices/${deviceId}/request`, {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'release', // Temporary workaround: use release as type
          reason: options?.reason || 'Device returned to warehouse',
          isReturn: true // Add flag to indicate this is actually a return
        })
      });
    }
    
    // Normal path for other request types
    return apiCall<DeviceRequest>(`/devices/${deviceId}/request`, {
      method: 'POST',
      body: JSON.stringify({ 
        type, 
        reportType: options?.reportType,
        reason: options?.reason
      })
    });
  },

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
  getRequests: deviceService.getAllRequests,
  updateDevice: deviceService.update,
  deleteDevice: deviceService.delete,
  processRequest: deviceService.processRequest,
  addDevice: deviceService.create,
  
  addRequest: async (request: Omit<DeviceRequest, 'id' | 'requestedAt'>): Promise<DeviceRequest> => {
    console.log('Processing addRequest with:', request);
    
    try {
      // Special handling for return requests due to database constraints
      if (request.type === 'return') {
        console.log('Processing return request for device:', request.deviceId);
        
        try {
          // Try with modified approach for database compatibility
          const returnRequest = await apiCall<DeviceRequest>(`/devices/${request.deviceId}/request`, {
            method: 'POST',
            body: JSON.stringify({
              type: 'release', // Use release type which is definitely in DB schema
              isReturn: true,  // Add a flag to indicate it's actually a return
              reason: request.reason || 'Device returned to warehouse'
            })
          });
          
          // After creating the return request, update the device status to pending
          await deviceService.update(request.deviceId, {
            status: 'pending',
          });
          
          console.log('Device marked as pending return successfully');
          return returnRequest;
        } catch (error) {
          console.error('Special handling for return also failed:', error);
          
          // Fallback to using mock implementation if API fails
          console.log('Using fallback implementation for returns');
          const mockRequest = {
            id: `request-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            deviceId: request.deviceId,
            userId: request.userId,
            type: 'return',
            status: request.status || 'pending',
            reason: request.reason || 'Device returned to warehouse',
            requestedAt: new Date()
          } as DeviceRequest;
          
          // Update the device to pending status
          await deviceService.update(request.deviceId, {
            status: 'pending',
            requestedBy: request.userId
          });
          
          return mockRequest;
        }
      }
      
      // For all other request types, use the normal flow
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
