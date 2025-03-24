import { Device, DeviceRequest, User, UserRole } from '@/types';
import { toast } from 'sonner';

// You can override this with an environment variable if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag - set to false by default to always try API first
let devMode = false;

// Log the API URL for debugging
console.log('Using API URL:', API_URL);
console.log('Development mode with mock data:', devMode ? 'enabled' : 'disabled');

// Mock data for development mode
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@tecace.com',
    role: 'admin' as UserRole,
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=admin',
  },
  {
    id: '2',
    name: 'Regular User',
    email: 'user@tecace.com',
    role: 'user' as UserRole,
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=user',
  }
];

// Empty mock device data
const mockDevices: Device[] = [];

// Empty mock request data
const mockRequests: DeviceRequest[] = [];

// Define return types for different API endpoints
type AuthCheckResponse = { isAuthenticated: boolean; user: User | null };
type LoginResponse = { success: boolean; user: User; isAuthenticated: boolean };
type LogoutResponse = { success: boolean };
type SuccessResponse = { success: boolean };
type RegisterResponse = { success: boolean; user: User; message?: string };

// Enable dev mode when API is unavailable
const enableDevModeIfNeeded = () => {
  // Only enable if it wasn't already enabled
  if (!devMode) {
    console.log('Backend server appears to be unavailable, enabling development mode with mock data');
    devMode = true;
    toast.info('Backend server unavailable. Using mock data instead. Please ensure your database server is running.');
  }
};

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

      // Make the API call with a timeout of 8000ms (8 seconds) - increased timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
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
        
        // Just throw the error, but with a specific message that we can check for
        throw new Error(errorData.message || 'Unauthorized - Please log in');
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
        // Enable dev mode for future calls
        enableDevModeIfNeeded();
        
        // Show a more informative toast
        toast.error('Unable to connect to the server. Please ensure your database and backend server are running.');
      } else if (
        // Only show toast for non-auth related errors and non-network errors
        // and not for 401 errors after logout
        !(error instanceof Error && error.message.includes('Unauthorized')) ||
        !userLoggedOut
      ) {
        toast.error(`API error: ${(error as Error).message || 'Unknown error'}`);
      }
      
      // For connection errors or after logout, try the dev mode path
      if (devMode || userLoggedOut) {
        return handleDevModeCall<T>(endpoint, options);
      }
      
      throw error;
    }
  }

  // If already in dev mode
  return handleDevModeCall<T>(endpoint, options);
}

// Handle API calls in dev mode
function handleDevModeCall<T>(endpoint: string, options: RequestInit = {}): T {
  console.log(`DEV MODE: Simulating API request to: ${endpoint}`);

  // Auth endpoints
  if (endpoint.startsWith('/auth')) {
    // Simulate login
    if (endpoint === '/auth/login' && options.method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const user = mockUsers.find(u => u.email === body.email);

      // In dev mode, accept any password for existing users
      if (user) {
        localStorage.setItem('dev-user-logged-in', 'true');
        localStorage.setItem('dev-user-id', user.id);
        userLoggedOut = false; // Reset logged out state on login
        return { success: true, user, isAuthenticated: true } as unknown as T;
      } else {
        throw new Error('Invalid email or password');
      }
    }

    // Simulate auth check
    if (endpoint === '/auth/check') {
      const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true' && !userLoggedOut;
      const userId = localStorage.getItem('dev-user-id') || '1';
      const user = isLoggedIn ? mockUsers.find(u => u.id === userId) || mockUsers[0] : null;

      return { isAuthenticated: isLoggedIn, user } as unknown as T;
    }

    // Simulate logout
    if (endpoint === '/auth/logout') {
      localStorage.removeItem('dev-user-logged-in');
      localStorage.removeItem('dev-user-id');
      userLoggedOut = true;
      return { success: true } as unknown as T;
    }

    // Simulate registration
    if (endpoint === '/auth/register' && options.method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      // Create a new user with the given details
      const newUser: User = {
        id: (mockUsers.length + 1).toString(),
        name: body.name,
        email: body.email,
        role: 'user' as UserRole,
        avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${body.email}`,
      };

      mockUsers.push(newUser);

      // Set as logged in
      localStorage.setItem('dev-user-logged-in', 'true');
      localStorage.setItem('dev-user-id', newUser.id);
      userLoggedOut = false;

      return { success: true, user: newUser } as unknown as T;
    }
  }

  // Skip API calls for protected routes if user is logged out
  if (userLoggedOut && !endpoint.startsWith('/auth')) {
    console.log(`User is logged out, skipping API call to ${endpoint}`);
    if (endpoint.startsWith('/devices') || endpoint.startsWith('/users')) {
      return [] as unknown as T; // Return empty array for collection endpoints
    }
    return { success: false } as unknown as T;
  }

  // Check if user is logged in for non-auth endpoints in dev mode
  const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true' && !userLoggedOut;
  if (!isLoggedIn && !endpoint.startsWith('/auth')) {
    console.log(`User not logged in for ${endpoint}`);
    throw new Error('Unauthorized - Please log in');
  }

  // Device endpoints
  if (endpoint.startsWith('/devices')) {
    if (endpoint === '/devices') {
      return mockDevices as unknown as T;
    }

    if (endpoint.startsWith('/devices/') && !endpoint.includes('/request')) {
      const id = endpoint.split('/')[2];
      const device = mockDevices.find(d => d.id === id);
      return (device || null) as unknown as T;
    }

    if (endpoint === '/devices/requests/all') {
      return mockRequests as unknown as T;
    }

    if (endpoint.includes('/request')) {
      const deviceId = endpoint.split('/')[2];
      const body = JSON.parse((options.body as string) || '{}');
      const userId = localStorage.getItem('dev-user-id') || '1';

      const newRequest: DeviceRequest = {
        id: (mockRequests.length + 1).toString(),
        type: body.type,
        status: 'pending',
        deviceId,
        userId,
        requestedAt: new Date(),
      };

      mockRequests.push(newRequest);
      return newRequest as unknown as T;
    }

    if (endpoint.startsWith('/devices/requests/')) {
      const id = endpoint.split('/')[3];
      const body = JSON.parse((options.body as string) || '{}');
      const request = mockRequests.find(r => r.id === id);

      if (request) {
        request.status = body.status;
        // Add required properties for processed requests
        const processedAt = new Date();
        const processedById = localStorage.getItem('dev-user-id') || '1';

        // Add these to our request object with proper type handling
        const updatedRequest: DeviceRequest = {
          ...request,
          processedAt,
          processedBy: processedById
        };

        // Update the original request in the array
        Object.assign(request, updatedRequest);

        if (body.status === 'approved' && request.type === 'assign') {
          const device = mockDevices.find(d => d.id === request.deviceId);
          if (device) {
            device.status = 'assigned';
            device.assignedTo = request.userId;
          }
        } else if (body.status === 'approved' && request.type === 'release') {
          const device = mockDevices.find(d => d.id === request.deviceId);
          if (device) {
            device.status = 'available';
            device.assignedTo = undefined;
          }
        }

        return updatedRequest as unknown as T;
      }

      return null as unknown as T;
    }

    // Handle device creation in dev mode
    if (endpoint === '/devices' && options.method === 'POST') {
      const deviceData = JSON.parse((options.body as string) || '{}');
      const newDevice: Device = {
        ...deviceData,
        id: (mockDevices.length + 1).toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDevices.push(newDevice);
      return newDevice as unknown as T;
    }

    // Handle device deletion in dev mode
    if (endpoint.startsWith('/devices/') && options.method === 'DELETE') {
      const id = endpoint.split('/')[2];
      const index = mockDevices.findIndex(d => d.id === id);

      if (index !== -1) {
        mockDevices.splice(index, 1);
        return { success: true } as unknown as T;
      }

      return { success: false } as unknown as T;
    }
  }

  // User endpoints
  if (endpoint.startsWith('/users')) {
    if (endpoint === '/users') {
      return mockUsers as unknown as T;
    }

    if (endpoint === '/users/me') {
      const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true';
      const userId = localStorage.getItem('dev-user-id') || '1';
      return (isLoggedIn ? mockUsers.find(u => u.id === userId) || mockUsers[0] : null) as unknown as T;
    }

    if (endpoint.startsWith('/users/')) {
      const id = endpoint.split('/')[2];
      const user = mockUsers.find(u => u.id === id);
      return (user || null) as unknown as T;
    }
  }

  // New method for cancelling a request by the requester
  if (endpoint.includes('/requests/') && endpoint.includes('/cancel')) {
    const requestId = endpoint.split('/')[3];
    const body = JSON.parse((options.body as string) || '{}');
    const userId = body.userId;
    
    // Find the request
    const request = mockRequests.find(r => r.id === requestId);
    
    // Check if the user making the request is the same user who created it
    if (request && request.userId === userId) {
      // Update the request
      request.status = 'cancelled';
      request.processedAt = new Date();
      request.processedBy = userId;
      
      // If there's a device with requestedBy field matching this user, clear it
      const device = mockDevices.find(d => d.id === request.deviceId);
      if (device && device.requestedBy === userId) {
        device.requestedBy = undefined;
      }
      
      return request as unknown as T;
    }
    
    return null as unknown as T;
  }

  // Default success response
  return { success: true } as unknown as T;
}

// Auth services
export const authService = {
  checkAuth: (): Promise<AuthCheckResponse> =>
    apiCall<AuthCheckResponse>('/auth/check'),

  login: (email: string, password: string): Promise<LoginResponse> => {
    // Reset logged out state on login attempt
    resetLoggedOutState();
    return apiCall<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  logout: (): Promise<LogoutResponse> => {
    // Set user as logged out first
    setUserLoggedOut();
    return apiCall<LogoutResponse>('/auth/logout');
  },

  register: (name: string, email: string): Promise<RegisterResponse> => {
    // Reset logged out state on registration
    resetLoggedOutState();
    return apiCall<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email })
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

  delete: (id: string): Promise<SuccessResponse> =>
    apiCall<SuccessResponse>(`/devices/${id}`, {
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

  cancelRequest: (requestId: string, userId: string): Promise<DeviceRequest | null> => {
    return apiCall<DeviceRequest | null>(`/devices/requests/${requestId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ userId })
    });
  },

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
