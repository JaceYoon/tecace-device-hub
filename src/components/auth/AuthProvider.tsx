
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '@/types';
import { mockUsers } from '@/utils/mockData';
import { toast } from 'sonner';

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if there's a stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('tecace_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('tecace_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call with timeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user with matching email
    const user = mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // In real app, password would be verified here
      setUser(user);
      localStorage.setItem('tecace_user', JSON.stringify(user));
      toast.success('Logged in successfully!');
    } else {
      toast.error('Invalid credentials');
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('tecace_user');
    toast.info('Logged out successfully');
  };

  // Check if user is manager
  const isManager = user?.role === 'manager';

  // Create auth context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isManager,
    login,
    logout
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
