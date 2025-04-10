import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceRequest, User, Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';

interface UseRequestListProps {
  userId?: string;
  onRequestProcessed?: () => void;
  refreshTrigger?: number;
}

export const useRequestList = ({ userId, onRequestProcessed, refreshTrigger }: UseRequestListProps) => {
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { isAdmin, user } = useAuth();
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    try {
      const [requestsData, usersData, devicesData] = await Promise.all([
        dataService.devices.getAllRequests(),
        dataService.users.getAll(),
        dataService.devices.getAll()
      ]);
      
      if (!isMountedRef.current) return;
      
      console.log("useRequestList - Fetched requests:", requestsData.length);
      setRequests(requestsData);
      setUsers(usersData);
      setDevices(devicesData);
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error fetching requests:', error);
        toast.error('Failed to load device requests');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Set up the ref
    isMountedRef.current = true;
    
    fetchData();
    
    // Clean up
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, refreshTrigger]);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await dataService.processRequest(requestId, 'approved');
      toast.success('Request approved successfully');
      fetchData();
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await dataService.processRequest(requestId, 'rejected');
      toast.success('Request rejected successfully');
      fetchData();
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setProcessing(requestId);
    try {
      console.log(`Attempting to cancel request ${requestId}`);
      await dataService.devices.cancelRequest(requestId);
      toast.success('Request cancelled successfully');
      fetchData();
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setProcessing(null);
    }
  };

  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown User';
    
    const user = users.find(u => String(u.id) === String(userId));
    if (user) {
      return user.name || 'Unnamed User';
    }
    
    return 'Unknown User';
  };

  const getDeviceName = (request: DeviceRequest) => {
    const device = devices.find(d => d.id === request.deviceId);
    
    if (device && device.project) {
      return device.project;
    }
    
    if (request.device?.project) {
      return request.device.project;
    }
    
    if (request.deviceName) {
      return request.deviceName;
    }
    
    return 'Unknown Device';
  };

  const getFilteredRequests = () => {
    // First, filter out report requests and return requests as these are shown separately
    let filteredRequests = requests.filter(request => 
      request.type !== 'report' && request.type !== 'return');
    
    // For the "My Requests" tab, we always want to show the user's requests
    // regardless of their status (not just pending ones)
    if (userId) {
      filteredRequests = filteredRequests.filter(request => {
        return String(request.userId) === String(userId);
      });
    } else if (!isAdmin && user) {
      // For non-admin users without a specific userId filter, show their own requests
      filteredRequests = filteredRequests.filter(request => String(request.userId) === String(user.id));
    } else if (isAdmin && !userId) {
      // For admins without a specific userId filter, show all pending requests
      filteredRequests = filteredRequests.filter(request => request.status === 'pending');
    }
    
    return filteredRequests;
  };

  const filteredRequests = getFilteredRequests();

  return {
    loading,
    processing,
    filteredRequests,
    getUserName,
    getDeviceName,
    handleApprove,
    handleReject,
    handleCancel,
    handleRefresh,
    isAdmin,
    user
  };
};
