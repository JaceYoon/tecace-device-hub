
import React, { useState } from 'react';
import { useDeviceForm } from '@/hooks/useDeviceForm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import DeviceFormFields from './DeviceFormFields';
import { DeviceTypeValue } from '@/types';
import { toast } from 'sonner';

interface DeviceFormProps {
  onDeviceAdded?: () => void;
  onCancel?: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ onDeviceAdded, onCancel }) => {
  const { deviceData, setDeviceData, handleSubmit, handleChange, handleSelectChange, handleDateChange, isSubmitting } = useDeviceForm(onDeviceAdded);
  
  // Strictly typed list of device types matching the database schema
  const deviceTypes: DeviceTypeValue[] = [
    'Smartphone',
    'Tablet',
    'Smartwatch',
    'Box',
    'Accessory',
    'Other',
  ];

  // Function to handle barcode file upload
  const handleFileChange = (file: File | null, fieldName: string) => {
    if (!file) return;
    
    // Handle barcode image upload
    if (fieldName === 'barcode') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setDeviceData(prev => ({
          ...prev,
          barcode: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate IMEI and Serial Number
  const validateFields = () => {
    const { imei, serialNumber } = deviceData;
    
    // Validate IMEI (empty or exactly 15 digits)
    if (imei && !/^\d{15}$/.test(imei)) {
      toast.error('IMEI must be exactly 15 digits');
      return false;
    }
    
    // Validate Serial Number (empty or alphanumeric only)
    if (serialNumber && !/^[a-zA-Z0-9]+$/.test(serialNumber)) {
      toast.error('Serial Number must contain only letters and numbers');
      return false;
    }
    
    return true;
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields before submitting
    if (!validateFields()) {
      return;
    }
    
    handleSubmit(e);
  };
  
  return (
    <Card className="shadow-soft border-none">
      <CardHeader>
        <CardTitle>Add New Device</CardTitle>
      </CardHeader>
      <form onSubmit={handleFormSubmit}>
        <CardContent>
          <DeviceFormFields 
            deviceData={deviceData}
            deviceTypes={deviceTypes}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateChange={handleDateChange}
            handleFileChange={handleFileChange}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Device'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DeviceForm;
