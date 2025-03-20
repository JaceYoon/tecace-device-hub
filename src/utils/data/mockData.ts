
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
    project: 'iPhone 13 Pro',
    projectGroup: 'Eureka',  // Added projectGroup
    type: 'Smartphone',
    imei: '123456789012345',
    serialNumber: 'ABCD1234XYZ',
    status: 'available',
    deviceStatus: 'Working',
    receivedDate: new Date('2023-01-10'),
    addedBy: '1',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    project: 'MacBook Pro M1',
    projectGroup: 'Eureka',  // Added projectGroup
    type: 'Laptop',
    imei: '987654321098765',
    serialNumber: 'MBP20221234',
    status: 'assigned',
    deviceStatus: 'Working',
    receivedDate: new Date('2023-02-05'),
    assignedTo: '2',
    addedBy: '1',
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-03-05'),
  },
  {
    id: '3',
    project: 'iPad Air',
    projectGroup: 'Eureka',  // Added projectGroup
    type: 'Tablet',
    imei: '567890123456789',
    serialNumber: 'IPAD2022987',
    status: 'missing',
    deviceStatus: 'Unknown',
    receivedDate: new Date('2023-03-15'),
    addedBy: '1',
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2023-04-15'),
    notes: 'Last seen in meeting room B',
  },
  {
    id: '4',
    project: 'Samsung Galaxy S22',
    projectGroup: 'Eureka',  // Added projectGroup
    type: 'Smartphone',
    imei: '678901234567890',
    serialNumber: 'SGS22ABC123',
    status: 'stolen',
    deviceStatus: 'Unknown',
    receivedDate: new Date('2022-12-15'),
    addedBy: '1',
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-05-10'),
    notes: 'Police report filed #12345',
  },
  {
    id: '5',
    project: 'Dell XPS 13',
    projectGroup: 'Eureka',  // Added projectGroup
    type: 'Laptop',
    imei: '345678901234567',
    serialNumber: 'XPS13DEF456',
    status: 'available',
    deviceStatus: 'Working',
    receivedDate: new Date('2023-04-05'),
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
