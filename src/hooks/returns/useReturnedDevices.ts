
import { useCallback } from 'react';
import { useDeviceLoader } from './useDeviceLoader';

export const useReturnedDevices = () => {
  // Use the shared device loader with returned devices filter
  const { 
    devices: returnedDevices, 
    isLoading, 
    loadDevices: loadReturnedDevices 
  } = useDeviceLoader({
    statusFilter: device => device.status === 'returned',
    mockDataFilter: device => device.status === 'returned'
  });

  return {
    returnedDevices,
    isLoading,
    loadReturnedDevices
  };
};
