
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
  
  const validateDeviceData = () => {
    // Validate serial number (only alphanumeric characters)
    if (deviceData.serialNumber && !/^[a-zA-Z0-9]+$/.test(deviceData.serialNumber)) {
      toast.error('Serial number can only contain letters and numbers');
      return false;
    }
    
    // Validate IMEI (exactly 15 digits)
    if (deviceData.imei && !/^\d{15}$/.test(deviceData.imei)) {
      toast.error('IMEI must be exactly 15 digits');
      return false;
    }
    
    return true;
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate device data before submitting
    if (!validateDeviceData()) {
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
