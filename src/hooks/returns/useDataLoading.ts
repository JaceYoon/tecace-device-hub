
import { useCallback, useRef, useState } from 'react';

export interface DataLoader {
  loadData: () => Promise<void>;
}

export const useDataLoading = (
  checkServerAvailability: () => Promise<boolean>,
  dataLoaders: DataLoader[]
) => {
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const initialLoadRef = useRef(false);
  const refreshInProgressRef = useRef(false);

  // Load all data at once function
  const loadAllData = useCallback(async () => {
    // Prevent multiple loading attempts
    if (initialLoadRef.current || refreshInProgressRef.current) {
      console.log('Initial load already attempted or refresh in progress, skipping...');
      return;
    }
    
    refreshInProgressRef.current = true;
    
    // Check server first
    const isServerAvailable = await checkServerAvailability();
    
    // Only attempt to load data if server is available
    if (isServerAvailable) {
      try {
        console.log('Loading all data...');
        const promises = dataLoaders.map(loader => loader.loadData());
        await Promise.all(promises);
      } catch (error) {
        console.error('Error loading device data:', error);
      }
    }
    
    initialLoadRef.current = true;
    setInitialLoadAttempted(true);
    refreshInProgressRef.current = false;
  }, [checkServerAvailability, dataLoaders]);

  // Handle data refresh
  const refreshData = useCallback(async (refreshInProgressRef: React.MutableRefObject<boolean>) => {
    // Prevent multiple concurrent refreshes
    if (refreshInProgressRef.current) {
      console.log('Refresh already in progress, skipping...');
      return;
    }

    console.log('Refresh triggered, reloading data...');
    refreshInProgressRef.current = true;

    // Stagger the reloads to prevent race conditions
    const loadSequentially = async () => {
      try {
        // Load data loaders sequentially
        for (const loader of dataLoaders) {
          await loader.loadData();
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        // Reset refresh in progress flag after a short delay to prevent immediate re-trigger
        setTimeout(() => {
          refreshInProgressRef.current = false;
        }, 300);
      }
    };

    await loadSequentially();
  }, [dataLoaders]);

  return {
    initialLoadAttempted,
    initialLoadRef,
    loadAllData,
    refreshData
  };
};
