
import { useCallback } from 'react';
import { Device, DeviceRequest } from '@/types';
import { dataService } from '@/services/data.service';

export const useDeviceInfo = (
  availableDevices: Device[],
  returnedDevices: DeviceRequest[]
) => {
  const getDeviceData = useCallback((request: DeviceRequest): Device | null => {
    // First try to find the device in our available devices
    let device = availableDevices.find(d => d.id === request.deviceId);
    
    if (device) {
      console.log(`Found device ${request.deviceId} in available devices:`, device);
      return device;
    }
    
    // If not found, try to load it directly from the dataService
    try {
      // Use synchronous localStorage fallback to get device info
      const allDevices = JSON.parse(localStorage.getItem('tecace_devices') || '[]');
      device = allDevices.find((d: Device) => d.id === request.deviceId);
      
      if (device) {
        console.log(`Found device ${request.deviceId} in localStorage:`, device);
        return device;
      }
    } catch (error) {
      console.error(`Error finding device ${request.deviceId} in localStorage:`, error);
    }
    
    // Use request.device if available (might have been included in the request)
    if (request.device) {
      console.log(`Using device from request ${request.id}:`, request.device);
      return request.device as Device;
    }
    
    console.warn(`Could not find device data for ${request.deviceId}`);
    return null;
  }, [availableDevices]);
  
  return { getDeviceData };
};
