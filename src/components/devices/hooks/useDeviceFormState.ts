
import { useState, useEffect } from 'react';
import { Device } from '@/types';
import { DeviceFormData } from './useDeviceFormHandlers';

interface UseDeviceFormStateProps {
  device: Device;
}

export const useDeviceFormState = ({ device }: UseDeviceFormStateProps) => {
  const [deviceData, setDeviceData] = useState<DeviceFormData>({
    id: device.id || '', // Add id to form data
    project: device.project || '',
    projectGroup: device.projectGroup || '',
    type: device.type,
    deviceType: device.deviceType || 'C-Type',
    imei: device.imei || '',
    serialNumber: device.serialNumber || '',
    status: device.status,
    deviceStatus: device.deviceStatus || '',
    receivedDate: device.receivedDate,
    modelNumber: device.modelNumber || '',
    notes: device.notes || '',
    devicePicture: device.devicePicture || '',
    assignedTo: device.assignedTo,
    assignedToId: device.assignedToId,
    assignedToName: device.assignedToName
  });

  // Update form data when device prop changes
  useEffect(() => {
    console.log('useDeviceFormState: Device changed, updating form data', {
      deviceId: device.id,
      deviceProject: device.project
    });
    
    setDeviceData({
      id: device.id || '', // Include id in the update
      project: device.project || '',
      projectGroup: device.projectGroup || '',
      type: device.type,
      deviceType: device.deviceType || 'C-Type',
      imei: device.imei || '',
      serialNumber: device.serialNumber || '',
      status: device.status,
      deviceStatus: device.deviceStatus || '',
      receivedDate: device.receivedDate,
      modelNumber: device.modelNumber || '',
      notes: device.notes || '',
      devicePicture: device.devicePicture || '',
      assignedTo: device.assignedTo,
      assignedToId: device.assignedToId,
      assignedToName: device.assignedToName
    });
  }, [device]);

  return {
    deviceData,
    setDeviceData
  };
};
