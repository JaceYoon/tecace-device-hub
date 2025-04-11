
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '@/types';
import { authService, api } from '@/services/api';
import { toast } from 'sonner';

export function useAuthMethods(
  user: User | null, 
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
) {
  const navigate = useNavigate();

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt for:', email);
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
      
      console.error('Login failed - invalid response:', response);
      toast.error('Invalid email or password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in. Please check your credentials and connection.');
      return false;
    }
  };

  // Logout function - modified to include navigation
  const logout = async (): Promise<boolean> => {
    try {
      await authService.logout();
      setUser(null);
      toast.info('Logged out successfully');
      // Navigate to main page after logout
      navigate('/');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      toast.error('Error logging out');
      // Still navigate to main page even if there's an error
      navigate('/');
      return false;
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
        // Use the role directly as it matches the backend
        const response = await api.users.updateRole(userId, newRole);
        
        if (response) {
          // Success with API, update users list
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, role: newRole } : u
          ));
          
          // If current user is being updated, update current user
          if (user && user.id === userId) {
            const updatedUser = { ...user, role: newRole };
            setUser(updatedUser);
          }
          
          toast.success(`User role updated to ${newRole}`);
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

  return {
    login,
    logout,
    register,
    updateUserProfile,
    updateUserRole,
    // Since we don't use verification anymore, this is a simple pass-through
    verifyEmail: async () => true
  };
}
