
import { useCallback, useEffect } from 'react';
import { useReturnableDevices } from './returns/useReturnableDevices';
import { usePendingReturns } from './returns/usePendingReturns';
import { useReturnedDevices } from './returns/useReturnedDevices';
import { useDeviceInfo } from './returns/useDeviceInfo';
import { useAuthorization } from './returns/useAuthorization';

export const useDeviceReturns = () => {
  const { isAdmin } = useAuthorization();
  
  // Initialize hooks
  const returnableDevices = useReturnableDevices();
  const pendingReturns = usePendingReturns();
  const returnedDevices = useReturnedDevices();
  const { getDeviceData } = useDeviceInfo(
    returnableDevices.devices, 
    returnedDevices.returnedDevices
  );

  // Load all data at once function
  const loadAllData = useCallback(() => {
    returnableDevices.loadReturnableDevices();
    pendingReturns.loadPendingReturns();
    returnedDevices.loadReturnedDevices();
  }, [returnableDevices, pendingReturns, returnedDevices]);

  // Run initial data load using useEffect
  useEffect(() => {
    loadAllData();
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
