
import { useState } from 'react';
import { Device } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
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
    showConfirmation 
  } = useConfirmationDialog();
  
  const { 
    handleRequestDevice 
  } = useDeviceRequests(device, user, setIsProcessing, showConfirmation, onAction);
  
  const { 
    handleReleaseDevice, 
    handleStatusChange 
  } = useDeviceStatus(device, user, showConfirmation, onAction);
  
  const { 
    handleDeleteDevice, 
    handleDownloadImage 
  } = useDeviceManagement(device, isAdmin, deleteConfirmText, setIsDeleting, setDeleteConfirmOpen, setDeleteConfirmText, onAction);

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
