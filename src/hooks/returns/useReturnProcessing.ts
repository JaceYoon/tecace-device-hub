
import { useState, useRef } from 'react';
import { DeviceRequest, Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export const useReturnProcessing = (
  pendingReturnRequests: DeviceRequest[],
  setPendingReturnRequests: React.Dispatch<React.SetStateAction<DeviceRequest[]>>,
  setReturnedDevices?: React.Dispatch<React.SetStateAction<Device[]>>
) => {
  const [selectedPendingReturns, setSelectedPendingReturns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const processingCancelRef = useRef(false);

  const handlePendingReturnSelect = (requestId: string) => {
    setSelectedPendingReturns(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId) 
        : [...prev, requestId]
    );
  };

  const handleConfirmReturns = () => {
    if (selectedPendingReturns.length === 0) {
      toast.warning('Please select at least one pending return');
      return;
    }
    setOpenConfirmDialog(true);
  };

  const confirmReturns = async () => {
    if (confirmText !== 'confirm') {
      toast.error('Please type "confirm" to proceed');
      return;
    }

    setIsProcessing(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Store processed devices to update both states
      const processedDevices: Device[] = [];
      
      for (const requestId of selectedPendingReturns) {
        try {
          await dataService.devices.processRequest(requestId, 'approved');
          
          const request = pendingReturnRequests.find(r => r.id === requestId);
          if (request) {
            const dateOnly = new Date(returnDate);
            dateOnly.setHours(0, 0, 0, 0);
            
            try {
              // Update the device status
              const updatedDevice = await dataService.devices.update(request.deviceId, {
                status: 'returned',
                returnDate: dateOnly,
              });
              
              // If we have the returned devices state setter and got back a device, add it
              if (updatedDevice && setReturnedDevices) {
                processedDevices.push(updatedDevice);
              }
            } catch (error) {
              console.error(`Error updating status for device ${request.deviceId}:`, error);
            }
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error confirming return for request ${requestId}:`, error);
        }
      }
      
      // Immediately update UI states for better UX
      if (processedDevices.length > 0 && setReturnedDevices) {
        setReturnedDevices(prev => {
          // Create a map of existing devices by ID for quick lookup
          const deviceMap = new Map(prev.map(device => [device.id, device]));
          
          // Add or update processed devices
          for (const device of processedDevices) {
            deviceMap.set(device.id, device);
          }
          
          // Convert map back to array
          return Array.from(deviceMap.values());
        });
      }
      
      // Remove processed requests from pending list
      setPendingReturnRequests(prev => 
        prev.filter(r => !selectedPendingReturns.includes(r.id))
      );
      
      if (successCount > 0) {
        toast.success(`${successCount} device(s) returned successfully`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to return ${errorCount} device(s)`);
      }
      
      setSelectedPendingReturns([]);
      setConfirmText('');
      setOpenConfirmDialog(false);
    } catch (error) {
      console.error('Error confirming returns:', error);
      toast.error('Failed to process returns');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelReturnRequest = async (requestId: string) => {
    // Prevent concurrent cancellations of the same request
    if (processingCancelRef.current) {
      console.log('Already processing a cancellation, please wait...');
      return;
    }
    
    processingCancelRef.current = true;
    setIsProcessing(true);
    
    try {
      const request = pendingReturnRequests.find(r => r.id === requestId);
      const deviceId = request?.deviceId;
      
      await dataService.devices.cancelRequest(requestId);
      
      if (deviceId) {
        try {
          await dataService.devices.update(deviceId, {
            status: 'available'
          });
        } catch (error) {
          console.error(`Error updating device ${deviceId} status:`, error);
        }
      }
      
      toast.success('Return request cancelled');
      
      // Important: Update local state immediately to prevent immediate re-fetching
      setPendingReturnRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Remove from selected if selected
      setSelectedPendingReturns(prev => prev.filter(id => id !== requestId));
    } catch (error) {
      console.error('Error cancelling return request:', error);
      toast.error('Failed to cancel return request');
    } finally {
      setIsProcessing(false);
      
      // Use a timeout to prevent immediate re-processing
      setTimeout(() => {
        processingCancelRef.current = false;
      }, 500);
    }
  };

  return {
    selectedPendingReturns,
    isProcessing,
    openConfirmDialog,
    confirmText,
    returnDate,
    handlePendingReturnSelect,
    handleConfirmReturns,
    confirmReturns,
    cancelReturnRequest,
    setOpenConfirmDialog,
    setConfirmText,
    setReturnDate
  };
};
