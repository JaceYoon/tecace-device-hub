
import { DeviceRequest, RequestStatus } from '@/types';
import { addRequest, processRequest, cancelRequest } from './operations';

export class RequestStore {
  private requests: DeviceRequest[] = [];
  private processingRequests = new Set<string>(); // Track requests being processed
  private lastDeviceOperations = new Map<string, number>(); // Track last operation time per device

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

  // Add a request
  addRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>): DeviceRequest {
    return addRequest(this.requests, this.processingRequests, this.lastDeviceOperations, request);
  }

  // Process a request (approve/reject)
  processRequest(id: string, status: RequestStatus, managerId: string): DeviceRequest | null {
    return processRequest(
      this.requests, 
      this.processingRequests, 
      id, 
      status, 
      managerId
    );
  }

  // Cancel a request
  cancelRequest(id: string, userId: string): DeviceRequest | null {
    return cancelRequest(
      this.requests, 
      this.processingRequests, 
      id, 
      userId
    );
  }

  // For testing - set the requests directly
  _setRequests(requests: DeviceRequest[]): void {
    this.requests = [...requests];
    localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
  }
}
