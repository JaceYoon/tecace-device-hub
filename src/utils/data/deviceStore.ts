
import { Device } from '@/types';
import { mockDevices } from './mockData';

class DeviceStore {
  private devices: Device[] = [...mockDevices];

  getDevices(): Device[] {
    return this.devices;
  }

  getDeviceById(id: string): Device | undefined {
    return this.devices.find(device => device.id === id);
  }

  addDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Device {
    const newDevice: Device = {
      ...device,
      id: (this.devices.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.devices.push(newDevice);
    return newDevice;
  }

  updateDevice(id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Device | null {
    const index = this.devices.findIndex(device => device.id === id);
    if (index === -1) return null;
    
    this.devices[index] = {
      ...this.devices[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return this.devices[index];
  }

  deleteDevice(id: string): boolean {
    const initialLength = this.devices.length;
    this.devices = this.devices.filter(device => device.id !== id);
    return this.devices.length !== initialLength;
  }
}

export const deviceStore = new DeviceStore();
