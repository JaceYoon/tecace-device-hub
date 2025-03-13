
import { Device, DeviceRequest, User, RequestStatus } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@tecace.com',
    role: 'manager',
    avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@tecace.com',
    role: 'user',
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff'
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@tecace.com',
    role: 'user',
    avatarUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=0D8ABC&color=fff'
  }
];

export const mockDevices: Device[] = [
  {
    id: '1',
    name: 'iPhone 13 Pro',
    type: 'Smartphone',
    imei: '123456789012345',
    serialNumber: 'ABCD1234XYZ',
    status: 'available',
    addedBy: '1',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    name: 'MacBook Pro M1',
    type: 'Laptop',
    imei: '987654321098765',
    serialNumber: 'MBP20221234',
    status: 'assigned',
    assignedTo: '2',
    addedBy: '1',
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-03-05'),
  },
  {
    id: '3',
    name: 'iPad Air',
    type: 'Tablet',
    imei: '567890123456789',
    serialNumber: 'IPAD2022987',
    status: 'missing',
    addedBy: '1',
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2023-04-15'),
    notes: 'Last seen in meeting room B',
  },
  {
    id: '4',
    name: 'Samsung Galaxy S22',
    type: 'Smartphone',
    imei: '678901234567890',
    serialNumber: 'SGS22ABC123',
    status: 'stolen',
    addedBy: '1',
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-05-10'),
    notes: 'Police report filed #12345',
  },
  {
    id: '5',
    name: 'Dell XPS 13',
    type: 'Laptop',
    imei: '345678901234567',
    serialNumber: 'XPS13DEF456',
    status: 'available',
    requestedBy: '3',
    addedBy: '1',
    createdAt: new Date('2023-04-10'),
    updatedAt: new Date('2023-04-10'),
  }
];

export const mockDeviceRequests: DeviceRequest[] = [
  {
    id: '1',
    deviceId: '5',
    userId: '3',
    status: 'pending',
    type: 'assign',
    requestedAt: new Date('2023-05-15'),
  },
  {
    id: '2',
    deviceId: '2',
    userId: '2',
    status: 'pending',
    type: 'release',
    requestedAt: new Date('2023-05-16'),
  }
];

// Mock data storage and manipulation
class MockDataStore {
  private users: User[] = [...mockUsers];
  private devices: Device[] = [...mockDevices];
  private requests: DeviceRequest[] = [...mockDeviceRequests];

  // User methods
  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  // Device methods
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

  // Request methods
  getRequests(): DeviceRequest[] {
    return this.requests;
  }

  getRequestById(id: string): DeviceRequest | undefined {
    return this.requests.find(request => request.id === id);
  }

  addRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>): DeviceRequest {
    const newRequest: DeviceRequest = {
      ...request,
      id: (this.requests.length + 1).toString(),
      requestedAt: new Date(),
    };
    this.requests.push(newRequest);
    
    // Update device requestedBy field
    const deviceIndex = this.devices.findIndex(device => device.id === request.deviceId);
    if (deviceIndex !== -1) {
      this.devices[deviceIndex] = {
        ...this.devices[deviceIndex],
        requestedBy: request.type === 'assign' ? request.userId : undefined,
        updatedAt: new Date()
      };
    }
    
    return newRequest;
  }

  processRequest(id: string, status: RequestStatus, managerId: string): DeviceRequest | null {
    const requestIndex = this.requests.findIndex(request => request.id === id);
    if (requestIndex === -1) return null;
    
    const request = this.requests[requestIndex];
    
    // Update request
    this.requests[requestIndex] = {
      ...request,
      status,
      processedAt: new Date(),
      processedBy: managerId
    };
    
    // If approved, update the device assignment
    if (status === 'approved') {
      const deviceIndex = this.devices.findIndex(device => device.id === request.deviceId);
      if (deviceIndex !== -1) {
        this.devices[deviceIndex] = {
          ...this.devices[deviceIndex],
          assignedTo: request.type === 'assign' ? request.userId : undefined,
          requestedBy: undefined,
          status: request.type === 'assign' ? 'assigned' : 'available',
          updatedAt: new Date()
        };
      }
    } else if (status === 'rejected') {
      // If rejected, clear the requestedBy field
      const deviceIndex = this.devices.findIndex(device => device.id === request.deviceId);
      if (deviceIndex !== -1) {
        this.devices[deviceIndex] = {
          ...this.devices[deviceIndex],
          requestedBy: undefined,
          updatedAt: new Date()
        };
      }
    }
    
    return this.requests[requestIndex];
  }
}

export const dataStore = new MockDataStore();
