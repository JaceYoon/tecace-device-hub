
import { useState, useEffect } from 'react';
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

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

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
    const deviceInfo = getDeviceInfo(request.deviceId);
    
    if (deviceInfo.name !== 'Unknown Device') {
      return deviceInfo.name;
    }
    
    if (request.device?.project) {
      return request.device.project;
    }
    
    if (request.deviceName) {
      return request.deviceName;
    }
    
    return 'N/A';
  };

  // Filter requests based on user and type
  const getFilteredRequests = () => {
    // Show all requests except return requests on the regular RequestList
    // Return requests are handled separately on the DeviceReturnsPage
    let filteredRequests = requests.filter(request => {
      // Filter out 'return' type requests by default
      if (request.type === 'return') return false;
      
      // Also filter out report requests for now
      return request.type !== 'report';
    });
    
    if (userId) {
      filteredRequests = filteredRequests.filter(request => request.userId === userId);
      console.log(`Filtered ${filteredRequests.length} requests for user ${userId}`);
    } else {
      filteredRequests = filteredRequests.filter(request => request.status === 'pending');
    }

    if (!isAdmin && !userId && user) {
      filteredRequests = filteredRequests.filter(request => request.userId === user.id && request.status === 'pending');
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
    isAdmin,
    user
  };
};
