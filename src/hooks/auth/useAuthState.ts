
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
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [refreshTrigger]);

  useEffect(() => {
    const fetchUsers = async () => {
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
    
    fetchUsers();
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
