
import { useCallback } from 'react';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

// Add a flag to check if the server is available
let serverChecked = false;
let serverAvailable = false;

export const useServerAvailability = () => {
  // Check if the server is available
  const checkServerAvailability = useCallback(async () => {
    if (serverChecked) return serverAvailable;
    
    try {
      // Try to ping the server
      await dataService.get('/auth/check');
      serverAvailable = true;
    } catch (error) {
      console.error('Server connection failed:', error);
      serverAvailable = false;
      toast.error('Unable to connect to the server. Using mock data.');
    } finally {
      serverChecked = true;
    }
    
    return serverAvailable;
  }, []);

  return {
    checkServerAvailability
  };
};
