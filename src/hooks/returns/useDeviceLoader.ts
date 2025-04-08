
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
    // Don't try again if previous load failed and we're not forcing
    if (loadFailed && !force) return;
    
    // Don't reload if we already have data and we're not forcing
    if (dataLoadedRef.current && devices.length > 0 && !force) {
      console.log(`Devices already loaded with ${devices.length} items, skipping...`);
      return;
    }
    
    // Prevent concurrent loading
    if (isLoadingRef.current) {
      console.log('Already loading devices, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      const allDevices = await dataService.devices.getAll();
      
      // Apply filter if provided
      const filteredDevices = statusFilter 
        ? allDevices.filter(statusFilter)
        : allDevices;
      
      setDevices(filteredDevices);
      dataLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading devices:', error);
      
      // Use mock data as fallback
      const mockDevices = deviceStore.getDevices();
      const filteredMockDevices = mockDataFilter 
        ? mockDevices.filter(mockDataFilter) 
        : mockDevices;
      
      setDevices(filteredMockDevices);
      setLoadFailed(true);
      toast.error('Failed to load devices from server, using demo data');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [loadFailed, devices.length, statusFilter, mockDataFilter]);

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
