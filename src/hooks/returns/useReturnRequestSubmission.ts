
import { useCallback } from 'react';
import { toast } from 'sonner';

export const useReturnRequestSubmission = (
  submitReturnRequests: () => Promise<void>,
  manualRefresh: () => void
) => {
  // Custom function to handle the return request submission
  const handleReturnRequest = useCallback(async () => {
    try {
      await submitReturnRequests();
      
      // Wait a bit for the database to update
      setTimeout(() => {
        console.log('Refreshing after return request submission');
        manualRefresh();
      }, 500);
    } catch (error) {
      console.error('Error submitting return requests:', error);
      toast.error('Failed to submit return requests');
    }
  }, [submitReturnRequests, manualRefresh]);

  return {
    handleReturnRequest
  };
};
