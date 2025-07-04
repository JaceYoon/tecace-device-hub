
import { User } from '@/types';
import { apiCall } from './utils';

export const authService = {
  checkAuth: async (): Promise<{ isAuthenticated: boolean; user: User | null }> => {
    try {
      const result = await apiCall<{ isAuthenticated: boolean; user: User | null }>('/auth/check');
      
      // In production mode, ensure a more consistent auth state based on the response
      if (process.env.NODE_ENV === 'production') {
        if (result.isAuthenticated && result.user) {
          // Save successful auth to localStorage to help detect auth state changes
          localStorage.setItem('auth-check-time', Date.now().toString());
          localStorage.setItem('auth-state', 'authenticated');
        } else {
          // Clear any stored login indications
          localStorage.removeItem('auth-check-time');
          localStorage.removeItem('auth-state');
          resetLoggedOutState();
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error checking auth:', error);
      // Return not authenticated on error
      return { isAuthenticated: false, user: null };
    }
  },

  login: (email: string, password: string): Promise<{ success: boolean; user: User; isAuthenticated: boolean }> => {
    // Reset logged out state on login attempt
    resetLoggedOutState();
    
    console.log(`Attempting to login with email: ${email}`);
    
    return apiCall<{ success: boolean; user: User; isAuthenticated: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Ensure cookies are sent with the request
    });
  },

  logout: (): Promise<{ success: boolean }> => {
    setUserLoggedOut();
    return apiCall<{ success: boolean }>('/auth/logout', {
      credentials: 'include' // Ensure cookies are sent with the request
    });
  },

  register: (name: string, email: string, password: string): Promise<{ success: boolean; user: User; message?: string }> => {
    resetLoggedOutState();
    return apiCall<{ success: boolean; user: User; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      credentials: 'include' // Ensure cookies are sent with the request
    });
  },
};

// Auth state management
let userLoggedOut = false;

export const resetLoggedOutState = () => {
  userLoggedOut = false;
  localStorage.removeItem('auth-logout-time');
  
  // For production, track login attempts
  if (process.env.NODE_ENV === 'production') {
    localStorage.setItem('auth-login-attempt', Date.now().toString());
  }
};

export const setUserLoggedOut = () => {
  userLoggedOut = true;
  localStorage.removeItem('dev-user-logged-in');
  localStorage.removeItem('dev-user-id');
  localStorage.removeItem('auth-check-time');
  localStorage.removeItem('auth-state');
  
  // For production, track logout time
  if (process.env.NODE_ENV === 'production') {
    localStorage.setItem('auth-logout-time', Date.now().toString());
  }
};
