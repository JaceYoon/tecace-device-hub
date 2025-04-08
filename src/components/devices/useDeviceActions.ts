
import { useState } from 'react';
import { Device, User } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export interface DeviceActionsHookReturn {
  isDeleting: boolean;
  isProcessing: boolean;
  deleteConfirmOpen: boolean;
  deleteConfirmText: string;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  };
  setDeleteConfirmOpen: (open: boolean) => void;
  setDeleteConfirmText: (text: string) => void;
  showConfirmation: (title: string, description: string, action: () => void) => void;
  handleRequestDevice: () => Promise<void>;
  handleReleaseDevice: () => void;
  handleStatusChange: (newStatus: 'missing' | 'stolen' | 'available' | 'dead') => void;
  handleDeleteDevice: () => Promise<void>;
  handleDownloadImage: () => void;
}

export const useDeviceActions = (
  device: Device,
  onAction?: () => void
): DeviceActionsHookReturn => {
  const { user, isAdmin } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ isOpen: false, title: '', description: '', action: () => {} });

  const showConfirmation = (title: string, description: string, action: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      action
    });
  };

  const handleRequestDevice = async () => {
    if (!user) return;
    
    if (device.requestedBy && device.requestedBy !== "") {
      toast.error('This device is already requested');
      return;
    }

    try {
      setIsProcessing(true);
      const requests = await dataService.devices.getAllRequests();
      const userPendingRequests = requests.filter(
        req => req.userId === user.id && 
               req.status === 'pending' && 
               req.type === 'assign'
      );
      
      if (userPendingRequests.some(req => req.deviceId === device.id)) {
        toast.error('You have already requested this device');
        setIsProcessing(false);
        return;
      }
      
      showConfirmation(
        "Request Device",
        `Are you sure you want to request ${device.project}?`,
        async () => {
          try {
            await dataService.addRequest({
              deviceId: device.id,
              userId: user.id,
              status: 'pending',
              type: 'assign',
            });

            toast.success('Device requested successfully');
            if (onAction) onAction();
          } catch (error) {
            console.error('Error requesting device:', error);
            toast.error('Failed to request device');
          } finally {
            setIsProcessing(false);
          }
        }
      );
    } catch (error) {
      console.error('Error checking existing requests:', error);
      setIsProcessing(false);
      toast.error('Failed to process your request');
    }
  };

  const handleReleaseDevice = () => {
    if (!user) return;

    showConfirmation(
        "Release Device",
        `Are you sure you want to release ${device.project}?`,
        async () => {
          try {
            setIsProcessing(true);
            
            try {
              await dataService.updateDevice(device.id, {
                assignedTo: undefined,
                assignedToId: undefined,
                status: 'available',
              });
              
              try {
                await dataService.addRequest({
                  deviceId: device.id,
                  userId: user.id,
                  status: 'approved',
                  type: 'release',
                });
              } catch (requestError) {
                console.warn('Failed to create release request record:', requestError);
              }
              
              toast.success('Device returned successfully');
              
              if (onAction) {
                onAction();
              }
            } catch (error) {
              console.error('Error updating device status:', error);
              toast.error('Failed to return device');
            }
          } finally {
            setIsProcessing(false);
          }
        }
    );
  };

  const handleStatusChange = (newStatus: 'missing' | 'stolen' | 'available' | 'dead') => {
    if (!isAdmin) return;

    showConfirmation(
        `Mark as ${newStatus}`,
        `Are you sure you want to mark this device as ${newStatus}?`,
        () => {
          try {
            dataService.updateDevice(device.id, { status: newStatus });
            toast.success(`Device marked as ${newStatus}`);
            if (onAction) onAction();
          } catch (error) {
            console.error('Error updating device status:', error);
            toast.error('Failed to update device status');
          }
        }
    );
  };

  const handleDeleteDevice = async () => {
    if (!isAdmin) return;
    
    if (deleteConfirmText !== 'confirm') {
      toast.error('Please type "confirm" to delete this device');
      return;
    }

    try {
      setIsDeleting(true);
      const success = await dataService.deleteDevice(device.id);
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');

      if (success) {
        toast.success('Device deleted');
        if (onAction) onAction();
      } else {
        toast.error('Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      setIsDeleting(false);
      toast.error('Failed to delete device');
    }
  };

  const handleDownloadImage = () => {
    if (!device.devicePicture) return;
    
    const link = document.createElement('a');
    link.href = device.devicePicture;
    link.download = `${device.project}_image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    isDeleting,
    isProcessing,
    deleteConfirmOpen,
    deleteConfirmText,
    confirmDialog,
    setDeleteConfirmOpen,
    setDeleteConfirmText,
    showConfirmation,
    handleRequestDevice,
    handleReleaseDevice,
    handleStatusChange,
    handleDeleteDevice,
    handleDownloadImage,
  };
};
