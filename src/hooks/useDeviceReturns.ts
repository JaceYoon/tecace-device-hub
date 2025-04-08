
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
    // Prevent multiple loading attempts
    if (initialLoadRef.current) {
      console.log('Initial load already attempted, skipping...');
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
    
    initialLoadRef.current = true;
    setInitialLoadAttempted(true);
  }, [
    returnableDevices, 
    pendingReturns, 
    returnedDevices,
    checkServerAvailability
  ]);

  // Register for global refresh events - only setup once
  useEffect(() => {
    const unregister = dataService.registerRefreshCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    
    return () => {
      if (unregister) unregister();
    };
  }, []);

  // Handle refreshTrigger changes (avoid infinite loop by checking initialLoadRef)
  useEffect(() => {
    if (refreshTrigger > 0 && initialLoadRef.current) {
      console.log('Refresh triggered, reloading data...');
      // Don't reset initialLoadRef here - we're just refreshing
      Promise.all([
        returnableDevices.loadReturnableDevices(),
        pendingReturns.loadPendingReturns(),
        returnedDevices.loadReturnedDevices()
      ]).catch(error => {
        console.error('Error refreshing data:', error);
      });
    }
  }, [refreshTrigger, returnableDevices, pendingReturns, returnedDevices]);

  // Run initial data load once on component mount
  useEffect(() => {
    // Only load data if not already loaded
    if (!initialLoadRef.current) {
      console.log('Initial load starting...');
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
