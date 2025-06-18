
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
    
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Original device data:', {
      id: device.id,
      type: device.type,
      deviceType: device.deviceType,
      modelNumber: device.modelNumber,
      notes: device.notes,
      devicePicture: device.devicePicture ? 'HAS_IMAGE' : 'NO_IMAGE'
    });
    console.log('Form deviceData state:', {
      type: deviceData.type,
      deviceType: deviceData.deviceType,
      modelNumber: deviceData.modelNumber,
      notes: deviceData.notes,
      devicePicture: deviceData.devicePicture ? 'HAS_IMAGE' : 'NO_IMAGE'
    });
    
    // Validate fields before submitting - notes is no longer required, modelNumber is now required
    if (!validateDeviceFields(
      deviceData.imei, 
      deviceData.serialNumber, 
      deviceData.receivedDate,
      deviceData.deviceStatus,
      deviceData.modelNumber
    )) {
      return;
    }
    
    const { 
      project, projectGroup, type, deviceType, imei, serialNumber, 
      status, deviceStatus, receivedDate, modelNumber, notes, devicePicture,
      assignedTo, assignedToId 
    } = deviceData;
    
    if (!project || !type || !projectGroup) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare update data, ensuring deviceType is properly included
      const updateData = {
        project,
        projectGroup,
        type,
        deviceType, // Make sure deviceType is included in the update
        imei: imei || null,
        serialNumber: serialNumber || null,
        status: status as DeviceStatus,
        deviceStatus: deviceStatus || null,
        receivedDate,
        modelNumber: modelNumber || null, // Include modelNumber in update
        notes: notes || null, // Include notes in update
        // FIXED: Always include devicePicture field to handle deletion
        devicePicture: devicePicture || null, // Send null to delete, or image data to update
        // Properly handle null values for assignedToId
        assignedToId: assignedToId ? String(assignedToId) : null
      };
      
      // If device is assigned, ensure status is correct
      if (device.status === 'assigned') {
        updateData.status = 'assigned';
      }
      
      console.log('=== UPDATE DATA BEING SENT ===');
      console.log('Update data:', {
        ...updateData,
        devicePicture: updateData.devicePicture ? 
          (updateData.devicePicture === null ? 'DELETION_REQUESTED' : '[IMAGE_DATA]') : 
          'DELETION_REQUESTED'
      });
      console.log('Device Type specifically:', updateData.deviceType);
      console.log('Device Category specifically:', updateData.type);
      console.log('Model Number specifically:', updateData.modelNumber);
      console.log('Notes specifically:', updateData.notes);
      console.log('DevicePicture field:', updateData.devicePicture === null ? 'NULL (DELETE)' : updateData.devicePicture ? 'HAS_DATA' : 'EMPTY');
      
      // Update the device
      const updatedDevice = await dataService.updateDevice(device.id, updateData);
      
      console.log('=== RESPONSE FROM SERVER ===');
      console.log('Updated device response:', updatedDevice ? {
        id: updatedDevice.id,
        type: updatedDevice.type,
        deviceType: updatedDevice.deviceType,
        modelNumber: updatedDevice.modelNumber,
        notes: updatedDevice.notes
      } : 'null');
      
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
      console.error('=== ERROR UPDATING DEVICE ===');
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit };
};
