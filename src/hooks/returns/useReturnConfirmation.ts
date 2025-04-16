
import { useCallback } from 'react';
import { toast } from 'sonner';

export const useReturnConfirmation = (
  confirmReturns: () => Promise<void>,
  manualRefresh: () => void
) => {
  // Custom function to handle the return confirmation
  const handleReturnConfirmation = useCallback(async () => {
    try {
      await confirmReturns();
      
      // Immediate refresh after successful confirmation to update UI without delay
      console.log('Immediately refreshing after return confirmation');
      manualRefresh();
    } catch (error) {
      console.error('Error confirming returns:', error);
      toast.error('Failed to confirm returns');
    }
  }, [confirmReturns, manualRefresh]);

  return {
    handleReturnConfirmation
  };
};
