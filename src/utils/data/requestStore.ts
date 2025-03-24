
import { DeviceRequest, RequestStatus } from '@/types';
import { mockDeviceRequests } from './mockData';
import { deviceStore } from './deviceStore';

class RequestStore {
  private requests: DeviceRequest[] = [];

  constructor() {
    // Try to load requests from localStorage first
    try {
      const storedRequests = localStorage.getItem('tecace_requests');
      if (storedRequests) {
        this.requests = JSON.parse(storedRequests);
      } else {
        // Initialize with mock requests if none exist
        this.requests = [...mockDeviceRequests];
        localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
      }
    } catch (error) {
      console.error('Error initializing RequestStore:', error);
      this.requests = [...mockDeviceRequests];
    }
  }

  getRequests(): DeviceRequest[] {
    return this.requests;
  }

  getRequestById(id: string): DeviceRequest | undefined {
    return this.requests.find(request => request.id === id);
  }

  addRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>): DeviceRequest {
    const newRequest: DeviceRequest = {
      ...request,
      id: `request-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestedAt: new Date(),
    };
    this.requests.push(newRequest);
    
    // Update device requestedBy field
    if (request.type === 'assign') {
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: request.userId,
      });
    }
    
    // Persist to localStorage
    localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
    
    return newRequest;
  }

  processRequest(id: string, status: RequestStatus, managerId: string): DeviceRequest | null {
    const requestIndex = this.requests.findIndex(request => request.id === id);
    if (requestIndex === -1) return null;
    
    const request = this.requests[requestIndex];

    console.log(`Processing request ${id} with status ${status} by user ${managerId}`);
    
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
    
    // Persist to localStorage
    localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
    
    return this.requests[requestIndex];
  }
}

export const requestStore = new RequestStore();
