
import { useState, useEffect, useCallback } from 'react';
import { Device, DeviceRequest } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

export const useDeviceReturns = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingReturnRequests, setPendingReturnRequests] = useState<DeviceRequest[]>([]);
  const [returnedDevices, setReturnedDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPendingReturns, setSelectedPendingReturns] = useState<string[]>([]);
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [openReturnDateDialog, setOpenReturnDateDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      toast.error('Only administrators can access this page');
    }
  }, [isAdmin, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDevices = await dataService.devices.getAll();
      
      const returnableDevices = allDevices.filter(
        device => device.status === 'available' || device.status === 'dead'
      );
      setDevices(returnableDevices);
      
      const returnedDevs = allDevices.filter(device => device.status === 'returned');
      setReturnedDevices(returnedDevs);
      
      const requests = await dataService.devices.getAllRequests();
      
      const pendingReturns = requests.filter(
        req => req.type === 'return' && req.status === 'pending'
      );
      setPendingReturnRequests(pendingReturns);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId) 
        : [...prev, deviceId]
    );
  };

  const handlePendingReturnSelect = (requestId: string) => {
    setSelectedPendingReturns(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId) 
        : [...prev, requestId]
    );
  };

  const handleCreateReturnRequests = () => {
    if (selectedDevices.length === 0) {
      toast.warning('Please select at least one device');
      return;
    }
    setOpenReturnDateDialog(true);
  };

  const submitReturnRequests = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const deviceId of selectedDevices) {
        try {
          await dataService.devices.requestDevice(
            deviceId,
            'return',
            {
              reason: 'Device returned to warehouse'
            }
          );
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error processing return for device ${deviceId}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} device(s) added to return queue`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to queue ${errorCount} device(s) for return`);
      }
      
      setSelectedDevices([]);
      setOpenReturnDateDialog(false);
      
      loadData();
    } catch (error) {
      console.error('Error creating return requests:', error);
      toast.error('Failed to create return requests');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReturns = async () => {
    if (confirmText !== 'confirm') {
      toast.error('Please type "confirm" to proceed');
      return;
    }

    setIsProcessing(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const requestId of selectedPendingReturns) {
        try {
          await dataService.devices.processRequest(requestId, 'approved');
          
          const request = pendingReturnRequests.find(r => r.id === requestId);
          if (request) {
            const dateOnly = new Date(returnDate);
            dateOnly.setHours(0, 0, 0, 0);
            
            try {
              await dataService.devices.update(request.deviceId, {
                status: 'returned',
                returnDate: dateOnly,
              });
            } catch (error) {
              console.error(`Error updating status for device ${request.deviceId}:`, error);
            }
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error confirming return for request ${requestId}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} device(s) returned successfully`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to return ${errorCount} device(s)`);
      }
      
      setSelectedPendingReturns([]);
      setConfirmText('');
      setOpenConfirmDialog(false);
      loadData();
    } catch (error) {
      console.error('Error confirming returns:', error);
      toast.error('Failed to process returns');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelReturnRequest = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const request = pendingReturnRequests.find(r => r.id === requestId);
      const deviceId = request?.deviceId;
      
      await dataService.devices.cancelRequest(requestId);
      
      if (deviceId) {
        try {
          await dataService.devices.update(deviceId, {
            status: 'available'
          });
        } catch (error) {
          console.error(`Error updating device ${deviceId} status:`, error);
        }
      }
      
      toast.success('Return request cancelled');
      loadData();
    } catch (error) {
      console.error('Error cancelling return request:', error);
      toast.error('Failed to cancel return request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReturns = () => {
    if (selectedPendingReturns.length === 0) {
      toast.warning('Please select at least one pending return');
      return;
    }
    setOpenConfirmDialog(true);
  };

  const getDeviceData = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId) || 
                   returnedDevices.find(d => d.id === deviceId);
    return device || null;
  };

  return {
    devices,
    pendingReturnRequests,
    returnedDevices,
    selectedDevices,
    selectedPendingReturns,
    returnDate,
    openReturnDateDialog,
    openConfirmDialog,
    confirmText,
    isProcessing,
    isLoading,
    isAdmin,
    handleDeviceSelect,
    handlePendingReturnSelect,
    handleCreateReturnRequests,
    submitReturnRequests,
    confirmReturns,
    cancelReturnRequest,
    handleConfirmReturns,
    getDeviceData,
    setReturnDate,
    setOpenReturnDateDialog,
    setOpenConfirmDialog,
    setConfirmText,
    loadData
  };
};
