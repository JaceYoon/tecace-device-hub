
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authService } from '@/services/api';
import { toast } from 'sonner';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (user && (user.role === 'admin' || user.role === 'TPM' || user.role === 'Software Engineer')) {
        try {
          const response = await authService.users.getAll();
          if (Array.isArray(response)) {
            setUsers(response);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }
    };
    
    fetchUsers();
  }, [user]);

  return { user, setUser, users, setUsers, isLoading };
}
