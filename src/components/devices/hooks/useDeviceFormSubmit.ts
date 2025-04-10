
import { toast } from 'sonner';
import { Device, DeviceStatus } from '@/types';
import { dataService } from '@/services/data.service';
import { validateDeviceFields } from './useDeviceFormValidation';
import { DeviceFormData } from './useDeviceFormHandlers';

interface UseDeviceFormSubmitProps {
  device: Device;
  deviceData: DeviceFormData;
  setIsSubmitting: (value: boolean) => void;
  onDeviceUpdated?: () => void;
}

export const useDeviceFormSubmit = ({
  device,
  deviceData,
  setIsSubmitting,
  onDeviceUpdated
}: UseDeviceFormSubmitProps) => {
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields before submitting
    if (!validateDeviceFields(deviceData.imei, deviceData.serialNumber)) {
      return;
    }
    
    const { 
      project, projectGroup, type, deviceType, imei, serialNumber, 
      status, deviceStatus, receivedDate, notes, devicePicture,
      assignedTo, assignedToId 
    } = deviceData;
    
    if (!project) {
      toast.error('Please enter a device name');
      return;
    }
    
    if (!type) {
      toast.error('Please select a device type');
      return;
    }
    
    if (!projectGroup || projectGroup.trim() === '') {
      toast.error('Please select or enter a project group');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare update data, ensuring assignedToId is properly handled
      // IMPORTANT: Only include devicePicture if it has changed
      // This prevents the image from being cleared when not modified
      const updateData = {
        project,
        projectGroup,
        type,
        deviceType,
        imei: imei || null,
        serialNumber: serialNumber || null,
        status: status as DeviceStatus, // Cast to specific DeviceStatus type
        deviceStatus: deviceStatus || null,
        receivedDate,
        notes: notes || null,
        // Only include devicePicture if it has a value
        ...(devicePicture ? { devicePicture } : {}),
        // Properly handle null values for assignedToId
        // Use null directly instead of 'null' string when assignedToId is null/undefined/empty
        assignedToId: assignedToId ? String(assignedToId) : null
      };
      
      // If device is assigned, ensure status is correct
      if (device.status === 'assigned') {
        updateData.status = 'assigned';
      }
      
      console.log('Sending update with data:', {
        ...updateData,
        devicePicture: updateData.devicePicture ? '[IMAGE_DATA]' : 'Not changed'
      });
      
      // Update the device
      const updatedDevice = await dataService.updateDevice(device.id, updateData);
      
      if (updatedDevice) {
        toast.success('Device updated successfully', {
          description: `${project} has been updated`
        });
        
        // Call onDeviceUpdated which will now close the dialog
        if (onDeviceUpdated) {
          onDeviceUpdated();
        }
      } else {
        toast.error('Failed to update device', {
          description: 'Device not found or update failed'
        });
      }
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit };
};
