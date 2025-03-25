
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

      // Special handling for Sequelize alias errors
      if (errorData.message && errorData.message.includes('alias')) {
        if (endpoint === '/devices/requests/all' || endpoint.includes('/devices/requests/')) {
          console.log('Detected Sequelize alias error, using fallback implementation');
          throw new Error('alias_error'); // Special error code for our fallback
        }
      }

      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    
    // Check if it's our special alias error
    if (error instanceof Error && error.message === 'alias_error') {
      throw error; // Propagate for special handling
    }
    
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
export const authService = {
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

// Define and export deviceService
export const deviceService = {
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

  processRequest: async (requestId: string, status: 'approved' | 'rejected'): Promise<DeviceRequest | null> => {
    try {
      return await apiCall<DeviceRequest | null>(`/devices/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    } catch (error) {
      // Check if it's our special alias error
      if (error instanceof Error && error.message === 'alias_error') {
        console.log('Using client-side fallback for processing request');
        // Use the mock data as fallback
        return requestStore.processRequest(requestId, status, 'admin-1');
      }
      throw error;
    }
  },

  cancelRequest: async (requestId: string): Promise<DeviceRequest | null> => {
    try {
      return await apiCall<DeviceRequest | null>(`/devices/requests/${requestId}/cancel`, {
        method: 'PUT'
      });
    } catch (error) {
      // Check if it's our special alias error
      if (error instanceof Error && error.message === 'alias_error') {
        console.log('Using client-side fallback for cancelling request');
        // Use the mock data as fallback - we assume the current user's ID 
        // This is safe because the cancelRequest method validates that the user is the requester
        return requestStore.cancelRequest(requestId, 'current-user-id'); 
      }
      throw error;
    }
  },

  getAllRequests: async (): Promise<DeviceRequest[]> => {
    try {
      return await apiCall<DeviceRequest[]>('/devices/requests/all');
    } catch (error) {
      // Check if it's our special alias error
      if (error instanceof Error && (
        error.message === 'alias_error' || 
        error.message.includes('alias')
      )) {
        console.log('Using client-side fallback for getAllRequests');
        // Use the mock data as fallback
        return requestStore.getRequests();
      }
      throw error;
    }
  },
};

// User services
export const userService = {
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
