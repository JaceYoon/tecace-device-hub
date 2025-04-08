
import { DeviceRequest, RequestStatus } from '@/types';
import { deviceStore } from '../deviceStore';
import { isProcessing, markAsProcessing, stopProcessing } from './processing';

/**
 * Process (approve/reject) a device request
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
  
  // Check if already processing
  if (isProcessing(processingRequests, deviceKey)) {
    console.log(`Already processing request ${id}, skipping duplicate call`);
    return requests[requestIndex];
  }
  
  // Mark as processing
  markAsProcessing(processingRequests, deviceKey);
  
  console.log(`Processing request ${id} with status ${status} by manager ${managerId}`);
  
  // Update request status
  requests[requestIndex] = {
    ...request,
    status,
    processedAt: new Date(),
    processedBy: managerId
  };
  
  // Handle device status updates based on request type and new status
  if (status === 'approved') {
    const device = deviceStore.getDeviceById(request.deviceId);
    
    if (!device) {
      console.error(`Device ${request.deviceId} not found`);
      processingRequests.delete(deviceKey);
      return null;
    }
    
    // Update device based on request type
    switch (request.type) {
      case 'assign':
        deviceStore.updateDevice(request.deviceId, {
          status: 'assigned',
          assignedToId: request.userId,
          requestedBy: undefined
        });
        break;
        
      case 'release':
        deviceStore.updateDevice(request.deviceId, {
          status: 'available',
          assignedToId: undefined
        });
        break;
        
      case 'report':
        if (request.reportType) {
          deviceStore.updateDevice(request.deviceId, {
            status: request.reportType as any, // need to cast because types don't match exactly
            assignedToId: undefined
          });
        }
        break;
    }
  } else if (status === 'rejected') {
    // If rejected, clear the requestedBy field
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
