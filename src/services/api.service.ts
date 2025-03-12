
import { Device, DeviceRequest, User } from '@/types';

const API_URL = 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

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
};

// Auth services
export const authService = {
  checkAuth: () => apiCall('/auth/check'),
  login: () => window.location.href = `${API_URL}/auth/login`,
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
  updateRole: (id: string, role: 'user' | 'manager') => apiCall(`/users/${id}/role`, { 
    method: 'PUT', 
    body: JSON.stringify({ role }) 
  }),
};
