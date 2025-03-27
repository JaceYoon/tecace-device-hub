import React, { useState, useEffect } from 'react';
import { Device, DeviceTypeCategory, DeviceTypeValue } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit, Smartphone } from 'lucide-react';
import DeviceEditForm from './DeviceEditForm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import DeviceDetails from './DeviceDetails';
import DeviceHistoryDialog from './DeviceHistoryDialog';
import { useAuth } from '@/components/auth/AuthProvider';
import { dataService } from '@/services/data.service';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceEditDialogProps {
  device: Device;
  onDeviceUpdated?: () => void;
}

const DeviceEditDialog: React.FC<DeviceEditDialogProps> = ({ device, onDeviceUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin, isManager } = useAuth();
  
  const downloadDeviceImage = (device: Device) => {
    if (!device.devicePicture) {
      toast.error('No image available to download');
      return;
    }
    
    const link = document.createElement('a');
    link.href = device.devicePicture;
    link.download = `${device.project.replace(/\s+/g, '_')}_device_image.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Edit className="mr-2 h-4 w-4" />
          Edit Device
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription>
            Make changes to the device details here.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">{device.project}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DeviceDetails device={device} />
            </div>
            
            <div>
              {device.devicePicture ? (
                <>
                  <div className="mt-2 flex justify-center">
                    <img 
                      src={device.devicePicture} 
                      alt="Device Picture" 
                      className="max-w-full max-h-[70vh] rounded" 
                    />
                  </div>

                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadDeviceImage(device)}
                      className="flex items-center gap-1"
                      disabled={!device.devicePicture}
                    >
                      <Download className="h-4 w-4" />
                      Download Image
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No image available
                </div>
              )}
            </div>
          </div>
          
          {(isAdmin || isManager) && (
            <div className="mt-4">
              <DeviceEditForm device={device} onDeviceUpdated={onDeviceUpdated} onCancel={() => setIsOpen(false)} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceEditDialog;
