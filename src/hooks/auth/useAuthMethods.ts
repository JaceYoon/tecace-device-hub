
import { useState } from 'react';
import { User, UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '@/services/api';
import { toast } from 'sonner';

export function useAuthMethods(setUser: (user: User | null) => void) {
  const navigate = useNavigate();
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Log credentials in development mode only
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode login attempt:', { email, password });
      } else {
        console.log('Production login attempt with email:', email);
      }
      
      const response = await authService.login(email, password);
      
      if (response && 'success' in response && response.success) {
        const userWithAvatar = {
          ...response.user,
          avatarUrl: response.user.avatarUrl || undefined
        };
        
        setUser(userWithAvatar as User);
        
        // In production, set a flag to prevent immediate logout redirects
        if (process.env.NODE_ENV === 'production') {
          localStorage.setItem('auth-state', 'authenticated');
          localStorage.setItem('auth-login-time', Date.now().toString());
        }
        
        toast.success(`Welcome back, ${response.user.name}!`);
        return true;
      }
      
      toast.error('Invalid email or password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      
      // Clear auth state in production
      if (process.env.NODE_ENV === 'production') {
        localStorage.removeItem('auth-state');
        localStorage.removeItem('auth-login-time');
        localStorage.setItem('auth-logout-time', Date.now().toString());
      }
      
      toast.info('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      toast.error('Error logging out');
      navigate('/');
    }
  };

  const register = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string
  ): Promise<{ success: boolean, message: string, verificationRequired: boolean }> => {
    try {
      // Log registration info in development mode only
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode registration:', { firstName, lastName, email, password });
      }
      
      const response = await authService.register(
        `${firstName} ${lastName}`,
        email,
        password
      );
      
      if (response && 'success' in response && response.success && response.user) {
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
      return { success: false, message, verificationRequired: false };
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Error creating account';
      toast.error(message);
      return { success: false, message, verificationRequired: false };
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const response = await userService.updateRole(userId, newRole);
      if (response) {
        toast.success(`User role updated to ${newRole}`);
        
        // Remove the page reload - we'll let the refresh callbacks handle updating the UI
        return true;
      }
      toast.error('Failed to update user role');
      return false;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
      return false;
    }
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      // Log profile updates in development mode only
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode profile update:', updates);
      }
      
      // Fix for TypeScript error - directly update with the new user object
      // First get the current user state through a temp variable
      const tempUser = await authService.checkAuth();
      if (tempUser && tempUser.user) {
        const updatedUser = { ...tempUser.user, ...updates };
        setUser(updatedUser as User);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  return {
    login,
    logout,
    register,
    updateUserRole,
    updateUserProfile,
    verifyEmail: async () => true // No-op since verification is not used
  };
}
