
import React, { useState } from 'react';
import { Device } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import DeviceEditForm from './DeviceEditForm';

interface DeviceEditDialogProps {
  device: Device;
  onDeviceUpdated?: () => void;
}

const DeviceEditDialog: React.FC<DeviceEditDialogProps> = ({ device, onDeviceUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleDeviceUpdated = () => {
    setIsOpen(false);
    if (onDeviceUpdated) {
      onDeviceUpdated();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Device">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DeviceEditForm 
          device={device} 
          onDeviceUpdated={handleDeviceUpdated} 
          onCancel={() => setIsOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default DeviceEditDialog;
