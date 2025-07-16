import { useState, useCallback, useEffect, useRef } from 'react';
import { Device, DeviceRequest } from '@/types';
import { deviceService } from '@/services/api/device.service';
import { toast } from 'sonner';

export interface DataLoader {
  loadFunction: () => Promise<void>;
  name: string;
}

export const useDeviceShipping = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [pendingShippingRequests, setPendingShippingRequests] = useState<DeviceRequest[]>([]);
  const [shippedDevices, setShippedDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPendingShipping, setSelectedPendingShipping] = useState<string[]>([]);
  const [shippingDate, setShippingDate] = useState<Date>(new Date());
  const [openShippingDateDialog, setOpenShippingDateDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allDevices, setAllDevices] = useState<Device[]>([]);

  const hasInitialLoad = useRef(false);

  // Search devices
  const searchDevices = useCallback(async (query: string) => {
    if (!allDevices.length) {
      setIsLoading(true);
      try {
        const allDeviceData = await deviceService.getAll();
        setAllDevices(allDeviceData);
      } catch (error) {
        console.error('Error loading devices:', error);
        toast.error('Failed to load devices');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    const filtered = allDevices.filter(device => 
      device.project?.toLowerCase().includes(query.toLowerCase()) ||
      device.modelNumber?.toLowerCase().includes(query.toLowerCase()) ||
      device.serialNumber?.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log('Search results:', {
      query,
      totalDevices: allDevices.length,
      filteredDevices: filtered.length,
      deviceTypes: [...new Set(filtered.map(d => d.type))],
      sampleDevices: filtered.slice(0, 3).map(d => ({ id: d.id, type: d.type, project: d.project }))
    });
    
    setDevices(filtered);
  }, [allDevices]);

  // Load pending shipping requests
  const loadPendingShipping = useCallback(async () => {
    setIsLoading(true);
    try {
      const requests = await deviceService.getAllRequests();
      const shippingRequests = requests.filter(req => req.type === 'return' && req.status === 'pending');
      setPendingShippingRequests(shippingRequests);
    } catch (error) {
      console.error('Error loading pending shipping requests:', error);
      toast.error('Failed to load pending shipping requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load shipped devices
  const loadShippedDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDeviceData = await deviceService.getAll();
      const shipped = allDeviceData.filter(device => device.status === 'returned');
      setShippedDevices(shipped);
    } catch (error) {
      console.error('Error loading shipped devices:', error);
      toast.error('Failed to load shipped devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    await Promise.all([
      loadPendingShipping(),
      loadShippedDevices()
    ]);
  }, [loadPendingShipping, loadShippedDevices]);

  // Device selection handlers
  const handleDeviceSelect = useCallback((deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  }, []);

  const handlePendingShippingSelect = useCallback((requestId: string) => {
    setSelectedPendingShipping(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  }, []);

  // Create shipping requests
  const handleCreateShippingRequests = useCallback(() => {
    if (selectedDevices.length === 0) {
      toast.error('Please select devices to ship');
      return;
    }
    setOpenShippingDateDialog(true);
  }, [selectedDevices]);

  // Submit shipping requests
  const submitShippingRequests = useCallback(async () => {
    setIsProcessing(true);
    try {
      for (const deviceId of selectedDevices) {
        await deviceService.requestDevice(deviceId, 'return');
      }
      
      toast.success(`Created shipping requests for ${selectedDevices.length} device(s)`);
      setSelectedDevices([]);
      setOpenShippingDateDialog(false);
      await loadPendingShipping();
    } catch (error) {
      console.error('Error creating shipping requests:', error);
      toast.error('Failed to create shipping requests');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedDevices, loadPendingShipping]);

  // Confirm shipping
  const handleConfirmShipping = useCallback(() => {
    if (selectedPendingShipping.length === 0) {
      toast.error('Please select requests to confirm');
      return;
    }
    setOpenConfirmDialog(true);
  }, [selectedPendingShipping]);

  const confirmShipping = useCallback(async () => {
    if (!confirmText || confirmText.toLowerCase() !== 'confirm') {
      toast.error('Please type "confirm" to proceed');
      return;
    }

    setIsProcessing(true);
    try {
      for (const requestId of selectedPendingShipping) {
        await deviceService.processRequest(requestId, 'approved');
      }

      toast.success(`Confirmed shipping for ${selectedPendingShipping.length} device(s)`);
      setSelectedPendingShipping([]);
      setOpenConfirmDialog(false);
      setConfirmText('');
      await Promise.all([loadPendingShipping(), loadShippedDevices()]);
    } catch (error) {
      console.error('Error confirming shipping:', error);
      toast.error('Failed to confirm shipping');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPendingShipping, confirmText, loadPendingShipping, loadShippedDevices]);

  // Cancel shipping request
  const cancelShippingRequest = useCallback(async (requestId: string) => {
    setIsProcessing(true);
    try {
      await deviceService.cancelRequest(requestId);
      toast.success('Shipping request cancelled');
      await loadPendingShipping();
    } catch (error) {
      console.error('Error cancelling shipping request:', error);
      toast.error('Failed to cancel shipping request');
    } finally {
      setIsProcessing(false);
    }
  }, [loadPendingShipping]);

  // Get device data for request
  const getDeviceData = useCallback((deviceId: string) => {
    return allDevices.find(device => device.id === deviceId) || 
           devices.find(device => device.id === deviceId) ||
           shippedDevices.find(device => device.id === deviceId);
  }, [allDevices, devices, shippedDevices]);

  // Initial load
  useEffect(() => {
    if (!hasInitialLoad.current) {
      loadData();
      hasInitialLoad.current = true;
    }
  }, [loadData]);

  return {
    devices,
    pendingShippingRequests,
    shippedDevices,
    selectedDevices,
    selectedPendingShipping,
    shippingDate,
    openShippingDateDialog,
    openConfirmDialog,
    confirmText,
    isProcessing,
    isLoading,
    handleDeviceSelect,
    handlePendingShippingSelect,
    handleCreateShippingRequests,
    submitShippingRequests,
    confirmShipping,
    cancelShippingRequest,
    handleConfirmShipping,
    getDeviceData,
    setShippingDate,
    setOpenShippingDateDialog,
    setOpenConfirmDialog,
    setConfirmText,
    loadData,
    searchDevices
  };
};