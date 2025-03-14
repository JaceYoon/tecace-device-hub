
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '@/types';
import { toast } from 'sonner';

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Backend API URL - with fallback to mock mode
const IS_MOCK_MODE = true; // Set to true to use mock authentication
const API_URL = IS_MOCK_MODE ? '' : 'http://localhost:5000/api';

// Mock user data for development purposes
const MOCK_USER: User = {
  id: 'mock-user-1',
  name: 'Demo User',
  email: 'demo@tecace.com',
  role: 'manager',
  avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=demo'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (IS_MOCK_MODE) {
          // In mock mode, use local storage to persist login state
          const savedUser = localStorage.getItem('mock_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          setIsLoading(false);
          return;
        }

        // Real API call when not in mock mode
        const response = await fetch(`${API_URL}/auth/check`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated && data.user) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              avatarUrl: data.user.avatarUrl
            });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function - uses mock in mock mode, otherwise redirects to Atlassian OAuth
  const login = async (): Promise<void> => {
    if (IS_MOCK_MODE) {
      // In mock mode, simulate login with mock user
      setUser(MOCK_USER);
      localStorage.setItem('mock_user', JSON.stringify(MOCK_USER));
      toast.success('Logged in as Demo User');
      return;
    }
    
    // Real OAuth login when not in mock mode
    window.location.href = `${API_URL}/auth/login`;
  };

  // Logout function
  const logout = async () => {
    try {
      if (IS_MOCK_MODE) {
        // In mock mode, clear local storage
        localStorage.removeItem('mock_user');
        setUser(null);
        toast.info('Logged out successfully');
        return;
      }
      
      // Real logout when not in mock mode
      await fetch(`${API_URL}/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      
      setUser(null);
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
