
import { Device } from '@/types';

// This file is kept for compatibility but has been deprecated in favor of the API
class DeviceStore {
  private devices: Device[] = [];

  constructor() {
    // Initialize with empty array - no longer using localStorage
    this.devices = [];
    console.warn('DeviceStore is deprecated, please use dataService instead');
  }

  getDevices(): Device[] {
    console.warn('DeviceStore.getDevices() is deprecated, please use dataService instead');
    return this.devices;
  }

  getDevicesByUser(userId: string): Device[] {
    console.warn('DeviceStore.getDevicesByUser() is deprecated, please use dataService instead');
    if (!userId) return [];
    const userDevices = this.devices.filter(device => device.assignedTo === userId);
    return userDevices;
  }

  getDeviceById(id: string): Device | undefined {
    console.warn('DeviceStore.getDeviceById() is deprecated, please use dataService instead');
    return this.devices.find(device => device.id === id);
  }

  addDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Device {
    console.warn('DeviceStore.addDevice() is deprecated, please use dataService instead');
    const newDevice: Device = {
      ...device,
      id: `device-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: device.project || device.projectGroup || 'Unknown Project',
    };
    this.devices.push(newDevice);
    return newDevice;
  }

  updateDevice(id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Device | null {
    console.warn('DeviceStore.updateDevice() is deprecated, please use dataService instead');
    const index = this.devices.findIndex(device => device.id === id);
    if (index === -1) return null;
    
    this.devices[index] = {
      ...this.devices[index],
      ...updates,
      updatedAt: new Date(),
      project: updates.project || this.devices[index].project || this.devices[index].projectGroup || 'Unknown Project'
    };
    
    return this.devices[index];
  }

  deleteDevice(id: string): boolean {
    console.warn('DeviceStore.deleteDevice() is deprecated, please use dataService instead');
    const initialLength = this.devices.length;
    this.devices = this.devices.filter(device => device.id !== id);
    return this.devices.length !== initialLength;
  }
}

export const deviceStore = new DeviceStore();
