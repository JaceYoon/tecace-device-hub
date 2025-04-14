
import React from 'react';
import { useProfileEditor } from '@/hooks/profile/useProfileEditor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Check, KeyRound } from 'lucide-react';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileForm } from './ProfileForm';
import { PasswordForm } from './PasswordForm';

const ProfileEditor: React.FC = () => {
  const {
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
  } = useProfileEditor();

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Profile Settings</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ProfileAvatar
          name={profileData.name}
          avatarUrl={profileData.avatarUrl}
          isEditing={isEditing}
          imageError={imageError}
          onChange={handleChange}
          setImageError={setImageError}
        />
        
        <ProfileForm
          name={profileData.name}
          email={user.email}
          isEditing={isEditing}
          onChange={handleChange}
        />
        
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
            <PasswordForm
              passwordData={passwordData}
              passwordErrors={passwordErrors}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onPasswordChange={handlePasswordChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />
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
