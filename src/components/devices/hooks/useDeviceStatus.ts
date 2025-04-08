
import { User, Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export const useDeviceStatus = (
  device: Device,
  user: User | null,
  showConfirmation: (title: string, description: string, action: () => void) => void,
  closeConfirmation: () => void,
  onAction?: () => void
) => {
  const handleReleaseDevice = () => {
    if (!user) return;

    showConfirmation(
      "Release Device",
      `Are you sure you want to release ${device.project}?`,
      async () => {
        try {
          
          try {
            await dataService.updateDevice(device.id, {
              assignedTo: undefined,
              assignedToId: undefined,
              status: 'available',
            });
            
            try {
              await dataService.addRequest({
                deviceId: device.id,
                userId: user.id,
                status: 'approved',
                type: 'release',
              });
            } catch (requestError) {
              console.warn('Failed to create release request record:', requestError);
            }
            
            toast.success('Device returned successfully');
            
            if (onAction) {
              onAction();
            }
          } catch (error) {
            console.error('Error updating device status:', error);
            toast.error('Failed to return device');
          } finally {
            // Ensure dialog is closed after operation completes
            closeConfirmation();
          }
        } finally {
          // We don't need to set isProcessing here since it's handled in the parent component
        }
      }
    );
  };

  const handleStatusChange = (newStatus: 'missing' | 'stolen' | 'available' | 'dead') => {
    showConfirmation(
      `Mark as ${newStatus}`,
      `Are you sure you want to mark this device as ${newStatus}?`,
      async () => {
        try {
          await dataService.updateDevice(device.id, { status: newStatus });
          toast.success(`Device marked as ${newStatus}`);
          if (onAction) onAction();
        } catch (error) {
          console.error('Error updating device status:', error);
          toast.error('Failed to update device status');
        } finally {
          // Ensure dialog is closed after operation completes
          closeConfirmation();
        }
      }
    );
  };

  return {
    handleReleaseDevice,
    handleStatusChange
  };
};
