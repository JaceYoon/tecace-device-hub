
import { userStore } from './userStore';
import { deviceStore } from './deviceStore';
import { requestStore } from './requestStore';

// Export a unified dataStore interface to minimize changes in existing code
export const dataStore = {
  // User methods
  getUsers: userStore.getUsers,
  getUserById: userStore.getUserById,
  
  // Device methods
  getDevices: deviceStore.getDevices,
  getDeviceById: deviceStore.getDeviceById,
  addDevice: deviceStore.addDevice,
  updateDevice: deviceStore.updateDevice,
  deleteDevice: deviceStore.deleteDevice,
  
  // Request methods
  getRequests: requestStore.getRequests,
  getRequestById: requestStore.getRequestById,
  addRequest: requestStore.addRequest,
  processRequest: requestStore.processRequest,
};
