import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, UserRole } from '@/types';
import { toast } from 'sonner';
import api, { authService, userService } from '@/services/api.service';

// Create the Auth Context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ensure the component is properly defined as a React function component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Move all hooks to the top level of the component
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
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
      if (user && (user.role === 'admin' || user.role === 'manager')) {
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

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  // For backward compatibility, isManager is true if admin or manager
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(email, password);
      
      if (response && 'success' in response && response.success) {
        console.log('Login successful, user data:', response.user);
        
        // Ensure the user object has the avatarUrl property
        const userWithAvatar = {
          ...response.user,
          avatarUrl: response.user.avatarUrl || undefined
        };
        
        console.log('Setting user with avatar after login:', userWithAvatar);
        setUser(userWithAvatar as User);
        toast.success(`Welcome back, ${response.user.name}!`);
        return true;
      }
      
      toast.error('Invalid email or password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      toast.error('Error logging out');
    }
  };

  // Register new user
  const register = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string
  ): Promise<{ success: boolean, message: string, verificationRequired: boolean }> => {
    try {
      // Define the expected response type explicitly
      interface RegisterResponse {
        success: boolean;
        user?: User;
        message?: string;
      }
      
      const response = await api.post<RegisterResponse>('/auth/register', {
        name: `${firstName} ${lastName}`,
        email,
        password
      });
      
      if (response && 'success' in response && response.success && response.user) {
        // Include avatarUrl in the user object if it exists
        const userWithAvatar = {
          ...response.user,
          avatarUrl: response.user.avatarUrl || undefined
        };
        
        setUser(userWithAvatar);
        toast.success('Account created successfully!');
        return { 
          success: true, 
          message: 'Registration successful', 
          verificationRequired: false 
        };
      }
      
      const message = response?.message || 'Error creating account';
      toast.error(message);
      return { 
        success: false, 
        message, 
        verificationRequired: false 
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Error creating account';
      toast.error(message);
      return { 
        success: false, 
        message, 
        verificationRequired: false 
      };
    }
  };

  // Since we don't use verification anymore, this is a simple pass-through
  const verifyEmail = async (
    email: string, 
    code: string, 
    userData: { firstName: string, lastName: string, password: string }
  ): Promise<boolean> => {
    // This is now a no-op since we don't use verification
    return true;
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Updating profile for user:', user.id, 'with data:', updates);
      
      // Update via API only
      const response = await api.put(`/users/${user.id}/profile`, updates);
      
      if (response) {
        console.log('Profile updated successfully via API:', response);
        
        // Update the user in state with the response from the server
        const updatedUser = { ...user, ...updates };
        
        if (updates.avatarUrl) {
          console.log('Setting avatar URL to:', updates.avatarUrl);
          updatedUser.avatarUrl = updates.avatarUrl;
        }
        
        setUser(updatedUser);
        
        // Also update in the users list if present
        if (users.length > 0) {
          setUsers(prev => prev.map(u => 
            u.id === user.id ? { ...u, ...updates } : u
          ));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  // Update user role (admin only)
  const updateUserRole = (userId: string, newRole: UserRole): boolean => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can update user roles');
      return false;
    }

    // Create an async function inside to handle the API call
    const performRoleUpdate = async () => {
      try {
        // Use 'admin' or 'user' only, as 'manager' is not supported in the backend
        const role = newRole === 'manager' ? 'admin' : newRole;
        
        const response = await userService.updateRole(userId, role as 'admin' | 'user');
        
        if (response) {
          // Success with API, update users list
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, role: role as UserRole } : u
          ));
          
          // If current user is being updated, update current user
          if (user && user.id === userId) {
            const updatedUser = { ...user, role: role as UserRole };
            setUser(updatedUser);
          }
          
          toast.success(`User role updated to ${role}`);
          return true;
        } else {
          toast.error('Failed to update user role');
          return false;
        }
      } catch (error) {
        console.error('Error updating user role:', error);
        toast.error('Failed to update user role');
        return false;
      }
    };

    // Call the async function but return true immediately
    // This matches the expected type while still performing the update
    performRoleUpdate();
    return true;
  };

  // Create auth context value
  const contextValue: AuthContextType = {
    user,
    users,
    isAuthenticated: !!user,
    isLoading,
    isManager,
    isAdmin,
    login,
    logout,
    register,
    verifyEmail,
    updateUserRole,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
