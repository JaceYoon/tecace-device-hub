import { useState, useCallback, useRef } from 'react';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { useDeviceLoader } from './useDeviceLoader';

export const useReturnableDevices = () => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [openReturnDateDialog, setOpenReturnDateDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false); // Use ref to prevent concurrent processing

  // Use the shared device loader with returnable devices filter
  const { 
    devices, 
    isLoading, 
    loadDevices: loadReturnableDevices 
  } = useDeviceLoader({
    statusFilter: device => device.status === 'available' || device.status === 'dead',
    mockDataFilter: device => device.status === 'available' || device.status === 'dead'
  });

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
    // Prevent concurrent submissions
    if (processingRef.current) {
      console.log('Already processing return requests, please wait...');
      return;
    }
    
    processingRef.current = true;
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
      
      // Update local state immediately
      setDevices(prev => prev.filter(device => !selectedDevices.includes(device.id)));
      setSelectedDevices([]);
      setOpenReturnDateDialog(false);
    } catch (error) {
      console.error('Error creating return requests:', error);
      toast.error('Failed to create return requests');
    } finally {
      // Add a small delay before releasing the processing lock
      setTimeout(() => {
        setIsProcessing(false);
        processingRef.current = false;
      }, 500);
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
