
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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

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

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    // When dialog opens, close any open dropdown menus
    if (newOpen) {
      // Use setTimeout to ensure the dialog is fully opened first
      setTimeout(() => {
        // Close all dropdown menus by finding triggers and setting their data-state
        const dropdownTriggers = document.querySelectorAll('[data-state="open"]');
        dropdownTriggers.forEach(trigger => {
          // Check if this is a dropdown trigger (has aria-expanded)
          if (trigger.hasAttribute('aria-expanded')) {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('data-state', 'closed');
          }
        });
        
        // Also close any open dropdown content
        const dropdownContents = document.querySelectorAll('[role="menu"][data-state="open"]');
        dropdownContents.forEach(content => {
          content.setAttribute('data-state', 'closed');
          (content as HTMLElement).style.display = 'none';
        });
        
        // Trigger a click outside to ensure all dropdowns close
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        document.body.dispatchEvent(clickEvent);
      }, 50);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerElement || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DeviceDialogDescription />
        </DialogHeader>
        
        <div className="dialog-content-scroll">
          <DeviceEditForm 
            device={device} 
            onDeviceUpdated={handleDeviceUpdated} 
            onCancel={() => setOpen(false)}
          />
        </div>
        
        <DialogFooter className="mt-4">
          {/* Footer content if needed */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add default export
export default DeviceEditDialog;
