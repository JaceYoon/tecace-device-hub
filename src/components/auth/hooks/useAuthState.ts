
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authService, userService } from '@/services/api';

export function useAuthState() {
  // State hooks
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        const response = await authService.checkAuth();
        if (response && 'isAuthenticated' in response && response.isAuthenticated) {
          console.log('User authenticated from server:', response.user);
          
          // Make sure avatarUrl is properly included in the user object
          if (response.user) {
            const userWithAvatar = {
              ...response.user,
              avatarUrl: response.user.avatarUrl || undefined
            };
            setUser(userWithAvatar as User);
            
            // Log the user data with avatar URL for debugging
            console.log('Setting user with avatar:', userWithAvatar);
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

  // Fetch users when user is authenticated
  useEffect(() => {
    const fetchUsers = async () => {
      if (user && (user.role === 'admin' || user.role === 'TPM' || user.role === 'Software Engineer')) {
        try {
          const response = await userService.getAll();
          if (Array.isArray(response)) {
            setUsers(response);
          }
        } catch (error) {
          console.error('Error fetching users from API:', error);
        }
      }
    };
    
    fetchUsers();
  }, [user]);

  return {
    user,
    setUser,
    users,
    setUsers,
    isLoading
  };
}
