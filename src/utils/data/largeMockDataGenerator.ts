
import { Device, DeviceTypeValue, DeviceStatus, User } from '@/types';

const DEVICE_TYPES: DeviceTypeValue[] = ['Smartphone', 'Tablet', 'Smartwatch', 'Box', 'PC', 'Accessory', 'Other'];
const DEVICE_STATUSES: DeviceStatus[] = ['available', 'assigned', 'missing', 'stolen', 'dead', 'pending'];
const PROJECT_PREFIXES = ['Project', 'Initiative', 'Campaign', 'Program', 'Study', 'Research', 'Development'];
const PROJECT_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
const DEVICE_BRANDS = ['Apple', 'Samsung', 'Google', 'Microsoft', 'Dell', 'HP', 'Lenovo', 'ASUS'];

export interface MockDataConfig {
  deviceCount: number;
  userCount: number;
  assignmentRate: number; // Percentage of devices that should be assigned
  startDate: Date;
  endDate: Date;
}

export const generateLargeMockDataset = (config: MockDataConfig) => {
  const {
    deviceCount = 10000,
    userCount = 500,
    assignmentRate = 0.6,
    startDate = new Date('2020-01-01'),
    endDate = new Date()
  } = config;

  console.log(`Generating ${deviceCount} devices and ${userCount} users...`);

  // Generate users first
  const users: User[] = [];
  for (let i = 1; i <= userCount; i++) {
    users.push({
      id: `user-${i}`,
      name: `User ${i}`,
      firstName: `First${i}`,
      lastName: `Last${i}`,
      email: `user${i}@example.com`,
      role: i <= 5 ? 'admin' : i <= 20 ? 'TPM' : i <= 100 ? 'Software Engineer' : 'user'
    });
  }

  // Generate devices
  const devices: Device[] = [];
  const assignedUserIds = users.slice(0, Math.floor(userCount * 0.8)).map(u => u.id); // 80% of users can have devices

  for (let i = 1; i <= deviceCount; i++) {
    const deviceType = DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)];
    const projectPrefix = PROJECT_PREFIXES[Math.floor(Math.random() * PROJECT_PREFIXES.length)];
    const projectName = PROJECT_NAMES[Math.floor(Math.random() * PROJECT_NAMES.length)];
    const brand = DEVICE_BRANDS[Math.floor(Math.random() * DEVICE_BRANDS.length)];
    
    // Determine if device should be assigned
    const shouldBeAssigned = Math.random() < assignmentRate;
    const assignedUserId = shouldBeAssigned ? 
      assignedUserIds[Math.floor(Math.random() * assignedUserIds.length)] : 
      undefined;

    // Generate status based on assignment
    let status: DeviceStatus;
    if (assignedUserId) {
      status = 'assigned';
    } else {
      const availableStatuses = ['available', 'dead', 'missing', 'stolen'];
      // Bias towards available (70% chance)
      if (Math.random() < 0.7) {
        status = 'available';
      } else {
        status = availableStatuses[Math.floor(Math.random() * availableStatuses.length)];
      }
    }

    // Generate random dates
    const receivedDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    const createdAt = new Date(receivedDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Up to 30 days after received

    const device: Device = {
      id: `device-${i}`,
      project: `${projectPrefix} ${projectName} ${i}`,
      projectGroup: `${projectPrefix} Group ${Math.ceil(i / 100)}`,
      type: deviceType,
      deviceType: Math.random() > 0.7 ? 'Lunchbox' : 'C-Type',
      imei: deviceType === 'Smartphone' ? `${Math.floor(Math.random() * 900000000000000) + 100000000000000}` : undefined,
      serialNumber: `${brand.substring(0, 3).toUpperCase()}${String(i).padStart(8, '0')}`,
      status,
      deviceStatus: `${brand} ${deviceType}`,
      receivedDate,
      returnDate: status === 'available' && Math.random() > 0.8 ? 
        new Date(createdAt.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000) : 
        undefined,
      notes: Math.random() > 0.7 ? `Notes for device ${i}. ${brand} ${deviceType} in good condition.` : undefined,
      memo: Math.random() > 0.8 ? `Memo: Special handling required for device ${i}` : undefined,
      addedBy: users[Math.floor(Math.random() * Math.min(20, users.length))].id, // First 20 users can add devices
      addedById: users[Math.floor(Math.random() * Math.min(20, users.length))].id,
      assignedTo: assignedUserId,
      assignedToId: assignedUserId,
      assignedToName: assignedUserId ? users.find(u => u.id === assignedUserId)?.name : undefined,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    };

    devices.push(device);

    // Log progress for large datasets
    if (i % 1000 === 0) {
      console.log(`Generated ${i} devices...`);
    }
  }

  console.log(`Mock data generation complete:
    - ${devices.length} devices
    - ${users.length} users
    - ${devices.filter(d => d.status === 'assigned').length} assigned devices
    - ${devices.filter(d => d.status === 'available').length} available devices
    - ${devices.filter(d => d.status === 'dead').length} dead devices
    - ${devices.filter(d => d.status === 'missing').length} missing devices
    - ${devices.filter(d => d.status === 'stolen').length} stolen devices`);

  return { devices, users };
};

// Predefined configurations for testing
export const MOCK_DATA_CONFIGS = {
  small: {
    deviceCount: 100,
    userCount: 20,
    assignmentRate: 0.4,
    startDate: new Date('2023-01-01'),
    endDate: new Date()
  },
  medium: {
    deviceCount: 1000,
    userCount: 100,
    assignmentRate: 0.5,
    startDate: new Date('2022-01-01'),
    endDate: new Date()
  },
  large: {
    deviceCount: 10000,
    userCount: 500,
    assignmentRate: 0.6,
    startDate: new Date('2020-01-01'),
    endDate: new Date()
  },
  extraLarge: {
    deviceCount: 50000,
    userCount: 1000,
    assignmentRate: 0.65,
    startDate: new Date('2018-01-01'),
    endDate: new Date()
  }
};

// Performance testing utilities
export const measurePerformance = async <T>(
  operation: () => Promise<T> | T,
  operationName: string
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`${operationName} took ${duration.toFixed(2)}ms`);
  return { result, duration };
};
