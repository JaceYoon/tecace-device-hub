
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Device } from '@/types';

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
      
      // Double check refresh after a small delay to ensure data is loaded
      setTimeout(() => {
        console.log('Additional refresh to ensure data is loaded');
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
