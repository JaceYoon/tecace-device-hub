
import { DeviceRequest } from '@/types';
import { deviceStore } from '../deviceStore';

/**
 * Adds a new device request to the system
 */
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
  handleRequestSideEffects(requests, request, newRequest);
  
  // Persist to localStorage
  localStorage.setItem('tecace_requests', JSON.stringify(requests));
  
  // Clear the processing flag with a small delay to prevent race conditions
  setTimeout(() => {
    processingRequests.delete(deviceKey);
  }, 1000); // Increased timeout to 1 second
  
  return newRequest;
}

// Helper function to handle side effects for different request types
function handleRequestSideEffects(
  requests: DeviceRequest[],
  request: Omit<DeviceRequest, 'id' | 'requestedAt'>,
  newRequest: DeviceRequest
) {
  if (request.type === 'release') {
    handleReleaseRequest(request);
    markAssignRequestsAsReturned(requests, request);
  } else if (request.type === 'assign') {
    handleAssignRequest(request);
  } else if (request.type === 'report' || request.type === 'return') {
    handleReportOrReturnRequest(request);
  }
}

// Handle release request
function handleReleaseRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>) {
  // Auto-process regular device release - immediately update device status
  deviceStore.updateDevice(request.deviceId, {
    assignedTo: undefined,
    assignedToId: undefined,
    status: 'available',
  });
  console.log(`Device ${request.deviceId} released (status set to available)`);
}

// Mark assign requests as returned
function markAssignRequestsAsReturned(
  requests: DeviceRequest[],
  request: Omit<DeviceRequest, 'id' | 'requestedAt'>
) {
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
}

// Handle assign request
function handleAssignRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>) {
  // Update device requestedBy field
  deviceStore.updateDevice(request.deviceId, {
    requestedBy: request.userId,
  });
}

// Handle report or return request
function handleReportOrReturnRequest(request: Omit<DeviceRequest, 'id' | 'requestedAt'>) {
  // For report/return requests, mark the device as pending
  deviceStore.updateDevice(request.deviceId, {
    status: 'pending',
    requestedBy: request.userId
  });
  
  console.log(`Device ${request.deviceId} marked as pending due to ${request.type}`);
}
