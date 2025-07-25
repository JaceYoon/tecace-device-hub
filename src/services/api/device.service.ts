
import { Device, DeviceRequest } from '@/types';
import { apiCall } from './utils';

export const deviceService = {
  getAll: (): Promise<Device[]> =>
    apiCall<Device[]>('/devices'),

  getById: (id: string): Promise<Device | null> =>
    apiCall<Device | null>(`/devices/${id}`),

  getDeviceHistory: (id: string): Promise<any[]> =>
    apiCall<any[]>(`/devices/${id}/history`),

  create: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> =>
    apiCall<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device)
    }),

  update: (id: string, updates: Partial<Omit<Device, 'id' | 'createdAt'>>): Promise<Device | null> => {
    console.log(`Updating device ${id} with:`, updates);
    return apiCall<Device | null>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  delete: (id: string): Promise<{ success: boolean }> =>
    apiCall<{ success: boolean }>(`/devices/${id}`, {
      method: 'DELETE'
    }),

  requestDevice: (deviceId: string, type: 'assign' | 'release' | 'report' | 'return', options?: { reportType?: 'missing' | 'stolen' | 'dead', reason?: string, rentalPeriodDays?: number }): Promise<DeviceRequest> => {
    console.log(`Sending ${type} request for device ${deviceId} with options:`, options);
    
    return apiCall<DeviceRequest>(`/devices/${deviceId}/request`, {
      method: 'POST',
      body: JSON.stringify({ 
        type, 
        reportType: options?.reportType,
        reason: options?.reason,
        rentalPeriodDays: options?.rentalPeriodDays
      })
    });
  },

  processRequest: (requestId: string, status: 'approved' | 'rejected'): Promise<DeviceRequest | null> => {
    console.log(`Processing request ${requestId} with status: ${status}`);
    return apiCall<DeviceRequest | null>(`/devices/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  cancelRequest: (requestId: string): Promise<DeviceRequest | null> => {
    console.log(`Cancelling request ${requestId}`);
    return apiCall<DeviceRequest | null>(`/devices/requests/${requestId}/cancel`, {
      method: 'PUT'
    });
  },

  getAllRequests: (): Promise<DeviceRequest[]> =>
    apiCall<DeviceRequest[]>('/devices/requests/all'),
};
