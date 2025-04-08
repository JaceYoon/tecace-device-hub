
import { DeviceRequest, RequestStatus } from '@/types';
import { deviceStore } from '../deviceStore';
import { isProcessing, markAsProcessing, stopProcessing } from './helpers';

// Add a request
export function addRequest(
  requests: DeviceRequest[],
  processingRequests: Set<string>,
  lastDeviceOperations: Map<string, number>,
  request: Omit<DeviceRequest, 'id' | 'requestedAt'>
): DeviceRequest {
  // Check if we're already processing a similar request (prevent duplicates)
  const deviceKey = `${request.deviceId}-${request.type}`;
  
  // Debounce device operations
  const now = Date.now();
  const lastOpTime = lastDeviceOperations.get(request.deviceId) || 0;
  if (now - lastOpTime < 2000) { // 2 seconds debounce
    console.log(`Debouncing ${request.type} request for device ${request.deviceId}, too soon after last operation`);
    
    // Find the existing request if possible
    const existingRequest = requests.find(
      r => r.deviceId === request.deviceId && r.type === request.type && 
      (r.status === 'pending' || (r.status === 'approved' && now - new Date(r.requestedAt).getTime() < 5000))
    );
    
    if (existingRequest) {
      return existingRequest;
    }
  }
  
  if (processingRequests.has(deviceKey)) {
    console.log(`Already processing a ${request.type} request for device ${request.deviceId}`);
    
    // Find the existing request if possible
    const existingRequest = requests.find(
      r => r.deviceId === request.deviceId && r.type === request.type && r.status === 'pending'
    );
    
    if (existingRequest) {
      return existingRequest;
    }
  }
  
  // Mark this request as being processed
  processingRequests.add(deviceKey);
  lastDeviceOperations.set(request.deviceId, now);
  
  const newRequest: DeviceRequest = {
    ...request,
    id: `request-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    requestedAt: new Date(),
    status: request.type === 'release' ? 'approved' : 'pending', // Auto-approve release requests only
  };
  
  // First check if there's already a pending request for this device
  if (request.type === 'assign' || request.type === 'report' || request.type === 'return') {
    const existingRequest = requests.find(
      r => r.deviceId === request.deviceId && 
           r.status === 'pending'
    );
    
    if (existingRequest) {
      console.log('Found existing request, not creating a duplicate');
      processingRequests.delete(deviceKey);
      return existingRequest;
    }
  }
  
  requests.push(newRequest);
  
  // Handle different request types
  if (request.type === 'release') {
    // Auto-process regular device release - immediately update device status
    deviceStore.updateDevice(request.deviceId, {
      assignedTo: undefined,
      assignedToId: undefined,
      status: 'available',
    });
    
    // Mark any assign requests for this device from this user as 'returned'
    const assignRequests = requests.filter(
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
  } else if (request.type === 'report' || request.type === 'return') {
    // For report/return requests, mark the device as pending
    deviceStore.updateDevice(request.deviceId, {
      status: 'pending',
      requestedBy: request.userId
    });
    
    console.log(`Device ${request.deviceId} marked as pending due to ${request.type}`);
  }
  
  // Persist to localStorage
  localStorage.setItem('tecace_requests', JSON.stringify(requests));
  
  // Clear the processing flag with a small delay to prevent race conditions
  setTimeout(() => {
    processingRequests.delete(deviceKey);
  }, 1000); // Increased timeout to 1 second
  
  return newRequest;
}

// Process a request (approve/reject)
export function processRequest(
  requests: DeviceRequest[],
  processingRequests: Set<string>,
  id: string, 
  status: RequestStatus, 
  managerId: string
): DeviceRequest | null {
  const requestIndex = requests.findIndex(request => request.id === id);
  if (requestIndex === -1) return null;
  
  const request = requests[requestIndex];
  const deviceKey = `${request.deviceId}-${request.type}`;
  
  // Don't process if we're already processing this request
  if (isProcessing(processingRequests, deviceKey)) {
    console.log(`Already processing request ${id}, skipping duplicate call`);
    return requests[requestIndex];
  }
  
  // Mark as processing
  markAsProcessing(processingRequests, deviceKey);

  console.log(`Processing request ${id} with status ${status} by user ${managerId}`);
  
  // Update request
  requests[requestIndex] = {
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
      // Auto-process regular device release - immediately update device status
      deviceStore.updateDevice(request.deviceId, {
        assignedTo: undefined,
        assignedToId: undefined,
        status: 'available',
      });
      
      // Mark any assign requests for this device from this user as 'returned'
      const assignRequests = requests.filter(
        r => r.deviceId === request.deviceId && 
            r.userId === request.userId && 
            r.type === 'assign' && 
            r.status === 'approved'
      );
      
      assignRequests.forEach(r => {
        r.status = 'returned';
      });
      
      console.log(`Device ${request.deviceId} released (status set to available)`);
    } else if (request.type === 'return') {
      // For return requests, set device status to returned
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      deviceStore.updateDevice(request.deviceId, {
        status: 'returned',
        returnDate: today,
        requestedBy: undefined
      });
      
      console.log(`Device ${request.deviceId} returned to warehouse`);
    } else if (request.type === 'report' && request.reportType) {
      // Get device to check current ownership
      const device = deviceStore.getDeviceById(request.deviceId);
      const isAssigned = device && device.assignedToId;
      const previousOwnerId = device?.assignedToId;
      
      // Handle report requests - set to appropriate status
      deviceStore.updateDevice(request.deviceId, {
        status: request.reportType as any, // Use the report type as status
        requestedBy: undefined,
        // Release ownership when report is approved
        assignedTo: undefined,
        assignedToId: undefined
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
          processedBy: managerId
        };
        
        requests.push(releaseRequest);
        
        // Mark any assign requests as returned
        const assignRequests = requests.filter(
          r => r.deviceId === request.deviceId && 
              r.userId === previousOwnerId && 
              r.type === 'assign' && 
              r.status === 'approved'
        );
        
        assignRequests.forEach(r => {
          const idx = requests.findIndex(req => req.id === r.id);
          if (idx !== -1) {
            requests[idx] = {
              ...requests[idx],
              status: 'returned',
              processedAt: new Date(),
              processedBy: managerId
            };
          }
        });
      }
    }
  } else if (status === 'rejected' || status === 'cancelled') {
    // If request rejected or cancelled, clear the requestedBy field and reset status if pending
    console.log(`Request ${status}: clearing requestedBy for device ${request.deviceId}`);
    
    const device = deviceStore.getDeviceById(request.deviceId);
    if (device && device.status === 'pending') {
      // Reset device to available state
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: undefined,
        status: 'available'
      });
    } else {
      // Just clear the requestedBy field
      deviceStore.updateDevice(request.deviceId, {
        requestedBy: undefined
      });
    }
  }
  
  // Persist to localStorage
  localStorage.setItem('tecace_requests', JSON.stringify(requests));
  
  // Clear the processing status after a delay
  stopProcessing(processingRequests, deviceKey, 500);
  
  return requests[requestIndex];
}

// Cancel a request
export function cancelRequest(
  requests: DeviceRequest[],
  processingRequests: Set<string>,
  id: string, 
  userId: string
): DeviceRequest | null {
  const requestIndex = requests.findIndex(request => request.id === id);
  if (requestIndex === -1) return null;
  
  const request = requests[requestIndex];
  const deviceKey = `${request.deviceId}-${request.type}`;
  
  // Check if already processing
  if (isProcessing(processingRequests, deviceKey)) {
    console.log(`Already cancelling request ${id}, skipping duplicate call`);
    return requests[requestIndex];
  }
  
  // Mark as processing
  markAsProcessing(processingRequests, deviceKey);
  
  // Verify the user is the one who created the request
  if (request.userId !== userId) {
    console.error("User cannot cancel a request they didn't create");
    processingRequests.delete(deviceKey);
    return null;
  }
  
  console.log(`Cancelling request ${id} by user ${userId}`);
  
  // Update request status to cancelled
  requests[requestIndex] = {
    ...request,
    status: 'cancelled',
    processedAt: new Date(),
    processedBy: userId // In this case, the requester is processing their own request
  };
  
  // Check if device status is pending and update to available
  const device = deviceStore.getDeviceById(request.deviceId);
  if (device && device.status === 'pending') {
    // Reset device to available state
    deviceStore.updateDevice(request.deviceId, {
      requestedBy: undefined,
      status: 'available'
    });
  } else {
    // Just clear the requestedBy field
    deviceStore.updateDevice(request.deviceId, {
      requestedBy: undefined
    });
  }
  
  // Persist to localStorage
  localStorage.setItem('tecace_requests', JSON.stringify(requests));
  
  // Clear processing status
  stopProcessing(processingRequests, deviceKey, 500);
  
  return requests[requestIndex];
}
