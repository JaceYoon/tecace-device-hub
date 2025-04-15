
import { useState } from 'react';
import { Device } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';
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
  closeConfirmation: () => void;
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
  const [requestInProgress, setRequestInProgress] = useState(false);
  
  const { 
    confirmDialog, 
    showConfirmation,
    closeConfirmation
  } = useConfirmationDialog();
  
  const { 
    handleReleaseDevice, 
    handleStatusChange 
  } = useDeviceStatus(device, user, showConfirmation, closeConfirmation, onAction);
  
  const { 
    handleDeleteDevice, 
    handleDownloadImage 
  } = useDeviceManagement(device, isAdmin, deleteConfirmText, setIsDeleting, setDeleteConfirmOpen, setDeleteConfirmText, onAction);

  // Create a request device handler that works directly with the current device
  const handleRequestDevice = async () => {
    if (!user) return;
    
    if (requestInProgress) {
      console.log('Request already in progress, ignoring duplicate request');
      return;
    }
    
    if (device.requestedBy && device.requestedBy !== "") {
      toast.error('This device is already requested');
      return;
    }

    try {
      setIsProcessing(true);
      setRequestInProgress(true);
      
      const requests = await dataService.devices.getAllRequests();
      const userPendingRequests = requests.filter(
        req => req.userId === user.id && 
               req.status === 'pending' && 
               req.type === 'assign'
      );
      
      if (userPendingRequests.some(req => req.deviceId === device.id)) {
        toast.error('You have already requested this device');
        setIsProcessing(false);
        setRequestInProgress(false);
        return;
      }
      
      showConfirmation(
        "Request Device",
        `Are you sure you want to request ${device.project}?`,
        async () => {
          try {
            // Create the request
            await dataService.addRequest({
              deviceId: device.id,
              userId: user.id,
              status: 'pending',
              type: 'assign',
            });

            // Only update the device AFTER we've successfully created the request
            try {
              await dataService.updateDevice(device.id, {
                requestedBy: user.id
              });
            } catch (updateError) {
              console.error('Error updating device status to pending:', updateError);
            }

            toast.success('Device requested successfully');
            if (onAction) onAction();
          } catch (error) {
            console.error('Error requesting device:', error);
            toast.error('Failed to request device');
          } finally {
            closeConfirmation();
            setIsProcessing(false);
            setRequestInProgress(false);
          }
        }
      );
    } catch (error) {
      console.error('Error checking existing requests:', error);
      setIsProcessing(false);
      setRequestInProgress(false);
      toast.error('Failed to process your request');
    }
  };

  // Add an effect to reset processing state when dialog is closed without confirmation
  const originalCloseConfirmation = closeConfirmation;
  const enhancedCloseConfirmation = () => {
    originalCloseConfirmation();
    // Reset processing states when dialog is closed without taking action
    setIsProcessing(false);
    setRequestInProgress(false);
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
    closeConfirmation: enhancedCloseConfirmation,
    handleRequestDevice,
    handleReleaseDevice,
    handleStatusChange,
    handleDeleteDevice,
    handleDownloadImage,
  };
};
