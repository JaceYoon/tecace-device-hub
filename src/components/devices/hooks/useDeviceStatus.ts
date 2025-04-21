
import { User, Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { useState } from 'react';

export const useDeviceStatus = (
  device: Device,
  user: User | null,
  showConfirmation: (title: string, description: string, action: () => void) => void,
  closeConfirmation: () => void,
  onAction?: () => void
) => {
  const [isRequestPending, setIsRequestPending] = useState(false);

  const handleReleaseDevice = () => {
    if (!user) return;
    
    // Prevent duplicate requests
    if (isRequestPending) {
      console.log('Release request already in progress, ignoring duplicate request');
      return;
    }

    showConfirmation(
      "Release Device",
      `Are you sure you want to release ${device.project}?`,
      async () => {
        try {
          setIsRequestPending(true);
          
          // Instead of immediately releasing, create a release request
          try {
            console.log(`Creating release request for device ${device.id} by user ${user.id}`);
            const request = await dataService.devices.requestDevice(device.id, 'release');
            console.log('Release request created:', request);
            
            toast.success('Release request submitted successfully');
            
            if (onAction) {
              onAction();
            }
          } catch (error) {
            console.error('Failed to create release request:', error);
            toast.error('Failed to request device release');
          } finally {
            // Ensure dialog is closed after operation completes
            closeConfirmation();
            setIsRequestPending(false);
          }
        } catch (error) {
          // Final safety net to ensure we always reset the state
          closeConfirmation();
          setIsRequestPending(false);
        }
      }
    );
  };

  const handleStatusChange = (newStatus: 'missing' | 'stolen' | 'available' | 'dead') => {
    // Prevent duplicate requests
    if (isRequestPending) {
      console.log('Status change request already in progress, ignoring duplicate request');
      return;
    }
    
    showConfirmation(
      `Mark as ${newStatus}`,
      `Are you sure you want to mark this device as ${newStatus}?`,
      async () => {
        try {
          setIsRequestPending(true);
          
          await dataService.updateDevice(device.id, { status: newStatus });
          toast.success(`Device marked as ${newStatus}`);
          if (onAction) onAction();
        } catch (error) {
          console.error('Error updating device status:', error);
          toast.error('Failed to update device status');
        } finally {
          // Ensure dialog is closed after operation completes
          closeConfirmation();
          setIsRequestPending(false);
        }
      }
    );
  };

  return {
    handleReleaseDevice,
    handleStatusChange,
    isRequestPending
  };
};
