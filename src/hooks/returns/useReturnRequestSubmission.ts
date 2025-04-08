
import { useCallback } from 'react';

export const useReturnRequestSubmission = (
  submitReturnRequests: () => Promise<void>,
  manualRefresh: () => void
) => {
  // Custom function to handle the return request submission
  const handleReturnRequest = useCallback(async () => {
    await submitReturnRequests();
    
    // Wait a bit for the database to update
    setTimeout(() => {
      console.log('Refreshing after return request submission');
      manualRefresh();
    }, 500);
  }, [submitReturnRequests, manualRefresh]);

  return {
    handleReturnRequest
  };
};
