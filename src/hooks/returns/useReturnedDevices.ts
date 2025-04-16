
import { useCallback, useState } from 'react';
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
    loadDevices: loadReturnedDevicesFromApi 
  } = useDeviceLoader({
    statusFilter: device => device.status === 'returned',
    mockDataFilter: device => device.status === 'returned'
  });

  // Enhanced load function that updates local state
  const loadReturnedDevices = useCallback(async () => {
    await loadReturnedDevicesFromApi();
    setLocalReturnedDevices(prev => {
      // Only update if we have data and haven't already loaded
      if (loadedReturnedDevices.length > 0 || !hasInitialData) {
        setHasInitialData(true);
        return loadedReturnedDevices;
      }
      return prev;
    });
  }, [loadReturnedDevicesFromApi, loadedReturnedDevices, hasInitialData]);

  // Combine API loaded devices with locally managed ones
  const returnedDevices = hasInitialData ? localReturnedDevices : loadedReturnedDevices;

  return {
    returnedDevices,
    setReturnedDevices: setLocalReturnedDevices,
    isLoading,
    loadReturnedDevices
  };
};
