
import { authService } from './auth.service';
import { deviceService } from './device.service';
import { userService } from './user.service';
import { apiCall } from './utils';

export { authService, deviceService, userService };
export { resetLoggedOutState, setUserLoggedOut } from './auth.service';

export const api = {
  auth: authService,
  devices: deviceService,
  users: userService,
  get: <T>(endpoint: string): Promise<T> => apiCall<T>(endpoint),
  post: <T>(endpoint: string, data: any): Promise<T> => apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: <T>(endpoint: string, data: any): Promise<T> => apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  patch: <T>(endpoint: string, data?: any): Promise<T> => apiCall<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined
  }),
  delete: <T>(endpoint: string): Promise<T> => apiCall<T>(endpoint, {
    method: 'DELETE'
  })
};

export default api;
