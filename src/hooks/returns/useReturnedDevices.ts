
import { useCallback, useState, useEffect } from 'react';
import { useDeviceLoader } from './useDeviceLoader';
import { Device } from '@/types';

export const useReturnedDevices = () => {
  // Use local state for returned devices for immediate updates
  const [localReturnedDevices, setLocalReturnedDevices] = useState<Device[]>([]);
  const [hasInitialData, setHasInitialData] = useState(false);
  
  // Use the shared device loader with returned devices filter
  const { 
    devices: loadedReturnedDevices, 
    isLoading, 
    loadDevices: loadReturnedDevicesFromApi,
    dataLoadedRef
  } = useDeviceLoader({
    statusFilter: device => device.status === 'returned',
    mockDataFilter: device => device.status === 'returned'
  });

  // Effect to sync local state with loaded data
  useEffect(() => {
    if (loadedReturnedDevices.length > 0) {
      console.log('Syncing returned devices from API to local state:', loadedReturnedDevices.length);
      setLocalReturnedDevices(loadedReturnedDevices);
      setHasInitialData(true);
    }
  }, [loadedReturnedDevices]);

  // Enhanced load function that updates local state
  const loadReturnedDevices = useCallback(async (force = false) => {
    console.log('Loading returned devices, force:', force);
    await loadReturnedDevicesFromApi(force);
    
    // Always update local state after loading from API
    console.log('Setting returned devices from API:', loadedReturnedDevices.length);
    setLocalReturnedDevices(loadedReturnedDevices);
    
    if (loadedReturnedDevices.length > 0 || force) {
      setHasInitialData(true);
    }
  }, [loadReturnedDevicesFromApi, loadedReturnedDevices]);

  // Combine API loaded devices with locally managed ones
  const returnedDevices = hasInitialData ? localReturnedDevices : loadedReturnedDevices;

  return {
    returnedDevices,
    setReturnedDevices: setLocalReturnedDevices,
    isLoading,
    loadReturnedDevices,
    hasInitialData
  };
};
