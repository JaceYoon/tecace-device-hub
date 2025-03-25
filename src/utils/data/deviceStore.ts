
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
        
        // Ensure all devices have the project field set correctly
        this.devices = this.devices.map(device => {
          if (!device.project && device.projectGroup) {
            // If project is missing but projectGroup exists, use that
            return { ...device, project: device.projectGroup };
          }
          // Make sure project is never undefined or empty
          if (!device.project) {
            return { ...device, project: 'Unknown Project' };
          }
          
          // Make sure assignedTo and assignedToName are properly synced
          if (device.assignedTo && !device.assignedToName) {
            // Try to get user name from local storage if available
            try {
              const users = JSON.parse(localStorage.getItem('tecace_users') || '[]');
              const user = users.find((u: any) => u.id === device.assignedTo);
              if (user) {
                device.assignedToName = user.name;
              }
            } catch (e) {
              console.warn('Error getting user name for assigned device', e);
            }
          }
          
          return device;
        });
        
        // Save the corrected data back to localStorage
        localStorage.setItem('tecace_devices', JSON.stringify(this.devices));
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

  getDevicesByUser(userId: string): Device[] {
    if (!userId) return [];
    console.log("Getting devices for user ID:", userId);
    console.log("All devices:", this.devices);
    const userDevices = this.devices.filter(device => device.assignedTo === userId);
    console.log("User devices:", userDevices);
    return userDevices;
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
      // Ensure project field is set - prefer project, fallback to projectGroup
      project: device.project || device.projectGroup || 'Unknown Project',
    };
    this.devices.push(newDevice);

    // Persist to localStorage
    localStorage.setItem('tecace_devices', JSON.stringify(this.devices));

    return newDevice;
  }

  updateDevice(id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Device | null {
    const index = this.devices.findIndex(device => device.id === id);
    if (index === -1) return null;

    // If assignedTo is being updated, make sure to update assignedToName as well
    if (updates.assignedTo !== undefined) {
      if (updates.assignedTo) {
        // Try to get user name from local storage
        try {
          const users = JSON.parse(localStorage.getItem('tecace_users') || '[]');
          const user = users.find((u: any) => u.id === updates.assignedTo);
          if (user) {
            updates.assignedToName = user.name;
          }
        } catch (e) {
          console.warn('Error getting user name for assigned device', e);
        }
      } else {
        // If assignedTo is being removed, clear assignedToName as well
        updates.assignedToName = undefined;
      }
    }

    this.devices[index] = {
      ...this.devices[index],
      ...updates,
      updatedAt: new Date(),
      // If updating project to undefined/null, keep the old project value
      project: updates.project || this.devices[index].project || this.devices[index].projectGroup || 'Unknown Project'
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
