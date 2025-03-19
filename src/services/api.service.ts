
import { Device, DeviceRequest, User } from '@/types';
import { toast } from 'sonner';

// You can override this with an environment variable if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Development mode flag - setting to true by default to bypass server connection issues
let devMode = true;

// Log the API URL for debugging
console.log('Using API URL:', API_URL);
console.log('Running in development mode with mock data');

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

// Mock device data
const mockDevices = [
  {
    id: '1',
    name: 'iPhone 13 Pro',
    type: 'Mobile Phone',
    serialNumber: 'IPHONE13PRO-001',
    imei: '123456789012345',
    status: 'available',
    notes: 'New device',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'MacBook Pro M1',
    type: 'Laptop',
    serialNumber: 'MACBOOKM1-001',
    imei: '',
    status: 'assigned',
    assignedToId: '1',
    notes: 'Assigned to admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock request data
const mockRequests = [
  {
    id: '1',
    type: 'assign',
    status: 'pending',
    deviceId: '1',
    userId: '2',
    requestedAt: new Date().toISOString()
  }
];

// Helper function for API calls with dev mode fallback
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  // We're always in dev mode
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
  }
  
  // Device endpoints
  if (endpoint.startsWith('/devices')) {
    if (endpoint === '/devices') {
      return mockDevices;
    }
    
    if (endpoint.startsWith('/devices/') && !endpoint.includes('/request')) {
      const id = endpoint.split('/')[2];
      const device = mockDevices.find(d => d.id === id);
      return device || null;
    }
    
    if (endpoint === '/devices/requests') {
      return mockRequests;
    }
    
    if (endpoint.includes('/request')) {
      const deviceId = endpoint.split('/')[2];
      const body = JSON.parse((options.body as string) || '{}');
      const userId = localStorage.getItem('dev-user-id') || '1';
      
      const newRequest = {
        id: (mockRequests.length + 1).toString(),
        type: body.type,
        status: 'pending',
        deviceId,
        userId,
        requestedAt: new Date().toISOString()
      };
      
      mockRequests.push(newRequest);
      return newRequest;
    }
    
    if (endpoint.startsWith('/devices/requests/')) {
      const id = endpoint.split('/')[3];
      const body = JSON.parse((options.body as string) || '{}');
      const request = mockRequests.find(r => r.id === id);
      
      if (request) {
        request.status = body.status;
        request.processedAt = new Date().toISOString();
        request.processedById = localStorage.getItem('dev-user-id') || '1';
        
        if (body.status === 'approved' && request.type === 'assign') {
          const device = mockDevices.find(d => d.id === request.deviceId);
          if (device) {
            device.status = 'assigned';
            device.assignedToId = request.userId;
          }
        } else if (body.status === 'approved' && request.type === 'release') {
          const device = mockDevices.find(d => d.id === request.deviceId);
          if (device) {
            device.status = 'available';
            device.assignedToId = undefined;
          }
        }
        
        return request;
      }
      
      return null;
    }
  }
  
  // User endpoints
  if (endpoint.startsWith('/users')) {
    if (endpoint === '/users') {
      return mockUsers;
    }
    
    if (endpoint === '/users/me') {
      const isLoggedIn = localStorage.getItem('dev-user-logged-in') === 'true';
      const userId = localStorage.getItem('dev-user-id') || '1';
      return isLoggedIn ? mockUsers.find(u => u.id === userId) || mockUsers[0] : null;
    }
    
    if (endpoint.startsWith('/users/')) {
      const id = endpoint.split('/')[2];
      const user = mockUsers.find(u => u.id === id);
      return user || null;
    }
  }
  
  // Default success response
  return { success: true };
};

// Auth services
export const authService = {
  checkAuth: () => apiCall('/auth/check'),
  login: (email: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
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
