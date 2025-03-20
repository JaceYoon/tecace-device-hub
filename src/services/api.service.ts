
import { Device, DeviceRequest, User, UserRole } from '@/types';
import { toast } from 'sonner';

// You can override this with an environment variable if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag - set to true if you want to use mock data instead of real API
let devMode = true;

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

// Helper function for API calls with dev mode fallback
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // In production mode, make actual API calls
  if (!devMode) {
    try {
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      console.log(`Making API call to: ${API_URL}${endpoint}`, { method: options.method || 'GET' });

      // Make the API call
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Important for cookies/session
      });

      // Check for auth-related endpoints
      const isAuthEndpoint = endpoint.startsWith('/auth');
      
      // Handle unauthorized responses differently for non-auth endpoints
      if (response.status === 401 && !isAuthEndpoint) {
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
      
      // Only show toast for non-auth related errors and non-auth endpoints
      if (!(error instanceof Error && 
          (error.message.includes('Unauthorized') || 
           error.message.includes('Failed to fetch')))) {
        toast.error(`API error: ${(error as Error).message || 'Unknown error'}`);
      }
      
      throw error;
    }
  }

  // Below is the dev mode implementation with mock data
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
        return { success: true, user, isAuthenticated: true } as unknown as T;
      } else {
        throw new Error('Invalid email or password');
      }
    }

    // Simulate auth check
    if (endpoint === '/auth/check') {
      const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true';
      const userId = localStorage.getItem('dev-user-id') || '1';
      const user = isLoggedIn ? mockUsers.find(u => u.id === userId) || mockUsers[0] : null;

      return { isAuthenticated: isLoggedIn, user } as unknown as T;
    }

    // Simulate logout
    if (endpoint === '/auth/logout') {
      localStorage.removeItem('dev-user-logged-in');
      localStorage.removeItem('dev-user-id');
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

      return { success: true, user: newUser } as unknown as T;
    }
  }

  // Check if user is logged in for non-auth endpoints in dev mode
  const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true';
  if (!isLoggedIn && !endpoint.startsWith('/auth')) {
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

  // Default success response
  return { success: true } as unknown as T;
}

// Auth services
export const authService = {
  checkAuth: (): Promise<AuthCheckResponse> =>
    apiCall<AuthCheckResponse>('/auth/check'),

  login: (email: string, password: string): Promise<LoginResponse> =>
    apiCall<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  logout: (): Promise<LogoutResponse> =>
    apiCall<LogoutResponse>('/auth/logout'),

  register: (name: string, email: string): Promise<RegisterResponse> =>
    apiCall<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email })
    }),
};

// Device services
export const deviceService = {
  getAll: (): Promise<Device[]> =>
    apiCall<Device[]>('/devices'),

  getById: (id: string): Promise<Device | null> =>
    apiCall<Device | null>(`/devices/${id}`),

  create: (device: Partial<Device>): Promise<Device> =>
    apiCall<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device)
    }),

  update: (id: string, device: Partial<Device>): Promise<Device | null> =>
    apiCall<Device | null>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device)
    }),

  delete: (id: string): Promise<boolean> => {
    console.log('Calling delete API for device ID:', id);
    return apiCall<SuccessResponse>(`/devices/${id}`, { method: 'DELETE' })
      .then(resp => {
        console.log('Delete API response:', resp);
        return !!resp.success;
      });
  },

  requestDevice: (id: string, type: 'assign' | 'release'): Promise<DeviceRequest> =>
    apiCall<DeviceRequest>(`/devices/${id}/request`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),

  processRequest: (id: string, status: 'approved' | 'rejected'): Promise<DeviceRequest | null> =>
    apiCall<DeviceRequest | null>(`/devices/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  getAllRequests: (): Promise<DeviceRequest[]> => {
    console.log('Fetching all device requests');
    return apiCall<DeviceRequest[]>('/devices/requests/all');
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
