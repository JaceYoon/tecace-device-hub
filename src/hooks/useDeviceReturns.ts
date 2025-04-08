
import { useCallback, useEffect, useState, useRef } from 'react';
import { useReturnableDevices } from './returns/useReturnableDevices';
import { usePendingReturns } from './returns/usePendingReturns';
import { useReturnedDevices } from './returns/useReturnedDevices';
import { useDeviceInfo } from './returns/useDeviceInfo';
import { useAuthorization } from './returns/useAuthorization';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

// Add a flag to check if the server is available
let serverChecked = false;
let serverAvailable = false;

export const useDeviceReturns = () => {
  const { isAdmin } = useAuthorization();
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const initialLoadRef = useRef(false);
  
  // Initialize hooks
  const returnableDevices = useReturnableDevices();
  const pendingReturns = usePendingReturns();
  const returnedDevices = useReturnedDevices();
  const { getDeviceData } = useDeviceInfo(
    returnableDevices.devices, 
    returnedDevices.returnedDevices
  );

  // Check if the server is available
  const checkServerAvailability = useCallback(async () => {
    if (serverChecked) return serverAvailable;
    
    try {
      // Try to ping the server
      await dataService.get('/auth/check');
      serverAvailable = true;
    } catch (error) {
      console.error('Server connection failed:', error);
      serverAvailable = false;
      toast.error('Unable to connect to the server. Using mock data.');
    } finally {
      serverChecked = true;
    }
    
    return serverAvailable;
  }, []);

  // Load all data at once function
  const loadAllData = useCallback(async () => {
    // Don't try to load data if we've already attempted and the server isn't available
    if (initialLoadAttempted && !serverAvailable) {
      return;
    }
    
    // Check server first
    const isServerAvailable = await checkServerAvailability();
    
    // Only attempt to load data if server is available
    if (isServerAvailable) {
      try {
        await Promise.all([
          returnableDevices.loadReturnableDevices(),
          pendingReturns.loadPendingReturns(),
          returnedDevices.loadReturnedDevices()
        ]);
      } catch (error) {
        console.error('Error loading device data:', error);
      }
    }
    
    setInitialLoadAttempted(true);
  }, [
    returnableDevices, 
    pendingReturns, 
    returnedDevices, 
    initialLoadAttempted, 
    checkServerAvailability
  ]);

  // Register for global refresh events
  useEffect(() => {
    const unregister = dataService.registerRefreshCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    
    return () => {
      if (unregister) unregister();
    };
  }, []);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (initialLoadAttempted) {
      loadAllData();
    }
  }, [loadAllData, initialLoadAttempted, refreshTrigger]);

  // Run initial data load using useEffect with a ref to prevent multiple calls
  useEffect(() => {
    // Only load data once using a ref to track if we've already loaded
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadAllData();
    }
  }, [loadAllData]);

  // Combine and return all the functionality
  return {
    // From returnableDevices hook
    devices: returnableDevices.devices,
    selectedDevices: returnableDevices.selectedDevices,
    handleDeviceSelect: returnableDevices.handleDeviceSelect,
    handleCreateReturnRequests: returnableDevices.handleCreateReturnRequests,
    submitReturnRequests: returnableDevices.submitReturnRequests,
    
    // From pendingReturns hook
    pendingReturnRequests: pendingReturns.pendingReturnRequests,
    selectedPendingReturns: pendingReturns.selectedPendingReturns,
    openConfirmDialog: pendingReturns.openConfirmDialog,
    confirmText: pendingReturns.confirmText,
    handlePendingReturnSelect: pendingReturns.handlePendingReturnSelect,
    handleConfirmReturns: pendingReturns.handleConfirmReturns,
    confirmReturns: pendingReturns.confirmReturns,
    cancelReturnRequest: pendingReturns.cancelReturnRequest,
    
    // From returnedDevices hook
    returnedDevices: returnedDevices.returnedDevices,
    
    // From useDeviceInfo hook
    getDeviceData,
    
    // Shared state
    returnDate: pendingReturns.returnDate,
    setReturnDate: pendingReturns.setReturnDate,
    openReturnDateDialog: returnableDevices.openReturnDateDialog,
    setOpenReturnDateDialog: returnableDevices.setOpenReturnDateDialog,
    setOpenConfirmDialog: pendingReturns.setOpenConfirmDialog,
    setConfirmText: pendingReturns.setConfirmText,
    
    // Status flags
    isProcessing: returnableDevices.isProcessing || pendingReturns.isProcessing,
    isLoading: returnableDevices.isLoading || pendingReturns.isLoading || returnedDevices.isLoading,
    isAdmin,
    
    // Data refresh
    loadData: loadAllData
  };
};
