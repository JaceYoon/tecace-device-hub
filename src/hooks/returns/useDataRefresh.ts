
import { useCallback, useRef, useState } from 'react';
import { dataService } from '@/services/data.service';

export const useDataRefresh = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshInProgressRef = useRef(false);
  const isRefreshCallbackRegistered = useRef(false);
  const refreshDebounceTimerRef = useRef<number | null>(null);

  // Debounced refresh function to prevent multiple refreshes
  const debouncedRefresh = useCallback(() => {
    // Clear any existing timer
    if (refreshDebounceTimerRef.current !== null) {
      window.clearTimeout(refreshDebounceTimerRef.current);
    }
    
    // Set a new timer
    refreshDebounceTimerRef.current = window.setTimeout(() => {
      if (!refreshInProgressRef.current) {
        console.log('Debounced refresh triggered');
        setRefreshTrigger(prev => prev + 1);
        refreshDebounceTimerRef.current = null;
      }
    }, 500); // 500ms debounce delay
  }, []);

  // Manual refresh function that doesn't cause loops
  const manualRefresh = useCallback(() => {
    if (!refreshInProgressRef.current) {
      console.log('Manual refresh triggered');
      setRefreshTrigger(prev => prev + 1);
    }
  }, []);

  // Register for global refresh events
  const registerRefreshCallback = useCallback(() => {
    if (isRefreshCallbackRegistered.current) {
      return () => {}; // Skip if already registered and return no-op
    }
    
    const unregister = dataService.registerRefreshCallback(() => {
      // Use debounced refresh to prevent loop
      debouncedRefresh();
    });
    
    isRefreshCallbackRegistered.current = true;
    
    return () => {
      if (unregister) unregister();
      isRefreshCallbackRegistered.current = false;
      
      // Clear any pending debounce timer on unmount
      if (refreshDebounceTimerRef.current !== null) {
        window.clearTimeout(refreshDebounceTimerRef.current);
      }
    };
  }, [debouncedRefresh]);

  return {
    refreshTrigger,
    refreshInProgressRef,
    manualRefresh,
    debouncedRefresh,
    registerRefreshCallback
  };
};
