
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
  const refreshInProgressRef = useRef(false);
  const isRefreshCallbackRegistered = useRef(false);
  const refreshDebounceTimerRef = useRef<number | null>(null);
  
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

  // Debounced refresh function to prevent multiple refreshes
  const debouncedRefresh = useCallback(() => {
    // Clear any existing timer
    if (refreshDebounceTimerRef.current !== null) {
      window.clearTimeout(refreshDebounceTimerRef.current);
    }
    
    // Set a new timer
    refreshDebounceTimerRef.current = window.setTimeout(() => {
      if (!refreshInProgressRef.current) {
        console.log('Debounced refresh triggered');
        setRefreshTrigger(prev => prev + 1);
        refreshDebounceTimerRef.current = null;
      }
    }, 500); // 500ms debounce delay
  }, []);

  // Manual refresh function that doesn't cause loops
  const manualRefresh = useCallback(() => {
    if (!refreshInProgressRef.current) {
      console.log('Manual refresh triggered');
      setRefreshTrigger(prev => prev + 1);
    }
  }, []);

  // Custom function to handle the return request submission
  const handleReturnRequest = useCallback(async () => {
    await returnableDevices.submitReturnRequests();
    
    // Wait a bit for the database to update
    setTimeout(() => {
      console.log('Refreshing after return request submission');
      manualRefresh();
    }, 500);
  }, [returnableDevices, manualRefresh]);

  // Custom function to handle the return confirmation
  const handleReturnConfirmation = useCallback(async () => {
    await pendingReturns.confirmReturns();
    
    // Wait a bit for the database to update
    setTimeout(() => {
      console.log('Refreshing after return confirmation');
      manualRefresh();
    }, 500);
  }, [pendingReturns, manualRefresh]);

  // Load all data at once function
  const loadAllData = useCallback(async () => {
    // Prevent multiple loading attempts
    if (initialLoadRef.current || refreshInProgressRef.current) {
      console.log('Initial load already attempted or refresh in progress, skipping...');
      return;
    }
    
    refreshInProgressRef.current = true;
    
    // Check server first
    const isServerAvailable = await checkServerAvailability();
    
    // Only attempt to load data if server is available
    if (isServerAvailable) {
      try {
        console.log('Loading all data...');
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
    refreshInProgressRef.current = false;
  }, [
    returnableDevices, 
    pendingReturns, 
    returnedDevices,
    checkServerAvailability
  ]);

  // Custom function to handle the return cancellation
  const handleReturnCancellation = useCallback(async (requestId: string) => {
    await pendingReturns.cancelReturnRequest(requestId);
    
    // Use a longer timeout before triggering refresh to avoid loops
    setTimeout(() => {
      console.log('Refreshing after return cancellation');
      manualRefresh();
    }, 800); // Longer timeout to ensure all DB operations complete
  }, [pendingReturns, manualRefresh]);

  // Register for global refresh events - only setup once
  useEffect(() => {
    if (isRefreshCallbackRegistered.current) {
      return; // Skip if already registered
    }
    
    const unregister = dataService.registerRefreshCallback(() => {
      // Use debounced refresh to prevent loop
      debouncedRefresh();
    });
    
    isRefreshCallbackRegistered.current = true;
    
    return () => {
      if (unregister) unregister();
      isRefreshCallbackRegistered.current = false;
      
      // Clear any pending debounce timer on unmount
      if (refreshDebounceTimerRef.current !== null) {
        window.clearTimeout(refreshDebounceTimerRef.current);
      }
    };
  }, [debouncedRefresh]);

  // Handle refreshTrigger changes with debounce
  useEffect(() => {
    if (refreshTrigger > 0 && initialLoadRef.current) {
      // Prevent multiple concurrent refreshes
      if (refreshInProgressRef.current) {
        console.log('Refresh already in progress, skipping...');
        return;
      }
      
      console.log('Refresh triggered, reloading data...');
      refreshInProgressRef.current = true;
      
      // Stagger the reloads to prevent race conditions
      const loadSequentially = async () => {
        try {
          // Load returnable devices first
          await returnableDevices.loadReturnableDevices();
          
          // Then load pending returns
          await pendingReturns.loadPendingReturns();
          
          // Finally load returned devices
          await returnedDevices.loadReturnedDevices();
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          // Reset refresh in progress flag after a short delay to prevent immediate re-trigger
          setTimeout(() => {
            refreshInProgressRef.current = false;
          }, 300);
        }
      };
      
      loadSequentially();
    }
  }, [refreshTrigger, returnableDevices, pendingReturns, returnedDevices]);

  // Run initial data load once on component mount
  useEffect(() => {
    // Only load data if not already loaded
    if (!initialLoadRef.current && !refreshInProgressRef.current) {
      console.log('Initial load starting...');
      loadAllData();
    }
  }, [loadAllData]);

  // Combine and return all the functionality with the modified functions
  return {
    // From returnableDevices hook
    devices: returnableDevices.devices,
    selectedDevices: returnableDevices.selectedDevices,
    handleDeviceSelect: returnableDevices.handleDeviceSelect,
    handleCreateReturnRequests: returnableDevices.handleCreateReturnRequests,
    submitReturnRequests: handleReturnRequest, // Use our custom handler instead
    
    // From pendingReturns hook
    pendingReturnRequests: pendingReturns.pendingReturnRequests,
    selectedPendingReturns: pendingReturns.selectedPendingReturns,
    openConfirmDialog: pendingReturns.openConfirmDialog,
    confirmText: pendingReturns.confirmText,
    handlePendingReturnSelect: pendingReturns.handlePendingReturnSelect,
    handleConfirmReturns: pendingReturns.handleConfirmReturns,
    confirmReturns: handleReturnConfirmation, // Use our custom handler instead
    cancelReturnRequest: handleReturnCancellation, // Use custom handler instead
    
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
    loadData: manualRefresh // Use our manual refresh function
  };
};
