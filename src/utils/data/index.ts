
import { userStore } from './userStore';
import { deviceStore } from './deviceStore';
import { requestStore } from './requestStore';
import { populateTestData } from './generateTestData';

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
  populateTestData
};
