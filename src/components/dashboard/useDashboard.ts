
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { dataService } from '@/services/data.service';
import { DeviceRequest, Device, User } from '@/types';
import { toast } from 'sonner';

export const useDashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [devices, setDevices] = useState<{[key: string]: Device}>({});
  const [users, setUsers] = useState<{[key: string]: User}>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user || !isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      
      const [allRequests, allDevices, allUsers] = await Promise.all([
        dataService.devices.getAllRequests(),
        dataService.getDevices(),
        dataService.getUsers()
      ]);
      
      if (!isMounted.current) return;
      
      console.log("Dashboard: Fetched requests:", allRequests.length);
      
      const deviceMap: {[key: string]: Device} = {};
      const userMap: {[key: string]: User} = {};
      
      allDevices.forEach(device => {
        deviceMap[device.id] = device;
      });
      
      allUsers.forEach(user => {
        userMap[user.id] = user;
      });
      
      setRequests(allRequests);
      setDevices(deviceMap);
      setUsers(userMap);
    } catch (error) {
      if (isMounted.current) {
        console.error('Error fetching data:', error);
        if (!(error instanceof Error && error.message.includes('Unauthorized'))) {
          toast.error('Failed to load dashboard data');
        }
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    if (!isInitialMount.current) {
      fetchData();
    }
  }, [refreshTrigger, fetchData]);

  useEffect(() => {
    const unregister = dataService.registerRefreshCallback(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    
    return () => {
      if (unregister) unregister();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    if (!isAdmin || !user) return;

    try {
      await dataService.processRequest(
        requestId,
        approve ? 'approved' : 'rejected'
      );

      toast.success(`Request ${approve ? 'approved' : 'rejected'} successfully`);
      handleRefresh();
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Failed to process request');
    }
  };

  // Filter requests - exclude 'return' type requests from dashboard
  const pendingRequests = requests.filter(request => 
    request.status === 'pending' && 
    request.type !== 'report' && 
    request.type !== 'return') || [];
    
  const reportRequests = requests.filter(request => 
    request.status === 'pending' && 
    request.type === 'report') || [];

  // Set my device filter - stringify to ensure consistent comparison
  const myDeviceFilter = user ? String(user.id) : '';

  return {
    isLoading,
    user,
    isAuthenticated,
    isAdmin,
    activeTab,
    setActiveTab,
    requests,
    devices,
    users,
    pendingRequests,
    reportRequests,
    refreshTrigger,
    myDeviceFilter,
    handleRefresh,
    handleProcessRequest
  };
};
