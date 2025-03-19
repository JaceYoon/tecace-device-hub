
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '@/types';
import { toast } from 'sonner';
import { api, authService, userService } from '@/services/api.service';

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.checkAuth();
        if (response.isAuthenticated) {
          setUser(response.user);
        }
      } catch (error) {
        console.error('Authentication check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Fetch users when user is authenticated
  useEffect(() => {
    const fetchUsers = async () => {
      if (user && (user.role === 'admin')) {
        try {
          const response = await userService.getAll();
          setUsers(response);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }
    };
    
    fetchUsers();
  }, [user]);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        toast.success(`Welcome back, ${response.user.name}!`);
        return true;
      }
      
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
      const response = await api.post('/auth/register', {
        name: `${firstName} ${lastName}`,
        email,
        password
      });
      
      if (response.success) {
        setUser(response.user);
        toast.success('Account created successfully!');
        return { 
          success: true, 
          message: 'Registration successful', 
          verificationRequired: false 
        };
      }
      
      return { 
        success: false, 
        message: 'Registration failed', 
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

  // Update user role (admin only)
  // Modified to ensure it returns a boolean to match the type in AuthContextType
  const updateUserRole = (userId: string, newRole: 'admin' | 'user' | 'manager'): boolean => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can update user roles');
      return false;
    }

    // Create an async function inside to handle the API call
    const performRoleUpdate = async () => {
      try {
        // Use 'admin' or 'user' only, as 'manager' is not supported in the backend
        const role = newRole === 'manager' ? 'admin' : newRole;
        const response = await userService.updateRole(userId, role);
        
        // Update users list
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role } : u
        ));
        
        // If current user is being updated, update current user
        if (user.id === userId) {
          setUser(prev => prev ? { ...prev, role } : null);
        }
        
        toast.success(`User role updated to ${role}`);
        return true;
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

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  // For backward compatibility, isManager is true if admin
  const isManager = user?.role === 'admin';

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
    updateUserRole
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
