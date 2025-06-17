
import React, { useState } from 'react';
import { useDeviceForm } from '@/hooks/useDeviceForm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import DeviceFormFields from './DeviceFormFields';
import { DeviceTypeValue } from '@/types';
import { validateDeviceFields } from './hooks/useDeviceFormValidation';

interface DeviceFormProps {
  onDeviceAdded?: () => void;
  onCancel?: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ onDeviceAdded, onCancel }) => {
  const { deviceData, setDeviceData, handleSubmit, handleChange, handleSelectChange, handleDateChange, handleFileChange, isSubmitting } = useDeviceForm(onDeviceAdded);
  
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
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields before submitting - notes is no longer required, modelNumber is now required
    if (!validateDeviceFields(
      deviceData.imei, 
      deviceData.serialNumber,
      deviceData.receivedDate,
      deviceData.deviceStatus,
      deviceData.modelNumber
    )) {
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
