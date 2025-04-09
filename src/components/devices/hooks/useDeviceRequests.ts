
import { Device, User } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export const useDeviceRequests = (
  device: Device,
  user: User | null,
  setIsProcessing: (processing: boolean) => void,
  showConfirmation: (title: string, description: string, action: () => void) => void,
  closeConfirmation: () => void,
  onAction?: () => void
) => {
  const handleRequestDevice = async () => {
    if (!user) return;
    
    if (device.requestedBy && device.requestedBy !== "") {
      toast.error('This device is already requested');
      return;
    }

    try {
      setIsProcessing(true);
      const requests = await dataService.devices.getAllRequests();
      const userPendingRequests = requests.filter(
        req => req.userId === user.id && 
               req.status === 'pending' && 
               req.type === 'assign'
      );
      
      if (userPendingRequests.some(req => req.deviceId === device.id)) {
        toast.error('You have already requested this device');
        setIsProcessing(false);
        return;
      }
      
      showConfirmation(
        "Request Device",
        `Are you sure you want to request ${device.project}?`,
        async () => {
          try {
            // Request the device through the API
            await dataService.addRequest({
              deviceId: device.id,
              userId: user.id,
              status: 'pending',
              type: 'assign',
            });
            
            // Always update the device status to "pending" locally
            try {
              await dataService.updateDevice(device.id, {
                requestedBy: user.id,
                status: 'pending'
              });
            } catch (updateError) {
              console.error('Error updating device status to pending:', updateError);
            }

            toast.success('Device requested successfully');
            if (onAction) onAction();
            // Make sure dialog is closed
            closeConfirmation();
          } catch (error) {
            console.error('Error requesting device:', error);
            toast.error('Failed to request device');
            closeConfirmation();
          } finally {
            setIsProcessing(false);
          }
        }
      );
    } catch (error) {
      console.error('Error checking existing requests:', error);
      setIsProcessing(false);
      toast.error('Failed to process your request');
    }
  };

  return {
    handleRequestDevice
  };
};
