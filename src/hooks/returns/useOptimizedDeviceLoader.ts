
import { useState, useCallback, useRef, useMemo } from 'react';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';

interface DeviceLoaderOptions {
  statusFilter?: (device: Device) => boolean;
  mockDataFilter?: (device: Device) => boolean;
  sortBy?: keyof Device | ((a: Device, b: Device) => number);
}

export const useOptimizedDeviceLoader = (options?: DeviceLoaderOptions) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadingRef = useRef(false);
  const lastLoadTime = useRef<number>(0);
  const deviceCache = useRef<Map<string, Device>>(new Map());

  // Apply filter to devices
  const filteredDevices = useMemo(() => {
    if (!options?.statusFilter) return devices;
    return devices.filter(options.statusFilter);
  }, [devices, options?.statusFilter]);

  // Sort devices if needed
  const sortedDevices = useMemo(() => {
    if (!options?.sortBy) return filteredDevices;
    
    return [...filteredDevices].sort((a, b) => {
      if (typeof options.sortBy === 'function') {
        return options.sortBy(a, b);
      }
      
      const aVal = a[options.sortBy as keyof Device];
      const bVal = b[options.sortBy as keyof Device];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }
      
      return 0;
    });
  }, [filteredDevices, options?.sortBy]);

  // Get a device by ID with caching
  const getDevice = useCallback((id: string): Device | null => {
    // Check cache first
    if (deviceCache.current.has(id)) {
      return deviceCache.current.get(id) || null;
    }
    
    // If not in cache, check the loaded devices
    const device = devices.find(d => d.id === id) || null;
    
    // Add to cache if found
    if (device) {
      deviceCache.current.set(id, device);
    }
    
    return device;
  }, [devices]);

  // Load devices with debouncing
  const loadDevices = useCallback(async (forceRefresh = false) => {
    // Skip if load previously failed and not forcing refresh
    if (loadFailed && !forceRefresh) return;
    
    // Skip if already loading
    if (loadingRef.current) {
      console.log('Already loading devices, skipping...');
      return;
    }
    
    // Debounce loading (prevent frequent reloads)
    const now = Date.now();
    if (!forceRefresh && now - lastLoadTime.current < 2000) {
      console.log('Skipping load, debounce in effect');
      return;
    }
    
    loadingRef.current = true;
    setIsLoading(true);
    lastLoadTime.current = now;
    
    try {
      const allDevices = await dataService.devices.getAll();
      
      // Update cache
      allDevices.forEach(device => {
        deviceCache.current.set(device.id, device);
      });
      
      // Filter devices if needed
      const filteredData = options?.statusFilter 
        ? allDevices.filter(options.statusFilter)
        : allDevices;
        
      setDevices(filteredData);
      setLoadFailed(false);
    } catch (error) {
      console.error('Error loading devices:', error);
      
      // Try to load from mock data if API fails
      if (options?.mockDataFilter) {
        try {
          // Use dataStore from utils/data/index.ts instead of deviceService.getDevices()
          const mockDevices = dataService.getDevices();
          const filteredMockDevices = mockDevices.filter(options.mockDataFilter);
          setDevices(filteredMockDevices);
        } catch (mockError) {
          console.error('Error loading mock devices:', mockError);
        }
      }
      
      setLoadFailed(true);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [options?.statusFilter, options?.mockDataFilter, loadFailed]);

  return {
    devices: sortedDevices,
    isLoading,
    loadDevices,
    getDevice,
    setDevices
  };
};
