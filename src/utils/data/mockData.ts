
import { Device, DeviceRequest, User } from '@/types';

// Mock user data
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

// Mock device data
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

// Mock device request data
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
