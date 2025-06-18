
import { useState } from 'react';
import { DeviceTypeValue, DeviceStatus } from '@/types';

export interface DeviceFormData {
  id?: string; // Add id field
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
  
  // 이미지 파일 처리를 간단하게 만듦
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    console.log('useDeviceFormHandlers handleFileChange called:', {
      hasFile: !!file,
      fileName: file?.name || 'none',
      inputValue: e.target.value
    });
    
    if (!file || e.target.value === '') {
      // 파일이 없거나 입력값이 비어있으면 이미지를 제거
      console.log('Clearing device picture from form data');
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
      console.log('Setting device picture in form data:', {
        base64Length: base64String.length
      });
      setDeviceData(prev => ({
        ...prev,
        devicePicture: base64String
      }));
    };
    reader.readAsDataURL(file);
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
