
import { useState, useCallback } from 'react';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { deviceStore } from '@/utils/data'; // Import mock data for fallback

export const useReturnableDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [openReturnDateDialog, setOpenReturnDateDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadReturnableDevices = useCallback(async () => {
    // Don't try again if previous load failed
    if (loadFailed) return;
    
    setIsLoading(true);
    try {
      const allDevices = await dataService.devices.getAll();
      
      const returnableDevices = allDevices.filter(
        device => device.status === 'available' || device.status === 'dead'
      );
      setDevices(returnableDevices);
    } catch (error) {
      console.error('Error loading returnable devices:', error);
      
      // Use mock data as fallback
      const mockDevices = deviceStore.getDevices().filter(
        device => device.status === 'available' || device.status === 'dead'
      );
      setDevices(mockDevices);
      
      setLoadFailed(true);
      toast.error('Failed to load devices from server, using demo data');
    } finally {
      setIsLoading(false);
    }
  }, [loadFailed]);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId) 
        : [...prev, deviceId]
    );
  };

  const handleCreateReturnRequests = () => {
    if (selectedDevices.length === 0) {
      toast.warning('Please select at least one device');
      return;
    }
    setOpenReturnDateDialog(true);
  };

  const submitReturnRequests = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const deviceId of selectedDevices) {
        try {
          await dataService.devices.requestDevice(
            deviceId,
            'return',
            {
              reason: 'Device returned to warehouse'
            }
          );
          
          // Update device status to pending immediately after successful request
          try {
            await dataService.devices.update(deviceId, {
              status: 'pending'
            });
          } catch (updateError) {
            console.error(`Error updating device ${deviceId} status to pending:`, updateError);
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error processing return for device ${deviceId}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} device(s) added to return queue`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to queue ${errorCount} device(s) for return`);
      }
      
      setSelectedDevices([]);
      setOpenReturnDateDialog(false);
      
      // Don't call refreshCallback here as it's handled by the parent
      loadReturnableDevices(); // Refresh this component's data
    } catch (error) {
      console.error('Error creating return requests:', error);
      toast.error('Failed to create return requests');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    devices,
    selectedDevices,
    isLoading,
    returnDate,
    openReturnDateDialog,
    isProcessing,
    loadReturnableDevices,
    handleDeviceSelect,
    handleCreateReturnRequests,
    submitReturnRequests,
    setReturnDate,
    setOpenReturnDateDialog
  };
};
