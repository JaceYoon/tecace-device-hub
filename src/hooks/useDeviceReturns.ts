
import { useEffect } from 'react';
import { useReturnableDevices } from './returns/useReturnableDevices';
import { usePendingReturns } from './returns/usePendingReturns';
import { useReturnedDevices } from './returns/useReturnedDevices';
import { useDeviceInfo } from './returns/useDeviceInfo';
import { useAuthorization } from './returns/useAuthorization';
import { useDataRefresh } from './returns/useDataRefresh';
import { useServerAvailability } from './returns/useServerAvailability';
import { useReturnRequestSubmission } from './returns/useReturnRequestSubmission';
import { useReturnConfirmation } from './returns/useReturnConfirmation';
import { useReturnCancellation } from './returns/useReturnCancellation';
import { useDataLoading, DataLoader } from './returns/useDataLoading';

export const useDeviceReturns = () => {
  const { isAdmin } = useAuthorization();
  
  // Initialize data refresh utilities
  const { 
    refreshTrigger, 
    refreshInProgressRef, 
    manualRefresh, 
    debouncedRefresh, 
    registerRefreshCallback 
  } = useDataRefresh();
  
  // Server availability check
  const { checkServerAvailability } = useServerAvailability();
  
  // Initialize hooks
  const returnableDevices = useReturnableDevices();
  const pendingReturns = usePendingReturns();
  const returnedDevices = useReturnedDevices();
  
  // Initialize device info hook with correct types
  // Since pendingReturns.pendingReturnRequests is DeviceRequest[], this matches the expected type
  const { getDeviceData } = useDeviceInfo(
    returnableDevices.devices,
    pendingReturns.pendingReturnRequests
  );

  // Custom handlers
  const { handleReturnRequest } = useReturnRequestSubmission(
    returnableDevices.submitReturnRequests,
    manualRefresh
  );
  
  const { handleReturnConfirmation } = useReturnConfirmation(
    pendingReturns.confirmReturns,
    manualRefresh
  );
  
  const { handleReturnCancellation } = useReturnCancellation(
    pendingReturns.cancelReturnRequest,
    manualRefresh
  );

  // Setup data loaders for useDataLoading
  const dataLoaders: DataLoader[] = [
    { loadData: returnableDevices.loadReturnableDevices },
    { loadData: pendingReturns.loadPendingReturns },
    { loadData: returnedDevices.loadReturnedDevices }
  ];
  
  // Initialize data loading utilities
  const { loadAllData, refreshData, initialLoadRef } = useDataLoading(
    checkServerAvailability,
    dataLoaders
  );

  // Register for global refresh events
  useEffect(() => {
    const unregister = registerRefreshCallback();
    return unregister;
  }, [registerRefreshCallback]);

  // Handle refreshTrigger changes with debounce
  useEffect(() => {
    if (refreshTrigger > 0 && initialLoadRef.current) {
      refreshData(refreshInProgressRef);
    }
  }, [refreshTrigger, refreshData, refreshInProgressRef, initialLoadRef]);

  // Run initial data load once on component mount
  useEffect(() => {
    // Only load data if not already loaded
    if (!initialLoadRef.current && !refreshInProgressRef.current) {
      console.log('Initial load starting...');
      loadAllData();
    }
  }, [loadAllData, initialLoadRef, refreshInProgressRef]);

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
    loadData: manualRefresh
  };
};
