
import { API_URL, devMode, getUserLoggedOut } from './constants';
import { handleDevModeRequest } from './devMode';
import { toast } from 'sonner';

// Helper function for API calls with dev mode fallback
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      if (getUserLoggedOut()) {
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
      !getUserLoggedOut()
    ) {
      toast.error(`API error: ${(error as Error).message || 'Unknown error'}`);
    }
    
    throw error;
  }
}

export default apiCall;
