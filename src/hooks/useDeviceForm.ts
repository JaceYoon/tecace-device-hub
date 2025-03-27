
import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';
import { DeviceTypeValue } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export const useDeviceForm = (onDeviceAdded?: () => void) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validation for serial number - only alphanumeric characters
    if (name === 'serialNumber' && value) {
      const alphanumericRegex = /^[a-zA-Z0-9]*$/;
      if (!alphanumericRegex.test(value)) {
        toast.error('Serial number can only contain letters and numbers');
        return;
      }
    }
    
    // Validation for IMEI - only numbers with exactly 15 digits
    if (name === 'imei' && value) {
      const numericRegex = /^[0-9]*$/;
      if (!numericRegex.test(value)) {
        toast.error('IMEI can only contain numbers');
        return;
      }
      
      // Allow partial input (while typing), but warn if they've entered more than 15 digits
      if (value.length > 15) {
        toast.error('IMEI must be exactly 15 digits');
        return;
      }
    }
    
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { project, projectGroup, type, deviceType, imei, serialNumber, deviceStatus, notes, receivedDate, devicePicture } = deviceData;
    
    if (!project || !type) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Final validation for IMEI before submission
    if (imei && imei.length !== 15) {
      toast.error('IMEI must be exactly 15 digits');
      return;
    }
    
    // Final validation for serial number
    if (serialNumber) {
      const alphanumericRegex = /^[a-zA-Z0-9]*$/;
      if (!alphanumericRegex.test(serialNumber)) {
        toast.error('Serial number can only contain letters and numbers');
        return;
      }
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
  };
};
