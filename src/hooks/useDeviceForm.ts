
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
    name: '',
    type: 'Smartphone',
    imei: '',
    serialNumber: '',
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
  
  const handleSubmit = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    
    const { name, type, imei, serialNumber, notes } = deviceData;
    
    // Basic validation
    if (!name || !type || !imei || !serialNumber) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add the device using the service
      const newDevice = await dataService.addDevice({
        name,
        type,
        imei,
        serialNumber,
        status: 'available',
        addedBy: userId,
        notes: notes || undefined,
      });
      
      toast.success('Device added successfully', {
        description: `${name} has been added to the inventory`
      });
      
      // Reset form
      setDeviceData({
        name: '',
        type: 'Smartphone',
        imei: '',
        serialNumber: '',
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
    handleSubmit,
  };
};
