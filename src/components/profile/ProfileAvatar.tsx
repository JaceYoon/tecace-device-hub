
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileAvatarProps {
  name: string;
  avatarUrl: string;
  isEditing: boolean;
  imageError: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setImageError: (error: boolean) => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  avatarUrl,
  isEditing,
  imageError,
  onChange,
  setImageError
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        {avatarUrl && !imageError ? (
          <AvatarImage 
            src={avatarUrl} 
            alt={name} 
            onError={() => {
              console.error('Failed to load avatar image:', avatarUrl);
              setImageError(true);
            }}
          />
        ) : (
          <AvatarFallback className="text-xl">
            {name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        )}
      </Avatar>
      
      {isEditing && (
        <div className="w-full">
          <Label htmlFor="avatarUrl">Profile Picture URL</Label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            value={avatarUrl}
            onChange={onChange}
            placeholder="https://example.com/avatar.jpg"
            className="mt-1"
            autoComplete="photo"
          />
        </div>
      )}
    </div>
  );
};
