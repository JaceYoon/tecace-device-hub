
import { useState, useEffect, useCallback } from 'react';
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
  const { isAdmin, isManager, user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsData, usersData, devicesData] = await Promise.all([
        dataService.devices.getAllRequests(),
        dataService.users.getAll(),
        dataService.devices.getAll()
      ]);
      console.log("Fetched requests:", requestsData.length);
      setRequests(requestsData);
      setUsers(usersData);
      setDevices(devicesData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load device requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
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
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getDeviceInfo = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return {
      name: device ? device.project : 'Unknown Device',
      type: device ? device.type : 'Unknown Type',
      serialNumber: device ? device.serialNumber : 'N/A',
      imei: device ? device.imei : 'N/A'
    };
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
    let filteredRequests = requests.filter(request => {
      if (request.type === 'return') return false;
      return request.type !== 'report';
    });
    
    if (userId) {
      filteredRequests = filteredRequests.filter(request => request.userId === userId);
      console.log(`Filtered ${filteredRequests.length} requests for user ${userId}`);
    } else if (isAdmin || isManager) {
      // For admins and managers, show all pending requests when no userId is specified
      filteredRequests = filteredRequests.filter(request => request.status === 'pending');
    } else if (user) {
      // For regular users, only show their own pending requests
      filteredRequests = filteredRequests.filter(request => request.userId === user.id);
    }
    
    return filteredRequests;
  };

  return {
    loading,
    processing,
    filteredRequests: getFilteredRequests(),
    getUserName,
    getDeviceName,
    handleApprove,
    handleReject,
    handleCancel,
    handleRefresh,
    isAdmin,
    isManager,
    user
  };
};
