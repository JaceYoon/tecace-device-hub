
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Device } from '@/types';
import DeviceEditForm from './DeviceEditForm';

interface DeviceEditDialogProps {
  device: Device;
  onDeviceUpdated?: () => void;
  triggerElement?: React.ReactNode;
}

// Create the DialogDescription component
const DeviceDialogDescription: React.FC = () => (
  <DialogDescription>
    Edit device information and properties below.
  </DialogDescription>
);

export const DeviceEditDialog: React.FC<DeviceEditDialogProps> = ({ 
  device, 
  onDeviceUpdated,
  triggerElement
}) => {
  const [open, setOpen] = useState(false);
  
  const handleDeviceUpdated = () => {
    if (onDeviceUpdated) {
      onDeviceUpdated();
    }
    // Close the dialog after the device is updated
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerElement || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DeviceDialogDescription />
        </DialogHeader>
        
        <DeviceEditForm 
          device={device} 
          onDeviceUpdated={handleDeviceUpdated} 
          onCancel={() => setOpen(false)}
        />
        
        <DialogFooter className="mt-4">
          {/* Footer content if needed */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add default export
export default DeviceEditDialog;
