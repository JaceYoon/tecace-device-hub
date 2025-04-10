
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Check, KeyRound, EyeIcon, EyeOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api.service';

const ProfileEditor: React.FC = () => {
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
    
    // Clear error when typing
    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Check if confirm password matches
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
      console.log('Updating profile for user ID:', user.id);
      
      // Call the API to update the user profile
      const response = await api.put(`/users/${user.id}/profile`, {
        name: profileData.name,
        avatarUrl: profileData.avatarUrl
      });
      
      if (response) {
        // Update local user state with updateUserProfile from AuthContext
        updateUserProfile({
          name: profileData.name,
          avatarUrl: profileData.avatarUrl
        });
        
        // Reset image error state when updating avatar URL
        setImageError(false);
        
        toast.success('Profile updated successfully', {
          description: 'Your profile information has been updated'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: 'Please try again later'
      });
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };
  
  const handlePasswordSave = async () => {
    if (!user) return;
    
    // Validate passwords
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
      // Call API to update password
      const response = await api.put(`/users/${user.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response) {
        toast.success('Password updated successfully', {
          description: 'Your password has been changed'
        });
        
        // Reset password form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setIsChangingPassword(false);
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      // Handle specific error for incorrect current password
      if (error.response && error.response.status === 401) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        toast.error('Failed to update password', {
          description: 'Please try again later'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Profile Settings</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            {profileData.avatarUrl && !imageError ? (
              <AvatarImage 
                src={profileData.avatarUrl} 
                alt={profileData.name} 
                onError={(e) => {
                  console.error('Failed to load avatar image in profile editor:', profileData.avatarUrl);
                  setImageError(true);
                }}
              />
            ) : (
              <AvatarFallback className="text-xl">
                {profileData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            )}
          </Avatar>
          
          {isEditing && (
            <div className="w-full">
              <Label htmlFor="avatarUrl">Profile Picture URL</Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                value={profileData.avatarUrl}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1"
                autoComplete="photo"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          {isEditing ? (
            <Input
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
            />
          ) : (
            <div className="flex items-center justify-between border rounded-md p-2">
              <span>{profileData.name}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center justify-between border rounded-md p-2 bg-muted/20">
            <span>{user.email}</span>
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>
        
        {!isEditing && !isChangingPassword && (
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </div>
        )}
        
        {isChangingPassword && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <h3 className="font-medium">Change Password</h3>
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.currentPassword ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.newPassword ? "border-red-500" : ""}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {isEditing && (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        )}
        
        {isChangingPassword && (
          <>
            <Button variant="outline" onClick={() => {
              setIsChangingPassword(false);
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
              setPasswordErrors({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
            }}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProfileEditor;
