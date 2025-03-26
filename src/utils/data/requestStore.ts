
import { DeviceRequest, RequestStatus } from '@/types';
import { deviceStore } from './deviceStore';

class RequestStore {
  private requests: DeviceRequest[] = [];
  private processingRequests = new Set<string>(); // Track requests being processed

  constructor() {
    // Try to load requests from localStorage first
    try {
      const storedRequests = localStorage.getItem('tecace_requests');
      if (storedRequests) {
        this.requests = JSON.parse(storedRequests);
      } else {
        // Initialize with mock requests if none exist
        this.requests = [];
        localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
      }
    } catch (error) {
      console.error('Error initializing RequestStore:', error);
      this.requests = [];
    }
  }

  getRequests(): DeviceRequest[] {
    return this.requests;
  }

  getRequestById(id: string): DeviceRequest | undefined {
    return this.requests.find(request => request.id === id);
  }

  addRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>): DeviceRequest {
    // Check if we're already processing a similar request (prevent duplicates)
    const deviceKey = `${request.deviceId}-${request.type}`;
    if (this.processingRequests.has(deviceKey)) {
      console.log(`Already processing a ${request.type} request for device ${request.deviceId}`);
      
      // Find the existing request if possible
      const existingRequest = this.requests.find(
        r => r.deviceId === request.deviceId && r.type === request.type && r.status === 'pending'
      );
      
      if (existingRequest) {
        return existingRequest;
      }
    }
    
    // Mark this request as being processed
    this.processingRequests.add(deviceKey);
    
    const newRequest: DeviceRequest = {
      ...request,
      id: `request-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestedAt: new Date(),
      status: request.type === 'release' ? 'approved' : 'pending', // Auto-approve release requests
    };
    
    // First check if there's already a pending request for this device
    if (request.type === 'assign') {
      const existingRequest = this.requests.find(
        r => r.deviceId === request.deviceId && 
             r.status === 'pending' && 
             r.type === 'assign'
      );
      
      if (existingRequest) {
        console.log('Found existing request, not creating a duplicate');
        this.processingRequests.delete(deviceKey);
        return existingRequest;
      }
    }
    
    this.requests.push(newRequest);
    
    // Update device requestedBy field
    if (request.type === 'assign') {
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: request.userId,
      });
    } else if (request.type === 'release') {
      // Auto-process device release - immediately update device status
      deviceStore.updateDevice(request.deviceId, {
        assignedTo: undefined,
        assignedToId: undefined,
        status: 'available',
      });
    }
    
    // Persist to localStorage
    localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
    
    // Clear the processing flag with a small delay to prevent race conditions
    setTimeout(() => {
      this.processingRequests.delete(deviceKey);
    }, 500);
    
    return newRequest;
  }

  processRequest(id: string, status: RequestStatus, managerId: string): DeviceRequest | null {
    const requestIndex = this.requests.findIndex(request => request.id === id);
    if (requestIndex === -1) return null;
    
    const request = this.requests[requestIndex];
    const deviceKey = `${request.deviceId}-${request.type}`;
    
    // Don't process if we're already processing this request
    if (this.processingRequests.has(deviceKey)) {
      console.log(`Already processing request ${id}, skipping duplicate call`);
      return this.requests[requestIndex];
    }
    
    // Mark as processing
    this.processingRequests.add(deviceKey);

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
      console.log(`Approved request: updating device ${request.deviceId}`);
      
      if (request.type === 'assign') {
        deviceStore.updateDevice(request.deviceId, {
          assignedTo: request.userId,
          requestedBy: undefined,
          status: 'assigned',
        });
      } else if (request.type === 'release') {
        deviceStore.updateDevice(request.deviceId, {
          assignedTo: undefined,
          assignedToId: undefined,
          requestedBy: undefined,
          status: 'available',
        });
      }
    } else if (status === 'rejected' || status === 'cancelled') {
      // If rejected or cancelled, clear the requestedBy field
      console.log(`Request ${status}: clearing requestedBy for device ${request.deviceId}`);
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: undefined,
      });
    }
    
    // Persist to localStorage
    localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
    
    // Clear the processing status after a delay
    setTimeout(() => {
      this.processingRequests.delete(deviceKey);
    }, 500);
    
    return this.requests[requestIndex];
  }

  // Specific method for handling cancellation
  cancelRequest(id: string, userId: string): DeviceRequest | null {
    const requestIndex = this.requests.findIndex(request => request.id === id);
    if (requestIndex === -1) return null;
    
    const request = this.requests[requestIndex];
    const deviceKey = `${request.deviceId}-${request.type}`;
    
    // Check if already processing
    if (this.processingRequests.has(deviceKey)) {
      console.log(`Already cancelling request ${id}, skipping duplicate call`);
      return this.requests[requestIndex];
    }
    
    // Mark as processing
    this.processingRequests.add(deviceKey);
    
    // Verify the user is the one who created the request
    if (request.userId !== userId) {
      console.error("User cannot cancel a request they didn't create");
      this.processingRequests.delete(deviceKey);
      return null;
    }
    
    console.log(`Cancelling request ${id} by user ${userId}`);
    
    // Update request status to cancelled
    this.requests[requestIndex] = {
      ...request,
      status: 'cancelled',
      processedAt: new Date(),
      processedBy: userId // In this case, the requester is processing their own request
    };
    
    // Clear the requestedBy field on the device
    deviceStore.updateDevice(request.deviceId, {
      requestedBy: undefined,
    });
    
    // Persist to localStorage
    localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
    
    // Clear processing status
    setTimeout(() => {
      this.processingRequests.delete(deviceKey);
    }, 500);
    
    return this.requests[requestIndex];
  }
}

export const requestStore = new RequestStore();
