
import { useState, useEffect } from 'react';
import { Device, DeviceTypeValue, DeviceTypeCategory, DeviceStatus } from '@/types';

export const useDeviceFormState = (device: Device) => {
  // Make sure we have a valid deviceType value from the allowed options
  const deviceTypeValue = device.deviceType && 
    (device.deviceType === 'C-Type' || device.deviceType === 'Lunchbox') ? 
    device.deviceType : 'C-Type';
  
  // Ensure device.type is one of the allowed values
  const ensureValidType = (type: string): DeviceTypeValue => {
    const validTypes: DeviceTypeValue[] = [
      'Smartphone',
      'Tablet',
      'Smartwatch',
      'Box',
      'PC',
      'Accessory',
      'Other'
    ];
    
    return validTypes.includes(type as DeviceTypeValue) 
      ? (type as DeviceTypeValue) 
      : 'Other';
  };

  // Ensure we have a valid DeviceStatus
  const ensureValidStatus = (status: string): DeviceStatus => {
    const validStatuses: DeviceStatus[] = [
      'available',
      'assigned',
      'missing',
      'stolen',
      'returned',
      'dead',
      'pending'
    ];
    
    return validStatuses.includes(status as DeviceStatus)
      ? (status as DeviceStatus)
      : 'available';
  };

  // Make sure to set the initial project group from the device
  const initialProjectGroup = device.projectGroup && device.projectGroup.trim() !== '' 
    ? device.projectGroup 
    : '';

  const [deviceData, setDeviceData] = useState({
    project: device.project,
    projectGroup: initialProjectGroup,
    type: ensureValidType(device.type),
    deviceType: deviceTypeValue as DeviceTypeCategory,
    imei: device.imei || '',
    serialNumber: device.serialNumber || '',
    status: ensureValidStatus(device.status),
    deviceStatus: device.deviceStatus || '',
    receivedDate: device.receivedDate,
    notes: device.notes || '',
    memo: device.memo || '',
    devicePicture: device.devicePicture || '',
    assignedTo: device.assignedTo,
    assignedToId: device.assignedToId,
    assignedToName: device.assignedToName,
  });

  return {
    deviceData,
    setDeviceData
  };
};
