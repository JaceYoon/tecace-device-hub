
import { dataService } from '@/services/data.service';

// Simple deviceStore replacement for backward compatibility
export const deviceStore = {
  getDevices: () => {
    return dataService.getDevices();
  },
  
  getDeviceById: (id: string) => {
    // This will need to be handled differently since dataService.getDevices() returns all devices
    // For now, we'll return a promise that resolves to the device
    return dataService.getDevices().then(devices => 
      devices.find(device => device.id === id)
    );
  },
  
  updateDevice: (id: string, updates: any) => {
    return dataService.updateDevice(id, updates);
  }
};
