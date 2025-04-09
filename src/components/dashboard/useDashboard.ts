
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      setRequests([]);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allRequests = await dataService.devices.getAllRequests();
        console.log("Dashboard: Fetched requests:", allRequests);
        setRequests(allRequests);
        
        const allDevices = await dataService.getDevices();
        const allUsers = await dataService.getUsers();
        
        console.log("Dashboard: User id:", user.id, "Name:", user.name);
        console.log("Dashboard: Fetched devices:", allDevices.length);
        
        // Improved filtering to ensure released devices don't show up
        const myDevices = allDevices.filter(d => {
          const assignedToId = String(d.assignedTo) || String(d.assignedToId);
          const userId = String(user.id);
          return assignedToId === userId && d.status === 'assigned';
        });
        
        console.log("Dashboard: My devices found:", myDevices.length);
        console.log("Dashboard: My devices details:", myDevices);
        
        const deviceMap: {[key: string]: Device} = {};
        const userMap: {[key: string]: User} = {};
        
        allDevices.forEach(device => {
          deviceMap[device.id] = device;
        });
        
        allUsers.forEach(user => {
          userMap[user.id] = user;
        });
        
        setDevices(deviceMap);
        setUsers(userMap);
      } catch (error) {
        console.error('Error fetching requests:', error);
        if (!(error instanceof Error && error.message.includes('Unauthorized'))) {
          toast.error('Failed to load requests');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, refreshTrigger, isAuthenticated]);

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

  // Set my device filter
  const myDeviceFilter = user ? String(user.id) : '';
  console.log("Dashboard: Setting my device filter to:", myDeviceFilter);

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
