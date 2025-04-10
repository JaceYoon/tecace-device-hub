
import { toast } from 'sonner';

// Validate IMEI and Serial Number
export const validateDeviceFields = (imei: string, serialNumber: string) => {
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
  
  return true;
};
