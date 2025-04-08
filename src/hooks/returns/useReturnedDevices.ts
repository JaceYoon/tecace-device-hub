
import { useState, useCallback, useEffect } from 'react';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { deviceStore } from '@/utils/data'; // Import mock data for fallback

export const useReturnedDevices = () => {
  const [returnedDevices, setReturnedDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Initialize as false to prevent auto-loading
  const [loadFailed, setLoadFailed] = useState(false);

  const loadReturnedDevices = useCallback(async () => {
    // Don't try again if previous load failed
    if (loadFailed) return;
    
    setIsLoading(true);
    try {
      const allDevices = await dataService.devices.getAll();
      
      const returnedDevs = allDevices.filter(device => device.status === 'returned');
      setReturnedDevices(returnedDevs);
    } catch (error) {
      console.error('Error loading returned devices:', error);
      
      // Use mock data as fallback
      const mockDevices = deviceStore.getDevices().filter(
        device => device.status === 'returned'
      );
      setReturnedDevices(mockDevices);
      
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, [loadFailed]);

  // No automatic loading effect - we'll only load when explicitly called

  return {
    returnedDevices,
    isLoading,
    loadReturnedDevices
  };
};
