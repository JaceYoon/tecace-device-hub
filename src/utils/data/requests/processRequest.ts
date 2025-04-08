
import { DeviceRequest, RequestStatus } from '@/types';
import { deviceStore } from '../deviceStore';
import { isProcessing, markAsProcessing, stopProcessing } from './helpers';

/**
 * Process a device request (approve/reject)
 */
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
  
  // Handle different status updates
  if (status === 'approved') {
    handleApprovedRequest(requests, request, managerId);
  } else if (status === 'rejected' || status === 'cancelled') {
    handleRejectedOrCancelledRequest(request);
  }
  
  // Persist to localStorage
  localStorage.setItem('tecace_requests', JSON.stringify(requests));
  
  // Clear the processing status after a delay
  stopProcessing(processingRequests, deviceKey, 500);
  
  return requests[requestIndex];
}

// Handle approved request
function handleApprovedRequest(
  requests: DeviceRequest[],
  request: DeviceRequest,
  managerId: string
) {
  console.log(`Approved request: updating device ${request.deviceId}`);
  
  if (request.type === 'assign') {
    handleApprovedAssignRequest(request);
  } else if (request.type === 'release') {
    handleApprovedReleaseRequest(requests, request, managerId);
  } else if (request.type === 'return') {
    handleApprovedReturnRequest(request);
  } else if (request.type === 'report' && request.reportType) {
    handleApprovedReportRequest(requests, request, managerId);
  }
}

// Handle approved assign request
function handleApprovedAssignRequest(request: DeviceRequest) {
  deviceStore.updateDevice(request.deviceId, {
    assignedTo: request.userId,
    requestedBy: undefined,
    status: 'assigned',
  });
}

// Handle approved release request
function handleApprovedReleaseRequest(
  requests: DeviceRequest[],
  request: DeviceRequest,
  managerId: string
) {
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
}

// Handle approved return request
function handleApprovedReturnRequest(request: DeviceRequest) {
  // For return requests, set device status to returned
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  deviceStore.updateDevice(request.deviceId, {
    status: 'returned',
    returnDate: today,
    requestedBy: undefined
  });
  
  console.log(`Device ${request.deviceId} returned to warehouse`);
}

// Handle approved report request
function handleApprovedReportRequest(
  requests: DeviceRequest[],
  request: DeviceRequest,
  managerId: string
) {
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

// Handle rejected or cancelled request
function handleRejectedOrCancelledRequest(request: DeviceRequest) {
  // If request rejected or cancelled, clear the requestedBy field and reset status if pending
  console.log(`Request ${request.status}: clearing requestedBy for device ${request.deviceId}`);
  
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
