
import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';
import { DeviceTypeCategory, DeviceTypeValue } from '@/types';

interface UseDeviceFormProps {
  onDeviceAdded?: () => void;
  onCancel?: () => void;
}

export const useDeviceForm = ({ onDeviceAdded, onCancel }: UseDeviceFormProps = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceData, setDeviceData] = useState({
    project: '',
    projectGroup: '',
    type: 'Smartphone' as DeviceTypeValue,
    deviceType: 'C-Type' as DeviceTypeCategory,
    imei: '',
    serialNumber: '',
    deviceStatus: '',
    receivedDate: undefined as Date | undefined,
    notes: '',
  });
  
  // Strictly typed list of device types matching the database schema
  const deviceTypes: DeviceTypeValue[] = [
    'Smartphone',
    'Tablet',
    'Smartwatch',
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
    
    if (!project || !type || !projectGroup) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Validate that type is one of the allowed values
    if (!deviceTypes.includes(type as DeviceTypeValue)) {
      toast.error('Please select a valid device type');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Adding device with data:', {
        project,
        projectGroup,
        type,
        deviceType,
        imei: imei || undefined,
        serialNumber: serialNumber || undefined,
        status: 'available',
        deviceStatus: deviceStatus || undefined,
        receivedDate: receivedDate || undefined,
        addedBy: userId,
        notes: notes || undefined,
      });
      
      const newDevice = await dataService.addDevice({
        project,
        projectGroup,
        type,
        deviceType,
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
      
      // Reset form after successful submission
      setDeviceData({
        project: '',
        projectGroup: '',
        type: 'Smartphone' as DeviceTypeValue,
        deviceType: 'C-Type' as DeviceTypeCategory,
        imei: '',
        serialNumber: '',
        deviceStatus: '',
        receivedDate: undefined,
        notes: '',
      });
      
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
