
import { Device, DeviceRequest, User } from '@/types';
import { toast } from 'sonner';

// You can override this with an environment variable if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag - will be set to true if we can't connect to the backend
let devMode = false;

// Log the API URL for debugging
console.log('Using API URL:', API_URL);

// Helper function to check if the backend is available
const checkBackendAvailability = async () => {
  try {
    const response = await fetch(`${API_URL}/`, { 
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return true;
  } catch (error) {
    console.warn('Backend not available, switching to development mode');
    devMode = true;
    return false;
  }
};

// Check backend availability when the app starts
checkBackendAvailability();

// Mock data for development mode
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@tecace.com',
    role: 'admin',
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=admin',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Regular User',
    email: 'user@tecace.com',
    role: 'user',
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=user',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function for API calls with dev mode fallback
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    // If we're in dev mode and it's an auth request, simulate auth
    if (devMode && endpoint.startsWith('/auth')) {
      console.log(`DEV MODE: Simulating API request to: ${endpoint}`);
      
      // Simulate login
      if (endpoint === '/auth/login' && options.method === 'POST') {
        const body = JSON.parse((options.body as string) || '{}');
        const user = mockUsers.find(u => u.email === body.email);
        
        if (user && (body.password === 'admin123' || body.password === 'password')) {
          return { success: true, user, isAuthenticated: true };
        } else {
          throw new Error('Invalid email or password');
        }
      }
      
      // Simulate auth check
      if (endpoint === '/auth/check') {
        const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true';
        const userId = localStorage.getItem('dev-user-id') || '1';
        const user = isLoggedIn ? mockUsers.find(u => u.id === userId) || mockUsers[0] : null;
        
        return { isAuthenticated: isLoggedIn, user };
      }
      
      // Simulate logout
      if (endpoint === '/auth/logout') {
        localStorage.removeItem('dev-user-logged-in');
        localStorage.removeItem('dev-user-id');
        return { success: true };
      }
      
      return { success: true };
    }
    
    // If we're in dev mode and it's a device request, return mock data
    if (devMode && endpoint.startsWith('/devices')) {
      console.log(`DEV MODE: Simulating API request to: ${endpoint}`);
      return { success: true, devices: [] };
    }
    
    // If we're in dev mode and it's a user request, return mock users
    if (devMode && endpoint.startsWith('/users')) {
      console.log(`DEV MODE: Simulating API request to: ${endpoint}`);
      
      if (endpoint === '/users/me') {
        const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true';
        const userId = localStorage.getItem('dev-user-id') || '1';
        return isLoggedIn ? mockUsers.find(u => u.id === userId) || mockUsers[0] : null;
      }
      
      if (endpoint === '/users') {
        return mockUsers;
      }
      
      return { success: true };
    }
    
    // Real API call if we're not in dev mode
    console.log(`Making API request to: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, defaultOptions);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(error.message || 'Request failed');
    }
    
    // Parse JSON if the response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response;
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    
    // If we get a connection error and we're not in dev mode yet,
    // enable dev mode and retry the request
    if (!devMode && error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('Network Error'))) {
      console.warn('Connection error, switching to development mode');
      devMode = true;
      toast.warning('Backend server not detected. Running in offline mode.');
      
      // Retry the call now that we're in dev mode
      return apiCall(endpoint, options);
    }
    
    throw error;
  }
};

// Auth services
export const authService = {
  checkAuth: () => apiCall('/auth/check'),
  login: (email: string, password: string) => {
    const result = apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // For dev mode, save login state
    result.then(data => {
      if (data.success && devMode) {
        localStorage.setItem('dev-user-logged-in', 'true');
        localStorage.setItem('dev-user-id', data.user.id);
      }
    }).catch(() => {});
    
    return result;
  },
  logout: () => apiCall('/auth/logout'),
};

// Device services
export const deviceService = {
  getAll: () => apiCall('/devices'),
  getById: (id: string) => apiCall(`/devices/${id}`),
  create: (device: Partial<Device>) => apiCall('/devices', { 
    method: 'POST', 
    body: JSON.stringify(device) 
  }),
  update: (id: string, device: Partial<Device>) => apiCall(`/devices/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(device) 
  }),
  delete: (id: string) => apiCall(`/devices/${id}`, { method: 'DELETE' }),
  requestDevice: (id: string, type: 'assign' | 'release') => apiCall(`/devices/${id}/request`, { 
    method: 'POST', 
    body: JSON.stringify({ type }) 
  }),
  processRequest: (id: string, status: 'approved' | 'rejected') => apiCall(`/devices/requests/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify({ status }) 
  }),
  getAllRequests: () => apiCall('/devices/requests'),
};

// User services
export const userService = {
  getAll: () => apiCall('/users'),
  getCurrentUser: () => apiCall('/users/me'),
  getById: (id: string) => apiCall(`/users/${id}`),
  updateRole: (id: string, role: 'user' | 'admin') => apiCall(`/users/${id}/role`, { 
    method: 'PUT', 
    body: JSON.stringify({ role }) 
  }),
};

// Export the api object that contains all methods
export const api = {
  auth: authService,
  devices: deviceService,
  users: userService,
  get: (endpoint: string) => apiCall(endpoint),
  post: (endpoint: string, data: any) => apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (endpoint: string, data: any) => apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (endpoint: string) => apiCall(endpoint, {
    method: 'DELETE'
  })
};

export default api;
