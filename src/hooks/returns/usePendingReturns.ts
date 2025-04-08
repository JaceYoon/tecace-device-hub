
import { useState, useCallback, useRef } from 'react';
import { DeviceRequest } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { requestStore } from '@/utils/data'; // Import mock data for fallback

export const usePendingReturns = () => {
  const [pendingReturnRequests, setPendingReturnRequests] = useState<DeviceRequest[]>([]);
  const [selectedPendingReturns, setSelectedPendingReturns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [loadFailed, setLoadFailed] = useState(false);
  const isLoadingRef = useRef(false);
  const processingCancelRef = useRef(false);

  const loadPendingReturns = useCallback(async () => {
    // Don't try again if previous load failed
    if (loadFailed) return;
    
    // Prevent concurrent loading
    if (isLoadingRef.current) {
      console.log('Already loading pending returns, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      // Load all requests and filter for return requests
      const requests = await dataService.devices.getAllRequests();
      
      const pendingReturns = requests.filter(
        req => req.type === 'return' && req.status === 'pending'
      );
      
      // Also fetch all devices to ensure we have the latest data
      try {
        await dataService.devices.getAll();
      } catch (error) {
        console.error('Error loading devices during pending returns:', error);
      }
      
      setPendingReturnRequests(pendingReturns);
    } catch (error) {
      console.error('Error loading pending returns:', error);
      
      // Use mock data as fallback
      const mockRequests = requestStore.getRequests().filter(
        req => req.type === 'return' && req.status === 'pending'
      );
      setPendingReturnRequests(mockRequests);
      
      setLoadFailed(true);
      // Don't show toast here as it'll create too many toasts with all hooks
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [loadFailed]);

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
      
      for (const requestId of selectedPendingReturns) {
        try {
          await dataService.devices.processRequest(requestId, 'approved');
          
          const request = pendingReturnRequests.find(r => r.id === requestId);
          if (request) {
            const dateOnly = new Date(returnDate);
            dateOnly.setHours(0, 0, 0, 0);
            
            try {
              await dataService.devices.update(request.deviceId, {
                status: 'returned',
                returnDate: dateOnly,
              });
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
      
      if (successCount > 0) {
        toast.success(`${successCount} device(s) returned successfully`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to return ${errorCount} device(s)`);
      }
      
      setSelectedPendingReturns([]);
      setConfirmText('');
      setOpenConfirmDialog(false);
      
      // Don't call refreshCallback here as it's handled by the parent
      await loadPendingReturns(); // Refresh this component's data
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
      
      // Don't trigger global refresh immediately - this helps prevent loops
      // Instead, we'll rely on the parent component's controlled refresh
      
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
    pendingReturnRequests,
    selectedPendingReturns,
    isLoading,
    isProcessing,
    openConfirmDialog,
    confirmText,
    returnDate,
    loadPendingReturns,
    handlePendingReturnSelect,
    handleConfirmReturns,
    confirmReturns,
    cancelReturnRequest,
    setOpenConfirmDialog,
    setConfirmText,
    setReturnDate
  };
};
