
import { Device } from '@/types';

class DeviceStore {
  private devices: Device[] = [];

  constructor() {
    // Initialize with empty array
    this.devices = [];

    // Load from localStorage if available
    const storedDevices = localStorage.getItem('tecace_devices');
    if (storedDevices) {
      try {
        this.devices = JSON.parse(storedDevices);
      } catch (error) {
        console.error('Error parsing stored devices:', error);
        this.devices = [];
        localStorage.setItem('tecace_devices', JSON.stringify(this.devices));
      }
    } else {
      localStorage.setItem('tecace_devices', JSON.stringify(this.devices));
    }
  }

  getDevices(): Device[] {
    return this.devices;
  }

  getDeviceById(id: string): Device | undefined {
    return this.devices.find(device => device.id === id);
  }

  addDevice(device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Device {
    const newDevice: Device = {
      ...device,
      id: `device-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.devices.push(newDevice);

    // Persist to localStorage
    localStorage.setItem('tecace_devices', JSON.stringify(this.devices));

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

    // Persist to localStorage
    localStorage.setItem('tecace_devices', JSON.stringify(this.devices));

    return this.devices[index];
  }

  deleteDevice(id: string): boolean {
    const initialLength = this.devices.length;
    this.devices = this.devices.filter(device => device.id !== id);

    // Persist to localStorage if a device was actually deleted
    if (this.devices.length !== initialLength) {
      localStorage.setItem('tecace_devices', JSON.stringify(this.devices));
      return true;
    }

    return false;
  }
}

export const deviceStore = new DeviceStore();
