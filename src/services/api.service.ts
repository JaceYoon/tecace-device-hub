import { Device, DeviceRequest, User, UserRole } from '@/types';
import { toast } from 'sonner';

// You can override this with an environment variable if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag - set to true to always use localStorage data
let devMode = true;

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

// Helper function for API calls with dev mode fallback
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // If user is logged out, don't make API calls for protected endpoints
  if (userLoggedOut && !endpoint.startsWith('/auth')) {
    console.log(`User logged out, skipping API call to ${endpoint}`);
    return handleDevModeCall<T>(endpoint, options);
  }

  // Try actual API call if not in dev mode
  if (!devMode) {
    try {
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      console.log(`Making API call to: ${API_URL}${endpoint}`, { method: options.method || 'GET' });

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
      
      // Handle unauthorized responses differently for non-auth endpoints
      if (response.status === 401 && !isAuthEndpoint) {
        // If we get 401 after logout, don't show error
        if (userLoggedOut) {
          console.log('Got 401 after logout, as expected');
          return handleDevModeCall<T>(endpoint, options);
        }
        
        const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
        console.error(`API error response: ${response.status}`, errorData);
        
        // In case of 401, automatically switch to dev mode for this session
        console.log('Unauthorized API access, switching to dev mode for this session');
        devMode = true;
        return handleDevModeCall<T>(endpoint, options);
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
        // Show a more informative toast but only once
        toast.error('Unable to connect to the server. Using local data instead.');
        
        // Switch to dev mode for this session
        console.log('Connection error, switching to dev mode for this session');
        devMode = true;
        return handleDevModeCall<T>(endpoint, options);
      } else if (
        // Only show toast for non-auth related errors and non-network errors
        // and not for 401 errors after logout
        !(error instanceof Error && error.message.includes('Unauthorized')) ||
        !userLoggedOut
      ) {
        toast.error(`API error: ${(error as Error).message || 'Unknown error'}`);
      }
      
      // Switch to dev mode for this error
      devMode = true;
      return handleDevModeCall<T>(endpoint, options);
    }
  }

  // If already in dev mode
  return handleDevModeCall<T>(endpoint, options);
}

// Handle API calls in dev mode - modify this function to provide proper mock data
function handleDevModeCall<T>(endpoint: string, options: RequestInit = {}): T {
  console.log(`DEV MODE: Simulating API request to: ${endpoint}`);
  
  // Import the store data
  const { deviceStore, userStore, requestStore } = require('../utils/data');
  
  // Based on the endpoint, return appropriate data from stores
  if (endpoint === '/devices') {
    return deviceStore.getDevices() as unknown as T;
  }
  
  if (endpoint.startsWith('/devices/') && options.method === 'GET') {
    const id = endpoint.split('/').pop();
    return deviceStore.getDeviceById(id) as unknown as T;
  }
  
  if (endpoint === '/users') {
    return userStore.getUsers() as unknown as T;
  }
  
  if (endpoint.startsWith('/users/') && options.method === 'GET') {
    const id = endpoint.split('/').pop();
    return userStore.getUserById(id) as unknown as T;
  }
  
  if (endpoint === '/devices/requests/all') {
    return requestStore.getRequests() as unknown as T;
  }
  
  // Default fallback for unknown endpoints in dev mode
  console.error(`Dev mode does not support endpoint: ${endpoint}`);
  return {} as T;
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
