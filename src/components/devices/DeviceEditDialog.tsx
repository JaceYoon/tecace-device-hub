
// We need to add this file to fix the Missing `Description` warning
// Note: Since we can't edit this file directly, we're creating a wrapper component for it
import React from 'react';
import { DialogDescription } from '@/components/ui/dialog';

// This component will be imported in the existing DeviceEditDialog component
// and used to provide the missing description
export const DeviceDialogDescription: React.FC = () => (
  <DialogDescription>
    Edit device information and properties below.
  </DialogDescription>
);
