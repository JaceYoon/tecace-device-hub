
import { userStore } from './userStore';
import { deviceStore } from './deviceStore';
import { requestStore } from './requestStore';
import { populateTestData } from './generateTestData';
import { User, UserRole } from '@/types';

// Export the individual stores
export { userStore, deviceStore, requestStore };

// Export a unified dataStore interface to minimize changes in existing code
export const dataStore = {
  // User methods
  getUsers: userStore.getUsers.bind(userStore),
  getUserById: userStore.getUserById.bind(userStore),
  addUser: userStore.addUser.bind(userStore),
  updateUser: userStore.updateUser.bind(userStore),
  
  // Device methods
  getDevices: deviceStore.getDevices.bind(deviceStore),
  getDeviceById: deviceStore.getDeviceById.bind(deviceStore),
  addDevice: deviceStore.addDevice.bind(deviceStore),
  updateDevice: deviceStore.updateDevice.bind(deviceStore),
  deleteDevice: deviceStore.deleteDevice.bind(deviceStore),
  
  // Request methods
  getRequests: requestStore.getRequests.bind(requestStore),
  getRequestById: requestStore.getRequestById.bind(requestStore),
  addRequest: requestStore.addRequest.bind(requestStore),
  processRequest: requestStore.processRequest.bind(requestStore),
  
  // Test data generator
  populateTestData,
  
  // Add test users function
  addTestUsers: () => {
    // Generate 5 test users with different roles
    const testUsers: User[] = [
      {
        id: 'test-manager-1',
        name: 'Test Manager',
        firstName: 'Test',
        lastName: 'Manager',
        email: 'manager@tecace.com',
        role: 'manager' as UserRole,
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=manager'
      },
      {
        id: 'test-user-1',
        name: 'John Smith',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@tecace.com',
        role: 'user' as UserRole,
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=john'
      },
      {
        id: 'test-user-2',
        name: 'Alice Johnson',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@tecace.com',
        role: 'user' as UserRole,
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=alice'
      },
      {
        id: 'test-user-3',
        name: 'Robert Chen',
        firstName: 'Robert',
        lastName: 'Chen',
        email: 'robert@tecace.com',
        role: 'user' as UserRole,
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=robert'
      },
      {
        id: 'test-user-4',
        name: 'Maria Garcia',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@tecace.com',
        role: 'user' as UserRole,
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=maria'
      }
    ];
    
    userStore.addTestUsers(testUsers);
    return testUsers;
  }
};
