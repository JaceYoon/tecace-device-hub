
import React, { useEffect } from 'react';
import { AuthContext } from '@/providers/AuthContext';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useAuthMethods } from '@/hooks/auth/useAuthMethods';
import { useLocation } from 'react-router-dom';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser, users, isLoading } = useAuthState();
  const authMethods = useAuthMethods(setUser);
  const location = useLocation();
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'admin' || user?.role === 'TPM' || user?.role === 'Software Engineer';

  // Enhanced auth protection for production
  useEffect(() => {
    // Only run this check in production and not on login/index pages
    const isProductionMode = process.env.NODE_ENV === 'production';
    const isLoginPage = location.pathname === '/' || location.pathname === '/login';
    
    if (isProductionMode && !isLoginPage && !isLoading && !user) {
      console.log('Protected route accessed without authentication, redirecting to login');
      window.location.href = '/login';
    }
  }, [user, isLoading, location.pathname]);

  const contextValue = {
    user,
    users,
    isAuthenticated: !!user,
    isLoading,
    isManager,
    isAdmin,
    ...authMethods
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from '@/hooks/auth/useAuth';
