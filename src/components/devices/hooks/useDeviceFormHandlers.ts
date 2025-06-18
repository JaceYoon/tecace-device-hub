
import { useState } from 'react';
import { DeviceTypeValue, DeviceStatus } from '@/types';

export interface DeviceFormData {
  project: string;
  projectGroup: string;
  type: DeviceTypeValue;
  deviceType: 'C-Type' | 'Lunchbox';
  imei: string;
  serialNumber: string;
  status: DeviceStatus;
  deviceStatus: string;
  receivedDate?: Date;
  modelNumber: string;
  notes: string;
  devicePicture: string;
  assignedTo?: any;
  assignedToId?: string;
  assignedToName?: string;
}

export const useDeviceFormHandlers = (
  deviceData: DeviceFormData,
  setDeviceData: React.Dispatch<React.SetStateAction<DeviceFormData>>
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Strictly typed list of device types matching the database schema
  const deviceTypes: DeviceTypeValue[] = [
    'Smartphone',
    'Tablet',
    'Smartwatch',
    'Box',
    'PC',
    'Accessory',
    'Other',
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Form field changed: ${name} = ${value}`);
    setDeviceData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSelectChange = (value: string, field: string) => {
    console.log(`Select field changed: ${field} = ${value}`);
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
  
  // Function to handle device picture file upload
  const handleFileChange = (file: File | null, fieldName: string) => {
    if (fieldName === 'devicePicture') {
      if (!file) {
        // 파일이 null이면 이미지를 제거
        console.log('Removing device picture from form data');
        setDeviceData(prev => ({
          ...prev,
          devicePicture: ''
        }));
        return;
      }
      
      // Handle device picture image upload
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        console.log('Setting device picture in form data');
        setDeviceData(prev => ({
          ...prev,
          devicePicture: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return {
    deviceTypes,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleFileChange
  };
};
