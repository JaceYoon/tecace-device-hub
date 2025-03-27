
import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';
import { DeviceTypeValue } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export const useDeviceForm = (onDeviceAdded?: () => void) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [deviceData, setDeviceData] = useState({
    project: '',
    projectGroup: '',
    type: 'Smartphone' as DeviceTypeValue,
    deviceType: 'C-Type' as 'C-Type' | 'Lunchbox',
    imei: '',
    serialNumber: '',
    deviceStatus: '',
    notes: '',
    receivedDate: undefined as Date | undefined,
    devicePicture: '',
  });

  const validateField = (name: string, value: string): string => {
    if (name === 'serialNumber' && value) {
      // Check if serial number contains only alphanumeric characters
      if (!/^[A-Za-z0-9]+$/.test(value)) {
        return 'Serial number can only contain letters and numbers';
      }
    }
    
    if (name === 'imei' && value) {
      // Check if IMEI is exactly 15 digits
      if (!/^\d{15}$/.test(value)) {
        return 'IMEI must be exactly 15 digits';
      }
    }
    
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validate the field
    const errorMessage = validateField(name, value);
    
    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
    
    setDeviceData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setDeviceData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (date: Date | undefined, field: string) => {
    setDeviceData(prev => ({
      ...prev,
      [field]: date,
    }));
  };

  const resetForm = () => {
    setDeviceData({
      project: '',
      projectGroup: '',
      type: 'Smartphone' as DeviceTypeValue,
      deviceType: 'C-Type' as 'C-Type' | 'Lunchbox',
      imei: '',
      serialNumber: '',
      deviceStatus: '',
      notes: '',
      receivedDate: undefined,
      devicePicture: '',
    });
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!deviceData.project) {
      errors.project = 'Project name is required';
    }
    
    if (!deviceData.type) {
      errors.type = 'Device type is required';
    }
    
    // Validate serial number if provided
    if (deviceData.serialNumber) {
      const serialNumberError = validateField('serialNumber', deviceData.serialNumber);
      if (serialNumberError) {
        errors.serialNumber = serialNumberError;
      }
    }
    
    // Validate IMEI if provided
    if (deviceData.imei) {
      const imeiError = validateField('imei', deviceData.imei);
      if (imeiError) {
        errors.imei = imeiError;
      }
    }
    
    // Update validation errors state
    setValidationErrors(errors);
    
    // Form is valid if there are no errors
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!validateForm()) {
      // Display the first validation error
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }
    
    const { project, projectGroup, type, deviceType, imei, serialNumber, deviceStatus, notes, receivedDate, devicePicture } = deviceData;
    
    if (!project || !type) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const addedDevice = await dataService.addDevice({
        project,
        projectGroup: projectGroup || 'Eureka',
        type,
        deviceType,
        imei: imei || undefined,
        serialNumber: serialNumber || undefined,
        deviceStatus: deviceStatus || undefined,
        notes: notes || undefined,
        receivedDate: receivedDate,
        addedById: user?.id,
        status: 'available',
        devicePicture: devicePicture || undefined,
      });
      
      toast.success('Device added successfully', {
        description: `${project} has been added to the inventory`
      });
      
      resetForm();
      
      if (onDeviceAdded) {
        onDeviceAdded();
      }
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    deviceData,
    setDeviceData,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleSubmit,
    isSubmitting,
    resetForm,
    validationErrors,
  };
};
