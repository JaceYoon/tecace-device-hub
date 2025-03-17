
import { Device } from '@/types';
import { mockDevices } from './mockData';

class DeviceStore {
  private devices: Device[] = [];

  constructor() {
    // Try to load devices from localStorage first
    try {
      const storedDevices = localStorage.getItem('tecace_devices');
      if (storedDevices) {
        this.devices = JSON.parse(storedDevices);
      } else {
        // Initialize with mock devices if none exist
        this.devices = [...mockDevices];
        localStorage.setItem('tecace_devices', JSON.stringify(this.devices));
      }
    } catch (error) {
      console.error('Error initializing DeviceStore:', error);
      this.devices = [...mockDevices];
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
  
  // Add test devices and preserve existing ones
  addTestDevices(newDevices: Device[]): void {
    // Make sure we don't add duplicate serial numbers or IMEIs
    const existingSerials = new Set(this.devices.map(d => d.serialNumber.toLowerCase()));
    const existingImeis = new Set(this.devices.map(d => d.imei.toLowerCase()));
    
    // Only add devices that don't exist yet
    const devicesToAdd = newDevices.filter(
      d => !existingSerials.has(d.serialNumber.toLowerCase()) && 
           !existingImeis.has(d.imei.toLowerCase())
    );
    
    if (devicesToAdd.length > 0) {
      this.devices = [...this.devices, ...devicesToAdd];
      localStorage.setItem('tecace_devices', JSON.stringify(this.devices));
    }
  }
}

export const deviceStore = new DeviceStore();
