
import { useState, useCallback, useRef } from 'react';
import { DeviceRequest } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { requestStore } from '@/utils/data'; // Import mock data for fallback

export const usePendingReturnRequests = () => {
  const [pendingReturnRequests, setPendingReturnRequests] = useState<DeviceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const isLoadingRef = useRef(false);

  const loadPendingReturns = useCallback(async () => {
    // Don't try again if previous load failed
    if (loadFailed) return;
    
    // Prevent concurrent loading
    if (isLoadingRef.current) {
      console.log('Already loading pending returns, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      // Load all requests and filter for return requests
      const requests = await dataService.devices.getAllRequests();
      
      const pendingReturns = requests.filter(
        req => req.type === 'return' && req.status === 'pending'
      );
      
      // Also fetch all devices to ensure we have the latest data
      try {
        await dataService.devices.getAll();
      } catch (error) {
        console.error('Error loading devices during pending returns:', error);
      }
      
      setPendingReturnRequests(pendingReturns);
    } catch (error) {
      console.error('Error loading pending returns:', error);
      
      // Use mock data as fallback
      const mockRequests = requestStore.getRequests().filter(
        req => req.type === 'return' && req.status === 'pending'
      );
      setPendingReturnRequests(mockRequests);
      
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [loadFailed]);

  return {
    pendingReturnRequests,
    isLoading,
    loadPendingReturns,
    setPendingReturnRequests
  };
};
