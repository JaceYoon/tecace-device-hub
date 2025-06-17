
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';
import { DeviceTypeValue } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { validateDeviceFields } from '@/components/devices/hooks/useDeviceFormValidation';

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
    modelNumber: '',
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
      modelNumber: '',
      notes: '',
      receivedDate: undefined,
      devicePicture: '',
    });
  };

  const handleFileChange = (file: File | null, field: string) => {
    if (!file) return;
    
    if (field === 'devicePicture') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setDeviceData(prev => ({
          ...prev,
          devicePicture: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { project, projectGroup, type, deviceType, imei, serialNumber, deviceStatus, modelNumber, notes, receivedDate, devicePicture } = deviceData;
    
    // Validate fields before submitting - notes is no longer required, modelNumber is now required
    if (!validateDeviceFields(imei, serialNumber, receivedDate, deviceStatus, modelNumber)) {
      return;
    }
    
    // Validate required fields
    if (!project) {
      toast.error('Please enter a device name');
      return;
    }
    
    if (!type) {
      toast.error('Please select a device type');
      return;
    }

    if (!projectGroup) {
      toast.error('Please select or enter a project group');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const addedDevice = await dataService.addDevice({
        project,
        projectGroup: projectGroup || '',
        type,
        deviceType,
        imei: imei || undefined,
        serialNumber: serialNumber || undefined,
        deviceStatus: deviceStatus || undefined,
        modelNumber: modelNumber || undefined,
        notes: notes || undefined,
        receivedDate,
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
    handleFileChange,
    handleSubmit,
    isSubmitting,
    resetForm,
  };
};
