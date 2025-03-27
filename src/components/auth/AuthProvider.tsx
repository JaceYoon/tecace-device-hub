
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User, UserRole } from '@/types';
import { toast } from 'sonner';
import api, { authService, userService } from '@/services/api.service';
import { dataService } from '@/services/data.service';
import { userStore } from '@/utils/data';

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
        // Try to use the API service first
        try {
          const response = await authService.checkAuth();
          if (response && 'isAuthenticated' in response && response.isAuthenticated) {
            setUser(response.user as User);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Authentication check error:', error);
        }
        
        // Try to use dataService as fallback
        try {
          const response = await dataService.auth.checkAuth();
          if (response && 'isAuthenticated' in response && response.isAuthenticated) {
            setUser(response.user as User);
            setIsLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback authentication check error:', fallbackError);
        }

        // Try to use localStorage as last resort
        const storedUser = localStorage.getItem('tecace_current_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser) as User);
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
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
          // Try to fetch from API first
          try {
            const response = await userService.getAll();
            if (Array.isArray(response)) {
              setUsers(response);
              return;
            }
          } catch (error) {
            console.error('Error fetching users from API:', error);
          }
          
          // Try dataService next
          try {
            const response = await dataService.users.getAll();
            if (Array.isArray(response)) {
              setUsers(response);
              return;
            }
          } catch (error) {
            console.error('Error fetching users from dataService:', error);
          }
          
          // Fallback to localStorage if API fails
          const localUsers = userStore.getUsers();
          setUsers(localUsers);
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
      // Try using API service first
      try {
        const response = await authService.login(email, password);
        
        if (response && 'success' in response && response.success) {
          setUser(response.user as User);
          
          // Store user in localStorage as a fallback
          localStorage.setItem('tecace_current_user', JSON.stringify(response.user));
          
          toast.success(`Welcome back, ${response.user.name}!`);
          return true;
        }
      } catch (error) {
        console.error('API login error:', error);
        
        // Try dataService as fallback
        try {
          const response = await dataService.auth.login(email, password);
          
          if (response && 'success' in response && response.success) {
            setUser(response.user as User);
            
            // Store user in localStorage as a fallback
            localStorage.setItem('tecace_current_user', JSON.stringify(response.user));
            
            toast.success(`Welcome back, ${response.user.name}!`);
            return true;
          }
        } catch (fallbackError) {
          console.error('Fallback login error:', fallbackError);
        }
      }
      
      // If login failed through both services, don't fall back to localStorage
      // This is a security issue - we should not allow login with incorrect passwords
      toast.error('Invalid email or password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Do not fall back to localStorage for failed logins - security fix
      toast.error('Invalid email or password');
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Try both services
      try {
        await authService.logout();
      } catch (error) {
        console.error('API logout error:', error);
        try {
          await dataService.auth.logout();
        } catch (fallbackError) {
          console.error('Fallback logout error:', fallbackError);
        }
      }
      
      // Always clear state
      setUser(null);
      // Clear localStorage user
      localStorage.removeItem('tecace_current_user');
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API fails
      setUser(null);
      localStorage.removeItem('tecace_current_user');
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
      
      // Try API service first
      try {
        const response = await api.post<RegisterResponse>('/auth/register', {
          name: `${firstName} ${lastName}`,
          email,
          password
        });
        
        if (response && 'success' in response && response.success && response.user) {
          setUser(response.user);
          localStorage.setItem('tecace_current_user', JSON.stringify(response.user));
          toast.success('Account created successfully!');
          return { 
            success: true, 
            message: 'Registration successful', 
            verificationRequired: false 
          };
        }
      } catch (error) {
        console.error('API registration error:', error);
        
        // Try dataService as fallback
        try {
          const response = await dataService.auth.register(
            `${firstName} ${lastName}`,
            email,
            password
          );
          
          if (response && 'success' in response && response.success && response.user) {
            setUser(response.user);
            localStorage.setItem('tecace_current_user', JSON.stringify(response.user));
            toast.success('Account created successfully!');
            return { 
              success: true, 
              message: 'Registration successful', 
              verificationRequired: false 
            };
          }
        } catch (fallbackError) {
          console.error('Fallback registration error:', fallbackError);
        }
      }
      
      // If API registration fails, try local
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: `${firstName} ${lastName}`,
        email,
        role: 'user'
      };
      
      userStore.addUser(newUser);
      setUser(newUser);
      localStorage.setItem('tecace_current_user', JSON.stringify(newUser));
      toast.success('Account created successfully! (Local mode)');
      return { 
        success: true, 
        message: 'Registration successful', 
        verificationRequired: false 
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Try to register in localStorage
      try {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: `${firstName} ${lastName}`,
          email,
          role: 'user'
        };
        
        userStore.addUser(newUser);
        setUser(newUser);
        localStorage.setItem('tecace_current_user', JSON.stringify(newUser));
        toast.success('Account created successfully! (Local mode)');
        return { 
          success: true, 
          message: 'Registration successful', 
          verificationRequired: false 
        };
      } catch (fallbackError) {
        console.error('Local registration fallback failed:', fallbackError);
      }
      
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
        
        // Try API call first
        try {
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
              localStorage.setItem('tecace_current_user', JSON.stringify(updatedUser));
            }
            
            toast.success(`User role updated to ${role}`);
            return true;
          }
        } catch (error) {
          console.error('Error updating user role via API:', error);
          
          // Try dataService as fallback
          try {
            const response = await dataService.users.updateRole(userId, role as 'admin' | 'user');
            if (response) {
              // Success with dataService, update users list
              setUsers(prev => prev.map(u => 
                u.id === userId ? { ...u, role: role as UserRole } : u
              ));
              
              // If current user is being updated, update current user
              if (user && user.id === userId) {
                const updatedUser = { ...user, role: role as UserRole };
                setUser(updatedUser);
                localStorage.setItem('tecace_current_user', JSON.stringify(updatedUser));
              }
              
              toast.success(`User role updated to ${role}`);
              return true;
            }
          } catch (fallbackError) {
            console.error('Error updating user role via dataService:', fallbackError);
          }
        }
        
        // Fallback to localStorage
        const updatedUser = userStore.updateUser(userId, { role: role as UserRole });
        if (updatedUser) {
          // Update users list
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, role: role as UserRole } : u
          ));
          
          // If current user is being updated, update current user
          if (user && user.id === userId) {
            const updatedUser = { ...user, role: role as UserRole };
            setUser(updatedUser);
            localStorage.setItem('tecace_current_user', JSON.stringify(updatedUser));
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

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  // For backward compatibility, isManager is true if admin or manager
  const isManager = user?.role === 'admin' || user?.role === 'manager';

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
