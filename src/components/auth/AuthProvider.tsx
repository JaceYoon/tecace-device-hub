
import React, { useContext } from 'react';
import { User } from '@/types';
import AuthContext from './context/AuthContext';
import { useAuthState } from './hooks/useAuthState';
import { useAuthMethods } from './hooks/useAuthMethods';

// Ensure the component is properly defined as a React function component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get auth state using the hook
  const { user, setUser, users, setUsers, isLoading } = useAuthState();
  
  // Get auth methods using the hook
  const { login, logout, register, verifyEmail, updateUserProfile, updateUserRole } = useAuthMethods(user, setUser, setUsers);

  // Check if user is admin or manager
  const isAdmin = user?.role === 'admin';
  // For backward compatibility, isManager is true if admin or TPM or Software Engineer
  const isManager = user?.role === 'admin' || user?.role === 'TPM' || user?.role === 'Software Engineer';

  // Create auth context value
  const contextValue = {
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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
