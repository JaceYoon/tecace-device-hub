
import { DeviceRequest } from '@/types';
import { deviceStore } from '../deviceStore';
import { isProcessing, markAsProcessing, stopProcessing } from './processing';

/**
 * Cancel a device request
 */
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
    stopProcessing(processingRequests, deviceKey);
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
  
  // Always update device to available state when request is cancelled
  const device = deviceStore.getDeviceById(request.deviceId);
  if (device) {
    // Always set status to available regardless of current status
    deviceStore.updateDevice(request.deviceId, {
      status: 'available',
      requestedBy: undefined
    });
  }
  
  // Persist to localStorage
  localStorage.setItem('tecace_requests', JSON.stringify(requests));
  
  // Clear processing status
  stopProcessing(processingRequests, deviceKey, 500);
  
  return requests[requestIndex];
}
