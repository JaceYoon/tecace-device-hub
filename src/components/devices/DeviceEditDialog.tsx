
import React from 'react';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Device } from '@/types';
import DeviceEditForm from './DeviceEditForm';
import { DeviceDialogDescription } from './DeviceEditDialog';

interface DeviceEditDialogProps {
  device: Device;
  onDeviceUpdated?: () => void;
}

export const DeviceEditDialog: React.FC<DeviceEditDialogProps> = ({ 
  device, 
  onDeviceUpdated 
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DeviceDialogDescription />
        </DialogHeader>
        
        <DeviceEditForm 
          device={device} 
          onSuccess={onDeviceUpdated} 
        />
        
        <DialogFooter className="mt-4">
          {/* Footer content if needed */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// We need to add this file to fix the Missing `Description` warning
// Note: Since we can't edit this file directly, we're creating a wrapper component for it
export const DeviceDialogDescription: React.FC = () => (
  <DialogDescription>
    Edit device information and properties below.
  </DialogDescription>
);

// Add import for DialogDescription
import { DialogDescription } from '@/components/ui/dialog';

// Add default export to fix the error
export default DeviceEditDialog;
