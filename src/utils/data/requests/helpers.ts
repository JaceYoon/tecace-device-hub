
// Check if a device operation is being processed
export function isProcessing(processingRequests: Set<string>, key: string): boolean {
  return processingRequests.has(key);
}

// Mark a device operation as being processed
export function markAsProcessing(processingRequests: Set<string>, key: string): void {
  processingRequests.add(key);
}

// Stop processing a device operation after a delay
export function stopProcessing(processingRequests: Set<string>, key: string, delay: number = 500): void {
  setTimeout(() => {
    processingRequests.delete(key);
  }, delay);
}

// Generate a unique request ID
export function generateRequestId(): string {
  return `request-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
