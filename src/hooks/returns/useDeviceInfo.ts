
import { useCallback } from 'react';
import { Device, DeviceRequest } from '@/types';
import { dataService } from '@/services/data.service';

export const useDeviceInfo = (
  availableDevices: Device[],
  returnedDevices: DeviceRequest[]
) => {
  // Update the function to handle both a DeviceRequest object or a deviceId string
  const getDeviceData = useCallback((requestOrId: DeviceRequest | string): Device | null => {
    const deviceId = typeof requestOrId === 'string' 
      ? requestOrId 
      : requestOrId.deviceId;
    
    const request = typeof requestOrId === 'string' 
      ? null 
      : requestOrId;
    
    // First try to find the device in our available devices
    let device = availableDevices.find(d => d.id === deviceId);
    
    if (device) {
      console.log(`Found device ${deviceId} in available devices:`, device);
      return device;
    }
    
    // If not found, try to load it directly from the dataService
    try {
      // Use synchronous localStorage fallback to get device info
      const allDevices = JSON.parse(localStorage.getItem('tecace_devices') || '[]');
      device = allDevices.find((d: Device) => d.id === deviceId);
      
      if (device) {
        console.log(`Found device ${deviceId} in localStorage:`, device);
        return device;
      }
    } catch (error) {
      console.error(`Error finding device ${deviceId} in localStorage:`, error);
    }
    
    // Use request.device if available (might have been included in the request)
    if (request && request.device) {
      console.log(`Using device from request ${request.id}:`, request.device);
      return request.device as Device;
    }
    
    console.warn(`Could not find device data for ${deviceId}`);
    return null;
  }, [availableDevices]);
  
  return { getDeviceData };
};
