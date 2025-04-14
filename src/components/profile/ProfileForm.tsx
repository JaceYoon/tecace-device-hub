
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ProfileFormProps {
  name: string;
  email: string;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  name,
  email,
  isEditing,
  onChange
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        {isEditing ? (
          <Input
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            placeholder="Your name"
            autoComplete="name"
          />
        ) : (
          <div className="flex items-center justify-between border rounded-md p-2">
            <span>{name}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="flex items-center justify-between border rounded-md p-2 bg-muted/20">
          <span>{email}</span>
        </div>
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>
    </>
  );
};
