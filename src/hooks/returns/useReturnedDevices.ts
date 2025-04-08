
import { useState, useCallback } from 'react';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { deviceStore } from '@/utils/data'; // Import mock data for fallback

export const useReturnedDevices = () => {
  const [returnedDevices, setReturnedDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  return {
    returnedDevices,
    isLoading,
    loadReturnedDevices
  };
};
