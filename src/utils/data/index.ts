
import { userStore } from './userStore';
import { deviceStore } from './deviceStore';
import { requestStore } from './requests';
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

  // Device methods - now using the new deviceStore
  getDevices: () => import('@/services/data.service').then(({ dataService }) => dataService.getDevices()),
  getDeviceById: deviceStore.getDeviceById,
  addDevice: (device: any) => import('@/services/data.service').then(({ dataService }) => dataService.addDevice(device)),
  updateDevice: deviceStore.updateDevice,
  deleteDevice: (id: string) => import('@/services/data.service').then(({ dataService }) => dataService.deleteDevice(id)),

  // Request methods
  getRequests: requestStore.getRequests.bind(requestStore),
  getRequestById: requestStore.getRequestById.bind(requestStore),
  addRequest: requestStore.addRequest.bind(requestStore),
  processRequest: requestStore.processRequest.bind(requestStore),
  cancelRequest: requestStore.cancelRequest.bind(requestStore)
};
