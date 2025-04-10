
import { toast } from 'sonner';

export const validateDeviceFields = (imei: string | undefined, serialNumber: string | undefined): boolean => {
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

export const validateDeviceForm = (
  project: string,
  projectGroup: string,
  type: string
): boolean => {
  if (!project) {
    toast.error('Please enter a device name');
    return false;
  }
  
  if (!projectGroup) {
    toast.error('Please select or enter a project group');
    return false;
  }
  
  if (!type) {
    toast.error('Please select a device type');
    return false;
  }
  
  return true;
};
