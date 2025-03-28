
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api.service';

const ProfileEditor: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
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

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-xl">Profile Settings</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            {profileData.avatarUrl ? (
              <AvatarImage 
                src={profileData.avatarUrl} 
                alt={profileData.name} 
                onError={(e) => {
                  console.error('Failed to load avatar image in profile editor:', profileData.avatarUrl);
                  // Cast to HTMLImageElement to access the src property
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
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
            />
          ) : (
            <div className="flex items-center justify-between border rounded-md p-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{profileData.name}</span>
              </div>
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
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {isEditing ? (
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
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProfileEditor;
