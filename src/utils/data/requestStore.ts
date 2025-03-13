
import { DeviceRequest, RequestStatus } from '@/types';
import { mockDeviceRequests } from './mockData';
import { deviceStore } from './deviceStore';

class RequestStore {
  private requests: DeviceRequest[] = [...mockDeviceRequests];

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
    const device = deviceStore.getDeviceById(request.deviceId);
    if (device) {
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: request.type === 'assign' ? request.userId : undefined,
      });
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
      deviceStore.updateDevice(request.deviceId, {
        assignedTo: request.type === 'assign' ? request.userId : undefined,
        requestedBy: undefined,
        status: request.type === 'assign' ? 'assigned' : 'available',
      });
    } else if (status === 'rejected') {
      // If rejected, clear the requestedBy field
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: undefined,
      });
    }
    
    return this.requests[requestIndex];
  }
}

export const requestStore = new RequestStore();
