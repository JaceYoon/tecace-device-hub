
import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';
import { DeviceTypeCategory } from '@/types';

interface UseDeviceFormProps {
  onDeviceAdded?: () => void;
  onCancel?: () => void;
}

export const useDeviceForm = ({ onDeviceAdded, onCancel }: UseDeviceFormProps = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceData, setDeviceData] = useState({
    project: '',
    projectGroup: '',
    type: 'Smartphone',
    deviceType: '' as DeviceTypeCategory,
    imei: '',
    serialNumber: '',
    deviceStatus: '',
    receivedDate: undefined as Date | undefined,
    notes: '',
  });
  
  const deviceTypes = [
    'Smartphone',
    'Tablet',
    'Laptop',
    'Desktop',
    'Smartwatch',
    'C-Type',
    'Lunchbox',
    'Box',
    'Accessory',
    'Other',
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  
  const handleSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    
    const { project, projectGroup, type, deviceType, imei, serialNumber, deviceStatus, receivedDate, notes } = deviceData;
    
    // Basic validation
    if (!project || !type || !projectGroup) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Adding device with data:', {
        project,
        projectGroup,
        type,
        deviceType: deviceType || undefined,
        imei: imei || undefined,
        serialNumber: serialNumber || undefined,
        status: 'available',
        deviceStatus: deviceStatus || undefined,
        receivedDate: receivedDate || undefined,
        addedBy: userId,
        notes: notes || undefined,
      });
      
      // Add the device using the service
      const newDevice = await dataService.addDevice({
        project,
        projectGroup,
        type,
        deviceType: deviceType || undefined,
        imei: imei || undefined,
        serialNumber: serialNumber || undefined,
        status: 'available',
        deviceStatus: deviceStatus || undefined,
        receivedDate: receivedDate || undefined,
        addedBy: userId,
        notes: notes || undefined,
      });
      
      console.log('Device added:', newDevice);
      
      toast.success('Device added successfully', {
        description: `${project} has been added to the inventory`
      });
      
      // Reset form
      setDeviceData({
        project: '',
        projectGroup: '',
        type: 'Smartphone',
        deviceType: '' as DeviceTypeCategory,
        imei: '',
        serialNumber: '',
        deviceStatus: '',
        receivedDate: undefined,
        notes: '',
      });
      
      // Notify parent component
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
    deviceTypes,
    isSubmitting,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleSubmit,
  };
};
