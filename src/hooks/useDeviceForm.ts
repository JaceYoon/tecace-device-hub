
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
  
  const validateDeviceData = () => {
    const { project, projectGroup, imei, serialNumber } = deviceData;
    
    if (!project) {
      toast.error('Please fill all required fields');
      return false;
    }
    
    // Validate serial number (only alphanumeric characters)
    if (serialNumber && !/^[a-zA-Z0-9]+$/.test(serialNumber)) {
      toast.error('Serial number can only contain letters and numbers');
      return false;
    }
    
    // Validate IMEI (exactly 15 digits)
    if (imei && !/^\d{15}$/.test(imei)) {
      toast.error('IMEI must be exactly 15 digits');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { project, projectGroup, type, deviceType, imei, serialNumber, deviceStatus, notes, receivedDate, devicePicture } = deviceData;
    
    if (!project) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Validate device data
    if (!validateDeviceData()) {
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
  };
};
