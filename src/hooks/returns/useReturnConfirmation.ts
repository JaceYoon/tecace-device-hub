
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Device } from '@/types';

export const useReturnConfirmation = (
  confirmReturns: () => Promise<void>,
  manualRefresh: () => void
) => {
  // Enhanced function to handle the return confirmation with better state synchronization
  const handleReturnConfirmation = useCallback(async () => {
    try {
      // Execute the confirmation logic first
      await confirmReturns();
      
      // Log confirmation was successful
      console.log('Return confirmation completed successfully');
      
      // Perform immediate refresh to update UI without delay
      console.log('Executing immediate refresh after return confirmation');
      manualRefresh();
      
      // Schedule a backup refresh after a short delay to ensure data consistency
      // This helps when the server needs a moment to process the changes
      setTimeout(() => {
        console.log('Executing delayed backup refresh to ensure data consistency');
        manualRefresh();
      }, 300);
    } catch (error) {
      console.error('Error confirming returns:', error);
      toast.error('Failed to confirm returns');
    }
  }, [confirmReturns, manualRefresh]);

  return {
    handleReturnConfirmation
  };
};
