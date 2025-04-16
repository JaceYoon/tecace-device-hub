
import { useState, useCallback, useRef } from 'react';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { deviceStore } from '@/utils/data'; // Import mock data for fallback

export interface DeviceLoaderOptions {
  statusFilter?: (device: Device) => boolean;
  initialLoading?: boolean;
  mockDataFilter?: (device: Device) => boolean;
}

export function useDeviceLoader({ 
  statusFilter, 
  initialLoading = false,
  mockDataFilter
}: DeviceLoaderOptions) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadFailed, setLoadFailed] = useState(false);
  const isLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  const loadDevices = useCallback(async (force = false) => {
    // When forcing, always reload regardless of existing data
    if (force) {
      console.log('Force reloading devices from API...');
    } else {
      // Don't reload if we already have data and we're not forcing
      if (dataLoadedRef.current && devices.length > 0) {
        console.log(`Devices already loaded with ${devices.length} items, skipping...`);
        return;
      }
      
      // Don't try again if previous load failed and we're not forcing
      if (loadFailed && !force) {
        console.log('Previous load failed, not retrying without force flag');
        return;
      }
    }
    
    // Prevent concurrent loading
    if (isLoadingRef.current) {
      console.log('Already loading devices, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      console.log('Fetching devices from API...');
      const allDevices = await dataService.devices.getAll();
      console.log(`Received ${allDevices.length} devices from API`);
      
      // Apply filter if provided
      const filteredDevices = statusFilter 
        ? allDevices.filter(statusFilter)
        : allDevices;
      
      console.log(`After filtering, ${filteredDevices.length} devices match criteria`);
      setDevices(filteredDevices);
      dataLoadedRef.current = true;
      setLoadFailed(false); // Reset the failure flag on success
    } catch (error) {
      console.error('Error loading devices:', error);
      
      // Use mock data as fallback
      const mockDevices = deviceStore.getDevices();
      const filteredMockDevices = mockDataFilter 
        ? mockDevices.filter(mockDataFilter) 
        : mockDevices;
      
      console.log(`Using ${filteredMockDevices.length} mock devices as fallback`);
      setDevices(filteredMockDevices);
      setLoadFailed(true);
      toast.error('Failed to load devices from server, using demo data');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [statusFilter, mockDataFilter, devices.length, loadFailed]);

  return {
    devices,
    isLoading,
    loadFailed,
    loadDevices,
    isLoadingRef,
    dataLoadedRef,
    setDevices
  };
}
