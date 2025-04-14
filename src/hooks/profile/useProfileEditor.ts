
import { useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from 'sonner';
import api from '@/services/api';

export function useProfileEditor() {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    if (name === 'confirmPassword' || (name === 'newPassword' && passwordData.confirmPassword)) {
      if (name === 'newPassword' && value !== passwordData.confirmPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else if (name === 'confirmPassword' && value !== passwordData.newPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.put(`/users/${user.id}/profile`, {
        name: profileData.name,
        avatarUrl: profileData.avatarUrl
      });
      
      if (response) {
        updateUserProfile({
          name: profileData.name,
          avatarUrl: profileData.avatarUrl
        });
        
        setImageError(false);
        
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };
  
  const handlePasswordSave = async () => {
    if (!user) return;
    
    let hasErrors = false;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      hasErrors = true;
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
      hasErrors = true;
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      hasErrors = true;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.put(`/users/${user.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response) {
        toast.success('Password updated successfully');
        
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setIsChangingPassword(false);
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      if (error.response?.status === 401) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isEditing,
    setIsEditing,
    isChangingPassword,
    setIsChangingPassword,
    isLoading,
    imageError,
    setImageError,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    profileData,
    passwordData,
    setPasswordData,
    passwordErrors,
    setPasswordErrors,
    handleChange,
    handlePasswordChange,
    handleSave,
    handlePasswordSave
  };
}
