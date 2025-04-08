
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
      
      // Wait a bit for the database to update
      setTimeout(() => {
        console.log('Refreshing after return confirmation');
        manualRefresh();
      }, 500);
    } catch (error) {
      console.error('Error confirming returns:', error);
      toast.error('Failed to confirm returns');
    }
  }, [confirmReturns, manualRefresh]);

  return {
    handleReturnConfirmation
  };
};
