
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authService, userService } from '@/services/api';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Check if we're in production and need to handle auth differently
        const isProduction = process.env.NODE_ENV === 'production';
        console.log('Environment:', process.env.NODE_ENV, 'isProduction:', isProduction);
        
        const response = await authService.checkAuth();
        
        if (response && 'isAuthenticated' in response && response.isAuthenticated) {
          console.log('User authenticated from server:', response.user);
          
          if (response.user) {
            const userWithAvatar = {
              ...response.user,
              avatarUrl: response.user.avatarUrl || undefined
            };
            setUser(userWithAvatar as User);
          }
        } else {
          console.log('User is not authenticated');
          setUser(null);
          
          // In production, we want to make sure the user logs in before API calls
          if (isProduction && window.location.pathname !== '/' && window.location.pathname !== '/login') {
            console.log('Redirecting unauthenticated user to login in production');
            window.location.href = '/login';
            return;
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setUser(null);
        
        // In production, redirect to login on auth errors
        if (process.env.NODE_ENV === 'production' && window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/login';
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [refreshTrigger]);

  useEffect(() => {
    const fetchUsers = async () => {
      // Only fetch users if authenticated and has appropriate role
      if (user && (user.role === 'admin' || user.role === 'TPM' || user.role === 'Software Engineer')) {
        try {
          const response = await userService.getAll();
          if (Array.isArray(response)) {
            setUsers(response);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }
    };
    
    // Only attempt to fetch users if we have an authenticated user
    if (user) {
      fetchUsers();
    }
  }, [user, refreshTrigger]);

  // Register a refresh callback to update users when changes happen
  useEffect(() => {
    const unregister = dataService.registerRefreshCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    
    return () => {
      if (unregister) unregister();
    };
  }, []);

  return { user, setUser, users, setUsers, isLoading };
}
