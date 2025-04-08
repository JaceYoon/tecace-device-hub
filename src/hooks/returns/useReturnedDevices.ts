
import { useState, useCallback } from 'react';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export const useReturnedDevices = () => {
  const [returnedDevices, setReturnedDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReturnedDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDevices = await dataService.devices.getAll();
      
      const returnedDevs = allDevices.filter(device => device.status === 'returned');
      setReturnedDevices(returnedDevs);
    } catch (error) {
      console.error('Error loading returned devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    returnedDevices,
    isLoading,
    loadReturnedDevices
  };
};
