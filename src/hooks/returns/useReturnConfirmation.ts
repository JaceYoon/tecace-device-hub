
import { useCallback } from 'react';

export const useReturnConfirmation = (
  confirmReturns: () => Promise<void>,
  manualRefresh: () => void
) => {
  // Custom function to handle the return confirmation
  const handleReturnConfirmation = useCallback(async () => {
    await confirmReturns();
    
    // Wait a bit for the database to update
    setTimeout(() => {
      console.log('Refreshing after return confirmation');
      manualRefresh();
    }, 500);
  }, [confirmReturns, manualRefresh]);

  return {
    handleReturnConfirmation
  };
};
