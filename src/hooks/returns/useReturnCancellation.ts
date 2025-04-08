
import { useCallback } from 'react';

export const useReturnCancellation = (
  cancelReturnRequest: (requestId: string) => Promise<void>,
  manualRefresh: () => void
) => {
  // Custom function to handle the return cancellation
  const handleReturnCancellation = useCallback(async (requestId: string) => {
    await cancelReturnRequest(requestId);
    
    // Use a longer timeout before triggering refresh to avoid loops
    setTimeout(() => {
      console.log('Refreshing after return cancellation');
      manualRefresh();
    }, 800); // Longer timeout to ensure all DB operations complete
  }, [cancelReturnRequest, manualRefresh]);

  return {
    handleReturnCancellation
  };
};
