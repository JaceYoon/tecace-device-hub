
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
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    // Add retry logic for connection reset and database lock errors
    let retries = 3;
    let lastError;
    let backoffTime = 1000; // Start with 1 second delay
    
    while (retries > 0) {
      try {
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
          
          // Check for lock timeout errors
          if (errorData.message?.includes('Lock wait timeout') || 
              errorData.message?.includes('Deadlock') ||
              errorData.message?.includes('try restarting transaction')) {
            throw new Error(errorData.message || `Database lock error: ${response.status}`);
          }
          
          if (errorData.message?.includes('Data truncated for column')) {
            throw new Error('Database constraint error. Please check your input.');
          }
          
          throw new Error(errorData.message || `API error: ${response.status}`);
        }
    
        return await response.json();
      } catch (error) {
        lastError = error;
        
        // Determine if we should retry
        const isLockError = error instanceof Error && (
          error.message.includes('Lock wait timeout') ||
          error.message.includes('Deadlock') ||
          error.message.includes('try restarting transaction')
        );
        
        const isConnectionError = error instanceof Error && (
          error.message.includes('ECONNRESET') || 
          error.message.includes('AbortError') ||
          error.message.includes('Failed to fetch')
        );
        
        if ((isLockError || isConnectionError) && retries > 0) {
          console.log(`${isLockError ? 'Database lock' : 'Connection'} error, retrying (${retries} attempts left)...`);
          retries--;
          // Apply exponential backoff
          await new Promise(resolve => setTimeout(resolve, backoffTime)); 
          backoffTime *= 2; // Double the wait time for next retry
          continue;
        } else {
          throw error; // For other errors, don't retry
        }
      }
    }
    
    // If we've exhausted retries, throw the last error
    throw lastError;
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('AbortError'))) {
      toast.error('Unable to connect to the server. Please check your connection.');
    } else if (error instanceof Error && error.message.includes('ECONNRESET')) {
      toast.error('Connection was reset. Please try again.');
    } else if (error instanceof Error && 
              (error.message.includes('Lock wait timeout') || 
               error.message.includes('Deadlock') ||
               error.message.includes('try restarting transaction'))) {
      toast.error('Database is busy. Please try again in a moment.');
    } else {
      toast.error(`API error: ${(error as Error).message || 'Unknown error'}`);
    }
    
    throw error;
  }
}
