
import { usePendingReturnRequests } from './usePendingReturnRequests';
import { useReturnProcessing } from './useReturnProcessing';
import { Device } from '@/types';
import { useState } from 'react';

export const usePendingReturns = (returnedDevices?: Device[], setReturnedDevices?: React.Dispatch<React.SetStateAction<Device[]>>) => {
  const {
    pendingReturnRequests,
    isLoading,
    loadPendingReturns,
    setPendingReturnRequests
  } = usePendingReturnRequests();

  const {
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
  } = useReturnProcessing(pendingReturnRequests, setPendingReturnRequests, setReturnedDevices);

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
