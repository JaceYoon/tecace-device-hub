
import { useState } from 'react';
import { toast } from 'sonner';
import { dataService } from '@/services/data.service';

interface UseDeviceFormProps {
  onDeviceAdded?: () => void;
  onCancel?: () => void;
}

export const useDeviceForm = ({ onDeviceAdded, onCancel }: UseDeviceFormProps = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceData, setDeviceData] = useState({
    project: '',
    deviceType: 'Smartphone',
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
    
    const { project, deviceType, imei, serialNumber, deviceStatus, receivedDate, notes } = deviceData;
    
    // Basic validation
    if (!project || !deviceType || !imei || !serialNumber) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add the device using the service
      const newDevice = await dataService.addDevice({
        project,
        deviceType,
        imei,
        serialNumber,
        status: 'available',
        deviceStatus: deviceStatus || undefined,
        receivedDate: receivedDate || undefined,
        addedBy: userId,
        notes: notes || undefined,
      });
      
      toast.success('Device added successfully', {
        description: `${project} has been added to the inventory`
      });
      
      // Reset form
      setDeviceData({
        project: '',
        deviceType: 'Smartphone',
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
