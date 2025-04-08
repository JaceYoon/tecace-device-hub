
import { useState, useEffect } from 'react';
import { dataService } from '@/services/data.service';
import { Device, DeviceRequest } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export const useStatusSummary = (onRefresh?: () => void) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Auth context not ready:', error);
    authContext = {
      isAdmin: false,
      isManager: false, 
      isAuthenticated: false,
      user: null
    };
  }
  
  const { isAdmin, isManager, isAuthenticated, user } = authContext;
  
  const fetchData = async () => {
    if (!isAuthenticated || !user) {
      setDevices([]);
      setRequests([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const results = await Promise.allSettled([
        dataService.getDevices(),
        dataService.devices.getAllRequests()
      ]);
      
      if (results[0].status === 'fulfilled') {
        console.log('StatusSummary - fetched devices:', results[0].value.length);
        setDevices(results[0].value);
      } else {
        console.error('Error fetching devices:', results[0].reason);
        setDevices([]);
      }
      
      if (results[1].status === 'fulfilled') {
        console.log('StatusSummary - fetched requests:', results[1].value.length);
        setRequests(results[1].value);
      } else {
        console.error('Error fetching requests:', results[1].reason);
        setRequests([]);
        
        const errorMessage = results[1].reason?.message || 'Unknown error';
        if (!errorMessage.includes('Failed to fetch') && 
            !errorMessage.includes('ECONNREFUSED')) {
          toast.error(`Error loading requests: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error fetching data for status summary:', error);
      setDevices([]);
      setRequests([]);
      setError((error as Error).message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setDevices([]);
      setRequests([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);
  
  const handleRefresh = () => {
    fetchData();
    if (onRefresh) onRefresh();
  };
  
  // Calculate device counts
  const deviceCounts = {
    availableCount: devices.filter(d => d.status === 'available' && !d.requestedBy).length,
    assignedCount: devices.filter(d => d.status === 'assigned').length,
    missingCount: devices.filter(d => d.status === 'missing').length,
    stolenCount: devices.filter(d => d.status === 'stolen').length,
    deadCount: devices.filter(d => d.status === 'dead').length,
    pendingCount: requests.filter(r => r.status === 'pending').length
  };
  
  return {
    loading,
    error,
    deviceCounts,
    isAuthenticated,
    isAdmin,
    isManager,
    handleRefresh
  };
};
