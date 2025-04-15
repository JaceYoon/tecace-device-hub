
import { toast } from 'sonner';

// Validate device form fields
export const validateDeviceFields = (
  imei: string, 
  serialNumber: string,
  receivedDate?: Date,
  deviceStatus?: string,
  notes?: string
) => {
  // Validate that either IMEI or Serial Number is provided
  if (!imei && !serialNumber) {
    toast.error('Either IMEI or Serial Number must be provided');
    return false;
  }
  
  // Validate IMEI (empty or exactly 15 digits)
  if (imei && !/^\d{15}$/.test(imei)) {
    toast.error('IMEI must be exactly 15 digits');
    return false;
  }
  
  // Validate Serial Number (empty or alphanumeric only)
  if (serialNumber && !/^[a-zA-Z0-9]+$/.test(serialNumber)) {
    toast.error('Serial Number must contain only letters and numbers');
    return false;
  }
  
  // Validate Received Date
  if (!receivedDate) {
    toast.error('Received Date is required');
    return false;
  }
  
  // Validate Device Status
  if (!deviceStatus) {
    toast.error('Device Status is required');
    return false;
  }
  
  // Validate Notes
  if (!notes) {
    toast.error('Notes are required');
    return false;
  }
  
  return true;
};
