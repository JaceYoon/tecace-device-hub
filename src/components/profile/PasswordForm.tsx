
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface PasswordFormProps {
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  passwordErrors: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  showPassword: boolean;
  showConfirmPassword: boolean;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
}

export const PasswordForm: React.FC<PasswordFormProps> = ({
  passwordData,
  passwordErrors,
  showPassword,
  showConfirmPassword,
  onPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword
}) => {
  return (
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
            onChange={onPasswordChange}
            className={passwordErrors.currentPassword ? "border-red-500" : ""}
          />
          <button
            type="button"
            onClick={onTogglePassword}
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
        <Input
          id="newPassword"
          name="newPassword"
          type={showPassword ? "text" : "password"}
          value={passwordData.newPassword}
          onChange={onPasswordChange}
          className={passwordErrors.newPassword ? "border-red-500" : ""}
        />
        {passwordErrors.newPassword && (
          <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={onPasswordChange}
            className={passwordErrors.confirmPassword ? "border-red-500" : ""}
          />
          <button
            type="button"
            onClick={onToggleConfirmPassword}
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
  );
};
