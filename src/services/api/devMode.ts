import { deviceStore, userStore, requestStore } from '../../utils/data';

// Handle requests in dev mode with mock data
export async function handleDevModeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
export async function handleAuthDevRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
export async function handleDeviceDevRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
export async function handleUserDevRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
