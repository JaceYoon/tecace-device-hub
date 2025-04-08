
import { DeviceRequest } from '@/types';
import { deviceStore } from '../deviceStore';
import { isProcessing, markAsProcessing, stopProcessing } from './processing';
import { generateRequestId } from './idGenerator';

/**
 * Add a new device request
 */
export function addRequest(
  requests: DeviceRequest[],
  processingRequests: Set<string>,
  lastDeviceOperations: Map<string, number>,
  request: Omit<DeviceRequest, 'id' | 'requestedAt'>
): DeviceRequest {
  console.log(`Creating ${request.type} request for device ${request.deviceId}`);
  
  const deviceKey = `${request.deviceId}-${request.type}`;
  
  // Check if this device is already being processed
  if (isProcessing(processingRequests, deviceKey)) {
    throw new Error(`A ${request.type} operation is already in progress for device ${request.deviceId}`);
  }
  
  // Rate limiting - check if this device has had an operation in the last 2 seconds
  const now = Date.now();
  const lastOp = lastDeviceOperations.get(deviceKey) || 0;
  const timeSinceLast = now - lastOp;
  
  if (timeSinceLast < 2000) {
    throw new Error(`Please wait a moment before performing another ${request.type} operation on this device`);
  }
  
  // Mark as processing
  markAsProcessing(processingRequests, deviceKey);
  
  // Update last operation time
  lastDeviceOperations.set(deviceKey, now);
  
  // Create the request with timestamp and ID
  const newRequest: DeviceRequest = {
    id: generateRequestId(),
    deviceId: request.deviceId,
    userId: request.userId,
    status: request.status || 'pending',
    type: request.type,
    requestedAt: new Date(),
    processedAt: request.status === 'approved' || request.status === 'rejected' ? new Date() : undefined,
    processedBy: request.processedBy,
    reportType: request.reportType,
    reason: request.reason,
    deviceName: request.deviceName
  };
  
  // Add to requests array
  requests.push(newRequest);
  
  // Update device based on request type
  if (request.type === 'assign' && request.status === 'pending') {
    // Mark device as requested
    deviceStore.updateDevice(request.deviceId, {
      requestedBy: request.userId
    });
  } else if (request.type === 'return' || request.type === 'report') {
    // Mark device as pending for return or report requests
    deviceStore.updateDevice(request.deviceId, {
      requestedBy: request.userId,
      status: 'pending'  // Set status to pending for return and report requests
    });
  }
  
  // Persist to localStorage
  localStorage.setItem('tecace_requests', JSON.stringify(requests));
  
  // Clear processing state
  stopProcessing(processingRequests, deviceKey);
  
  return newRequest;
};
