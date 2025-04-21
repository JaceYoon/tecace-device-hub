import { useState, useEffect, useCallback } from 'react';
import { DeviceRequest } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

interface UseRequestListProps {
  userId?: string;
  onRequestProcessed?: () => void;
  refreshTrigger?: number;
  pendingOnly?: boolean;
}

export const useRequestList = ({ 
  userId, 
  onRequestProcessed,
  refreshTrigger = 0,
  pendingOnly = false
}: UseRequestListProps = {}) => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const { user, isAdmin } = useAuth();
  
  // Create device and user name lookup maps
  const [deviceNameMap, setDeviceNameMap] = useState<Record<string, string>>({});
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
  
  // Function to fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching requests with params:", { userId, pendingOnly, isAdmin });
      
      // Use the correct API endpoints to get all data
      const [allRequests, devices, users] = await Promise.all([
        dataService.devices.getAllRequests(),
        dataService.getDevices(),
        dataService.getUsers()
      ]);
      
      console.log(`Fetched ${allRequests.length} requests`);
      console.log('Raw request data:', allRequests);
      
      // Create maps for more efficient lookups
      const deviceMap: Record<string, string> = {};
      const userMap: Record<string, string> = {};
      
      devices.forEach(device => {
        deviceMap[device.id] = device.project;
      });
      
      users.forEach(user => {
        userMap[user.id] = user.name;
      });
      
      setRequests(allRequests || []);
      setDeviceNameMap(deviceMap);
      setUserNameMap(userMap);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [userId, pendingOnly, isAdmin]);
  
  // Initial load and refresh when trigger changes
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshTrigger]);
  
  // Function to get device name from request
  const getDeviceName = useCallback((request: DeviceRequest): string => {
    if (request.deviceName) return request.deviceName;
    if (request.device?.project) return request.device.project;
    return deviceNameMap[request.deviceId] || 'Unknown Device';
  }, [deviceNameMap]);
  
  // Function to get user name from request
  const getUserName = useCallback((request: DeviceRequest): string => {
    if (request.userName) return request.userName;
    if (request.user?.name) return request.user.name;
    return userNameMap[request.userId] || 'Unknown User';
  }, [userNameMap]);
  
  // Process request (approve/reject)
  const processRequest = useCallback(async (requestId: string, approve: boolean) => {
    const newProcessing = new Set(processing);
    newProcessing.add(requestId);
    setProcessing(newProcessing);
    
    try {
      const updatedRequest = await dataService.devices.processRequest(
        requestId, 
        approve ? 'approved' : 'rejected'
      );
      
      if (updatedRequest) {
        // Update the local state
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: approve ? 'approved' : 'rejected' } : req
        ));
        
        toast.success(`Request ${approve ? 'approved' : 'rejected'} successfully`);
        
        if (onRequestProcessed) {
          onRequestProcessed();
        }
      }
    } catch (error) {
      console.error(`Error ${approve ? 'approving' : 'rejecting'} request:`, error);
      toast.error(`Failed to ${approve ? 'approve' : 'reject'} request`);
    } finally {
      const updatedProcessing = new Set(processing);
      updatedProcessing.delete(requestId);
      setProcessing(updatedProcessing);
    }
  }, [processing, onRequestProcessed]);
  
  // Approve a request
  const handleApprove = useCallback((requestId: string) => {
    processRequest(requestId, true);
  }, [processRequest]);
  
  // Reject a request
  const handleReject = useCallback((requestId: string) => {
    processRequest(requestId, false);
  }, [processRequest]);
  
  // Cancel a request (can be done by the requester or admin)
  const handleCancel = useCallback(async (requestId: string) => {
    const newProcessing = new Set(processing);
    newProcessing.add(requestId);
    setProcessing(newProcessing);
    
    try {
      // Find the request
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      // Only the requester or admin can cancel
      if (request.userId !== user?.id && !isAdmin) {
        throw new Error('You are not authorized to cancel this request');
      }
      
      console.log(`Cancelling request ${requestId}`);
      
      await dataService.devices.cancelRequest(requestId);
      
      // Update the local state
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'cancelled' } : req
      ));
      
      toast.success('Request cancelled successfully');
      
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
    } finally {
      const updatedProcessing = new Set(processing);
      updatedProcessing.delete(requestId);
      setProcessing(updatedProcessing);
    }
  }, [processing, requests, user, isAdmin, onRequestProcessed]);
  
  // Refresh the requests
  const handleRefresh = useCallback(() => {
    fetchRequests();
  }, [fetchRequests]);
  
  // FIX: Simplified filtering logic that works for all cases
  let filteredRequests: DeviceRequest[] = [];
  
  console.log("DEBUG useRequestList - Filtering requests:");
  console.log("- userId param:", userId);
  console.log("- current user:", user?.id);
  console.log("- isAdmin:", isAdmin);
  console.log("- pendingOnly:", pendingOnly);
  console.log("- total requests:", requests.length);
  
  // CASE 1: Non-admin user on Dashboard "Requests" tab - should see all their requests
  if (!isAdmin && user) {
    console.log("CASE 1: Non-admin user viewing their requests tab");
    filteredRequests = requests.filter(request => request.userId === user.id);
  } 
  // CASE 2: Admin with pendingOnly flag (for dashboard widgets)
  else if (isAdmin && pendingOnly) {
    console.log("CASE 2: Admin with pendingOnly - showing pending requests");
    filteredRequests = requests.filter(request => request.status === 'pending');
  } 
  // CASE 3: Admin viewing all requests
  else if (isAdmin) {
    console.log("CASE 3: Admin without filters - showing all requests");
    filteredRequests = requests;
  }
  
  console.log('Final filtered requests count:', filteredRequests.length);
  
  return {
    loading,
    processing,
    requests: filteredRequests,
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
