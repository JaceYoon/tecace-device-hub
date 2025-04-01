import { DeviceRequest, RequestStatus, DeviceStatus } from '@/types';
import { deviceStore } from './deviceStore';

class RequestStore {
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

  addRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>): DeviceRequest {
    // Check if we're already processing a similar request (prevent duplicates)
    const deviceKey = `${request.deviceId}-${request.type}`;
    
    // Debounce device operations
    const now = Date.now();
    const lastOpTime = this.lastDeviceOperations.get(request.deviceId) || 0;
    if (now - lastOpTime < 2000) { // 2 seconds debounce
      console.log(`Debouncing ${request.type} request for device ${request.deviceId}, too soon after last operation`);
      
      // Find the existing request if possible
      const existingRequest = this.requests.find(
        r => r.deviceId === request.deviceId && r.type === request.type && 
        (r.status === 'pending' || (r.status === 'approved' && now - new Date(r.requestedAt).getTime() < 5000))
      );
      
      if (existingRequest) {
        return existingRequest;
      }
    }
    
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
    this.lastDeviceOperations.set(request.deviceId, now);
    
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
    
    // Handle release requests immediately to improve UI responsiveness
    if (request.type === 'release') {
      // Auto-process device release - immediately update device status
      deviceStore.updateDevice(request.deviceId, {
        assignedTo: undefined,
        assignedToId: undefined,
        status: 'available',
      });
      
      // Mark any assign requests for this device from this user as 'returned'
      const assignRequests = this.requests.filter(
        r => r.deviceId === request.deviceId && 
             r.userId === request.userId && 
             r.type === 'assign' && 
             r.status === 'approved'
      );
      
      assignRequests.forEach(r => {
        r.status = 'returned';
      });
      
      console.log(`Device ${request.deviceId} released (status set to available)`);
    } else if (request.type === 'assign') {
      // Update device requestedBy field
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: request.userId,
      });
    } else if (request.type === 'report') {
      // For report requests, immediately mark the device as pending
      const updatedStatus: DeviceStatus = 'available'; // Use 'available' as status
      
      deviceStore.updateDevice(request.deviceId, {
        status: updatedStatus,
        requestedBy: request.userId,
        deviceStatus: `Pending report: ${request.reportType}`
      });
      
      console.log(`Device ${request.deviceId} marked as pending due to report`);
    }
    
    // Persist to localStorage
    localStorage.setItem('tecace_requests', JSON.stringify(this.requests));
    
    // Clear the processing flag with a small delay to prevent race conditions
    setTimeout(() => {
      this.processingRequests.delete(deviceKey);
    }, 1000); // Increased timeout to 1 second
    
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
        
        // Mark any assign requests for this device from this user as 'returned'
        const assignRequests = this.requests.filter(
          r => r.deviceId === request.deviceId && 
               r.userId === request.userId && 
               r.type === 'assign' && 
               r.status === 'approved'
        );
        
        assignRequests.forEach(r => {
          const idx = this.requests.findIndex(req => req.id === r.id);
          if (idx !== -1) {
            this.requests[idx] = {
              ...this.requests[idx],
              status: 'returned',
              processedAt: new Date(),
              processedBy: managerId
            };
          }
        });
      } else if (request.type === 'report' && request.reportType) {
        // Get device to check current ownership
        const device = deviceStore.getDeviceById(request.deviceId);
        const isAssigned = device && device.assignedToId;
        const previousOwnerId = device?.assignedToId;
        
        // Handle report requests by updating device status to the reported issue
        // This is the key fix - ensure we use the reportType as the device status
        const reportStatus = request.reportType as DeviceStatus;
        
        deviceStore.updateDevice(request.deviceId, {
          status: reportStatus, // Use the report type (missing, stolen, dead) as the device status
          requestedBy: undefined,
          // Release ownership when report is approved
          assignedTo: undefined,
          assignedToId: undefined,
          deviceStatus: `Reported as ${request.reportType}: ${request.reason || ''}`
        });
        
        // If device was assigned, create an auto-released request to track history
        if (isAssigned && previousOwnerId) {
          console.log(`Auto-releasing device ${request.deviceId} after report approval`);
          
          // Create an auto-approved release request
          const releaseRequest: DeviceRequest = {
            id: `release-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'release',
            status: 'approved',
            deviceId: request.deviceId,
            userId: previousOwnerId,
            requestedAt: new Date(),
            processedAt: new Date(),
            processedBy: managerId,
            reason: `Auto-released due to device being reported as ${request.reportType}`
          };
          
          this.requests.push(releaseRequest);
          
          // Mark any assign requests as returned
          const assignRequests = this.requests.filter(
            r => r.deviceId === request.deviceId && 
                 r.userId === previousOwnerId && 
                 r.type === 'assign' && 
                 r.status === 'approved'
          );
          
          assignRequests.forEach(r => {
            const idx = this.requests.findIndex(req => req.id === r.id);
            if (idx !== -1) {
              this.requests[idx] = {
                ...this.requests[idx],
                status: 'returned',
                processedAt: new Date(),
                processedBy: managerId
              };
            }
          });
        }
      }
    } else if (status === 'rejected' || status === 'cancelled') {
      // If rejected or cancelled, clear the requestedBy field
      console.log(`Request ${status}: clearing requestedBy for device ${request.deviceId}`);
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: undefined,
        // If it was a report that was rejected, restore status
        status: request.type === 'report' ? 'available' : undefined,
        // Clear any pending report message
        deviceStatus: request.type === 'report' ? undefined : undefined,
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
