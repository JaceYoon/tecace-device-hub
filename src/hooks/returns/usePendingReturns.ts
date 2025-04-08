
import { usePendingReturnRequests } from './usePendingReturnRequests';
import { useReturnProcessing } from './useReturnProcessing';

export const usePendingReturns = () => {
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
  } = useReturnProcessing(pendingReturnRequests, setPendingReturnRequests);

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
