
import { User } from '@/types';
import apiCall from '../apiCall';
import { resetLoggedOutState, setUserLoggedOut } from '../constants';

export const authService = {
  checkAuth: (): Promise<{ isAuthenticated: boolean; user: User | null }> =>
    apiCall<{ isAuthenticated: boolean; user: User | null }>('/auth/check'),

  login: (email: string, password: string): Promise<{ success: boolean; user: User; isAuthenticated: boolean }> => {
    // Reset logged out state on login attempt
    resetLoggedOutState();
    
    // Log auth attempt for debugging
    console.log(`Attempting to login with email: ${email}`);
    
    return apiCall<{ success: boolean; user: User; isAuthenticated: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  logout: (): Promise<{ success: boolean }> => {
    // Set user as logged out first
    setUserLoggedOut();
    return apiCall<{ success: boolean }>('/auth/logout');
  },

  register: (name: string, email: string, password: string): Promise<{ success: boolean; user: User; message?: string }> => {
    // Reset logged out state on registration
    resetLoggedOutState();
    return apiCall<{ success: boolean; user: User; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },
};

export default authService;
