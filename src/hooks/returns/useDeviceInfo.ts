
import { Device } from '@/types';

export const useDeviceInfo = (devices: Device[], returnedDevices: Device[]) => {
  const getDeviceData = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId) || 
                   returnedDevices.find(d => d.id === deviceId);
    return device || null;
  };

  return {
    getDeviceData
  };
};
