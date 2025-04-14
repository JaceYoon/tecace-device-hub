
import React from 'react';
import { AuthContext } from '@/providers/AuthContext';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useAuthMethods } from '@/hooks/auth/useAuthMethods';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser, users, isLoading } = useAuthState();
  const authMethods = useAuthMethods(setUser);
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'admin' || user?.role === 'TPM' || user?.role === 'Software Engineer';

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
