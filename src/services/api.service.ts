import { Device, DeviceRequest, User, UserRole } from '@/types';
import { toast } from 'sonner';

// You can override this with an environment variable if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag - set to false to use the actual API
let devMode = false; // Changed to false to use real MariaDB connection

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
  // If in dev mode, use mock data
  if (devMode) {
    return handleDevModeRequest<T>(endpoint, options);
  }

  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Log the request for debugging
    console.log(`API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`);
    
    // Make the API call with a timeout of 60000ms (60 seconds) - increased timeout for adding devices
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
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
    
    // In case of server connection errors, fall back to dev mode only if explicitly enabled
    if (devMode && error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('AbortError') || 
         error.message.includes('NetworkError'))) {
         
      console.log('Falling back to dev mode due to connection error');
      return handleDevModeRequest<T>(endpoint, options);
    }
    
    // Show a more informative toast for connection errors
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('AbortError') || 
         error.message.includes('NetworkError'))) {
      // More specific error message for connection issues
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

// Handle requests in dev mode with mock data
async function handleDevModeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  console.log(`DEV MODE: Handling ${options.method || 'GET'} ${endpoint}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (endpoint.startsWith('/auth')) {
    return handleAuthDevRequest<T>(endpoint, options);
  } else if (endpoint.startsWith('/devices')) {
    return handleDeviceDevRequest<T>(endpoint, options);
  } else if (endpoint.startsWith('/users')) {
    return handleUserDevRequest<T>(endpoint, options);
  }
  
  // Default fallback
  console.warn(`DEV MODE: No mock handler for ${endpoint}`);
  return {} as T;
}

// Handle auth requests in dev mode
async function handleAuthDevRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Simulate authentication
  if (endpoint === '/auth/check') {
    const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true';
    const userId = localStorage.getItem('dev-user-id') || '1';
    const user = isLoggedIn ? userStore.getUserById(userId) : null;
    
    return {
      isAuthenticated: isLoggedIn,
      user: user
    } as unknown as T;
  }
  
  // Other auth endpoints can be added as needed
  return {} as T;
}

// Handle device requests in dev mode
async function handleDeviceDevRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Get all devices
  if (endpoint === '/devices' && (!options.method || options.method === 'GET')) {
    return deviceStore.getDevices() as unknown as T;
  }
  
  // Get device by ID
  if (endpoint.match(/^\/devices\/\d+$/) && (!options.method || options.method === 'GET')) {
    const id = endpoint.split('/').pop();
    return deviceStore.getDeviceById(id!) as unknown as T;
  }
  
  // Get all requests
  if (endpoint === '/devices/requests/all' && (!options.method || options.method === 'GET')) {
    return requestStore.getRequests() as unknown as T;
  }
  
  // Handle other device endpoints as needed
  return {} as T;
}

// Handle user requests in dev mode
async function handleUserDevRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Get all users
  if (endpoint === '/users' && (!options.method || options.method === 'GET')) {
    return userStore.getUsers() as unknown as T;
  }
  
  // Get user by ID
  if (endpoint.match(/^\/users\/\d+$/) && (!options.method || options.method === 'GET')) {
    const id = endpoint.split('/').pop();
    return userStore.getUserById(id!) as unknown as T;
  }
  
  // Handle other user endpoints as needed
  return {} as T;
}

// Auth services
export const authService = {
  checkAuth: (): Promise<{ isAuthenticated: boolean; user: User | null }> =>
    apiCall<{ isAuthenticated: boolean; user: User | null }>('/auth/check'),

  login: (email: string, password: string): Promise<{ success: boolean; user: User; isAuthenticated: boolean }> => {
    // Reset logged out state on login attempt
    resetLoggedOutState();
    
    // Log auth attempt for debugging
    console.log(`Attempting to login with email: ${email}`);
    
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

  requestDevice: (deviceId: string, type: 'assign' | 'release' | 'report' | 'return', options?: { reportType?: 'missing' | 'stolen' | 'dead', reason?: string }): Promise<DeviceRequest> => {
    console.log(`Sending ${type} request for device ${deviceId} with options:`, options);
    
    // Pass the type directly without any conversion
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
export const userService = {
  getAll: (): Promise<User[]> =>
    apiCall<User[]>('/users'),

  getCurrentUser: (): Promise<User | null> =>
    apiCall<User | null>('/users/me'),

  getById: (id: string): Promise<User | null> =>
    apiCall<User | null>(`/users/${id}`),

  updateRole: (id: string, role: 'user' | 'admin' | 'TPM' | 'Software Engineer'): Promise<User | null> =>
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
