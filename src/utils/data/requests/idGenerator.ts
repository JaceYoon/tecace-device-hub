
/**
 * Utility functions for generating unique identifiers
 */

// Generate a unique request ID
export function generateRequestId(): string {
  return `request-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
