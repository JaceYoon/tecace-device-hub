
import { Device, User, DeviceRequest } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface DeviceRequestsFilterOptions {
  type?: 'assign' | 'release' | 'report' | 'return';
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'returned';
  userId?: string;
  deviceId?: string;
}

export const useDeviceRequests = (options?: DeviceRequestsFilterOptions) => {
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<DeviceRequest[]>([]);

  useEffect(() => {
    // Create an AbortController to cancel the fetch request if the component unmounts
    const abortController = new AbortController();
    
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const allRequests = await dataService.devices.getAllRequests();
        
        if (abortController.signal.aborted) return;
        
        let filteredRequests = [...allRequests];
        
        // Apply filters if provided
        if (options) {
          if (options.type) {
            filteredRequests = filteredRequests.filter(req => req.type === options.type);
          }
          
          if (options.status) {
            filteredRequests = filteredRequests.filter(req => req.status === options.status);
          }
          
          if (options.userId) {
            filteredRequests = filteredRequests.filter(req => req.userId === options.userId);
          }
          
          if (options.deviceId) {
            filteredRequests = filteredRequests.filter(req => req.deviceId === options.deviceId);
          }
        }
        
        setRequests(filteredRequests);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching requests:', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchRequests();
    
    // Cleanup function to abort fetch when component unmounts
    return () => {
      abortController.abort();
    };
  }, [
    options?.type, 
    options?.status, 
    options?.userId, 
    options?.deviceId
  ]);

  const handleRequestDevice = async (
    device: Device,
    user: User | null,
    showConfirmation?: (title: string, description: string, action: () => void) => void,
    closeConfirmation?: () => void,
    onAction?: () => void
  ) => {
    if (!user) return;
    
    if (device.requestedBy && device.requestedBy !== "") {
      toast.error('This device is already requested');
      return;
    }

    try {
      const userPendingRequests = requests.filter(
        req => req.userId === user.id && 
              req.status === 'pending' && 
              req.type === 'assign'
      );
      
      if (userPendingRequests.some(req => req.deviceId === device.id)) {
        toast.error('You have already requested this device');
        return;
      }
      
      if (showConfirmation && closeConfirmation) {
        showConfirmation(
          "Request Device",
          `Are you sure you want to request ${device.project}?`,
          async () => {
            try {
              console.log(`Initiating request for device ${device.id} by user ${user.id}`);
              
              // Request the device through the API
              const request = await dataService.addRequest({
                deviceId: device.id,
                userId: user.id,
                status: 'pending',
                type: 'assign',
              });
              
              console.log(`Request created successfully with ID: ${request.id}`);
              
              // Also explicitly update the device status to ensure consistency
              try {
                console.log(`Updating device ${device.id} status to pending and setting requestedBy to ${user.id}`);
                await dataService.updateDevice(device.id, {
                  requestedBy: user.id,
                  status: 'pending'
                });
                console.log(`Device status updated successfully`);
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
            }
          }
        );
      } else {
        // Direct request without confirmation
        console.log(`Direct request for device ${device.id} by user ${user.id}`);
        
        const request = await dataService.addRequest({
          deviceId: device.id,
          userId: user.id,
          status: 'pending',
          type: 'assign',
        });
        
        console.log(`Direct request created with ID: ${request.id}`);
        
        // Also explicitly update the device status to ensure consistency
        try {
          console.log(`Directly updating device ${device.id} status to pending`);
          await dataService.updateDevice(device.id, {
            requestedBy: user.id,
            status: 'pending'
          });
          console.log(`Device status updated successfully`);
        } catch (updateError) {
          console.error('Error updating device status to pending:', updateError);
        }

        toast.success('Device requested successfully');
        if (onAction) onAction();
      }
    } catch (error) {
      console.error('Error checking existing requests:', error);
      toast.error('Failed to process your request');
    }
  };

  return {
    requests,
    isLoading,
    handleRequestDevice
  };
};
