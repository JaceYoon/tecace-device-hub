
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '@/types';
import { toast } from 'sonner';

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for development purposes
const MOCK_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@tecace.com',
    role: 'admin',
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=admin'
  },
  {
    id: 'user-1',
    name: 'Demo User',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@tecace.com',
    role: 'user',
    avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=demo'
  }
];

// In-memory storage for verification codes
const verificationCodes: Record<string, string> = {};

// Helper function to send a verification email (mock)
const sendVerificationEmail = (email: string, code: string) => {
  console.log(`Sending verification code to ${email}: ${code}`);
  // In a real implementation, this would send an actual email
  // For now, we'll just show the code in a toast for demo purposes
  toast.info(`Verification code for ${email}: ${code}`, {
    duration: 10000, // Keep it visible longer for testing
    description: "In a real app, this would be sent to your email"
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize users from localStorage or default to mock users
  useEffect(() => {
    const loadUsers = () => {
      try {
        const savedUsers = localStorage.getItem('tecace_users');
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        } else {
          // Initialize with mock users if none exist
          setUsers(MOCK_USERS);
          localStorage.setItem('tecace_users', JSON.stringify(MOCK_USERS));
        }

        // Check if user is logged in
        const loggedInUser = localStorage.getItem('tecace_current_user');
        if (loggedInUser) {
          setUser(JSON.parse(loggedInUser));
        }
      } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to mock users on error
        setUsers(MOCK_USERS);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, you would hash passwords and not store them in localStorage
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('tecace_current_user', JSON.stringify(foundUser));
      toast.success(`Welcome back, ${foundUser.firstName}!`);
      return true;
    }
    
    toast.error('Invalid email or password');
    return false;
  };

  // Logout function
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('tecace_current_user');
    toast.info('Logged out successfully');
  };

  // Register new user
  const register = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string
  ): Promise<{ success: boolean, message: string, verificationRequired: boolean }> => {
    // Validate email domain
    if (!email.endsWith('@tecace.com')) {
      return { 
        success: false, 
        message: 'Only @tecace.com email addresses are allowed', 
        verificationRequired: false 
      };
    }

    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { 
        success: false, 
        message: 'This email is already registered', 
        verificationRequired: false 
      };
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = verificationCode;

    // Send verification email (mock)
    sendVerificationEmail(email, verificationCode);
    
    return { 
      success: true, 
      message: 'Verification code sent to your email', 
      verificationRequired: true 
    };
  };

  // Verify email with code
  const verifyEmail = async (
    email: string, 
    code: string, 
    userData: { firstName: string, lastName: string, password: string }
  ): Promise<boolean> => {
    if (verificationCodes[email] === code) {
      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        role: 'user', // Default role
        avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${email}`
      };

      // Add user to the list
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('tecace_users', JSON.stringify(updatedUsers));
      
      // Remove verification code
      delete verificationCodes[email];
      
      // Auto-login the new user
      setUser(newUser);
      localStorage.setItem('tecace_current_user', JSON.stringify(newUser));
      
      toast.success('Account created successfully!');
      return true;
    }
    
    toast.error('Invalid verification code');
    return false;
  };

  // Update user role (admin only)
  const updateUserRole = (userId: string, newRole: 'admin' | 'user' | 'manager'): boolean => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can update user roles');
      return false;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );
    
    setUsers(updatedUsers);
    localStorage.setItem('tecace_users', JSON.stringify(updatedUsers));
    
    // If the current user is being updated, update the current user as well
    if (user?.id === userId) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('tecace_current_user', JSON.stringify(updatedUser));
    }
    
    toast.success(`User role updated to ${newRole}`);
    return true;
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  // Check if user is manager (keeping for backward compatibility)
  const isManager = user?.role === 'manager' || user?.role === 'admin';

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
