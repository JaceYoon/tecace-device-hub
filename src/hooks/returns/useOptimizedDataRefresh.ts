
import { useCallback, useRef, useState } from 'react';
import { debounce } from '@/utils/debounce';

export const useOptimizedDataRefresh = (
  refreshInterval = 5000, // Default refresh interval
  debounceTime = 500     // Default debounce time
) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshInProgressRef = useRef(false);
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshCallbacksRef = useRef<(() => void)[]>([]);

  // Debounced refresh function
  const debouncedRefresh = useCallback(
    debounce(() => {
      if (!refreshInProgressRef.current) {
        setRefreshTrigger(prev => prev + 1);
      }
    }, debounceTime),
    [debounceTime]
  );

  // Manual refresh with safeguards
  const manualRefresh = useCallback(() => {
    // Clear any pending refresh
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Check if refresh already in progress
    if (refreshInProgressRef.current) {
      console.log('Refresh already in progress, scheduling for later');
      // Schedule a refresh for later
      refreshTimeoutRef.current = window.setTimeout(() => {
        manualRefresh();
      }, 1000);
      return;
    }

    // Trigger refresh
    setRefreshTrigger(prev => prev + 1);

    // Call all registered callbacks
    const callbacks = refreshCallbacksRef.current;
    if (callbacks.length > 0) {
      // Execute callbacks in batches to prevent UI blocking
      const batchSize = 3;
      
      for (let i = 0; i < callbacks.length; i += batchSize) {
        const batch = callbacks.slice(i, i + batchSize);
        
        setTimeout(() => {
          batch.forEach(callback => {
            try {
              callback();
            } catch (error) {
              console.error('Error in refresh callback:', error);
            }
          });
        }, 0); // Use setTimeout to batch callbacks
      }
    }
  }, []);

  // Register a callback to be called on refresh
  const registerRefreshCallback = useCallback((callback?: () => void) => {
    if (!callback) {
      // If no callback provided, return the unregister function
      return () => {};
    }
    
    // Add callback to the list
    refreshCallbacksRef.current.push(callback);
    
    // Return unregister function
    return () => {
      refreshCallbacksRef.current = refreshCallbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);

  return {
    refreshTrigger,
    refreshInProgressRef,
    manualRefresh,
    debouncedRefresh,
    registerRefreshCallback
  };
};
