
import { User, Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export const useDeviceRequests = (
  device: Device,
  user: User | null,
  setIsProcessing: (value: boolean) => void,
  showConfirmation: (title: string, description: string, action: () => void) => void,
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
            await dataService.addRequest({
              deviceId: device.id,
              userId: user.id,
              status: 'pending',
              type: 'assign',
            });

            toast.success('Device requested successfully');
            if (onAction) onAction();
          } catch (error) {
            console.error('Error requesting device:', error);
            toast.error('Failed to request device');
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
