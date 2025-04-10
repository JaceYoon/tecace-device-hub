
import { useState } from 'react';
import { Device, User } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
import { useDeviceRequests } from './useDeviceRequests';
import { useDeviceStatus } from './useDeviceStatus';
import { useDeviceManagement } from './useDeviceManagement';
import { useConfirmationDialog } from './useConfirmationDialog';

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
  
  const { 
    confirmDialog, 
    showConfirmation,
    closeConfirmation
  } = useConfirmationDialog();
  
  // Fix: Pass only the required arguments to useDeviceRequests
  const { handleRequestDevice: requestDevice } = useDeviceRequests({
    type: 'assign',
    status: 'pending'
  });
  
  const { 
    handleReleaseDevice, 
    handleStatusChange 
  } = useDeviceStatus(device, user, showConfirmation, closeConfirmation, onAction);
  
  const { 
    handleDeleteDevice, 
    handleDownloadImage 
  } = useDeviceManagement(device, isAdmin, deleteConfirmText, setIsDeleting, setDeleteConfirmOpen, setDeleteConfirmText, onAction);

  // Create a wrapper function for requestDevice that applies it to the current device
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

            try {
              await dataService.updateDevice(device.id, {
                requestedBy: user.id,
                status: 'pending'
              });
            } catch (updateError) {
              console.error('Error updating device status to pending:', updateError);
            }

            toast.success('Device requested successfully');
            if (onAction) onAction();
            closeConfirmation();
          } catch (error) {
            console.error('Error requesting device:', error);
            toast.error('Failed to request device');
            closeConfirmation();
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
