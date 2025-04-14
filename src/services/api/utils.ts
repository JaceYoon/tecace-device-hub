
import { toast } from 'sonner';
import { API_URL, devMode } from './constants';
import { handleDevModeRequest } from './devMode';

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (devMode) {
    return handleDevModeRequest<T>(endpoint, options);
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log(`API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const isAuthEndpoint = endpoint.startsWith('/auth');
    
    if (response.status === 401 && !isAuthEndpoint) {
      const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
      throw new Error(errorData.message || 'Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.message?.includes('Data truncated for column')) {
        throw new Error('Database constraint error. Please check your input.');
      }
      
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('AbortError'))) {
      toast.error('Unable to connect to the server. Please check your connection.');
    } else {
      toast.error(`API error: ${(error as Error).message || 'Unknown error'}`);
    }
    
    throw error;
  }
}
