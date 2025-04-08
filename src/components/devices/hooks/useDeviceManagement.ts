
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

export const useDeviceManagement = (
  device: Device,
  isAdmin: boolean,
  deleteConfirmText: string,
  setIsDeleting: (value: boolean) => void,
  setDeleteConfirmOpen: (value: boolean) => void,
  setDeleteConfirmText: (value: string) => void,
  onAction?: () => void
) => {
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
    handleDeleteDevice,
    handleDownloadImage
  };
};
