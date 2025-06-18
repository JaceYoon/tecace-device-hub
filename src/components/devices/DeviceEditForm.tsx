
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import DeviceFormFields from './DeviceFormFields';
import { Device } from '@/types';
import { toast } from 'sonner';
import { useDeviceEditForm } from './hooks/useDeviceEditForm';
import FormActions from './form-fields/FormActions';

interface DeviceEditFormProps {
  device: Device;
  onDeviceUpdated?: () => void;
  onCancel?: () => void;
}

const DeviceEditForm: React.FC<DeviceEditFormProps> = ({ 
  device, 
  onDeviceUpdated, 
  onCancel 
}) => {
  const { isManager } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const {
    deviceData,
    deviceTypes,
    isSubmitting,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleFileChange,
    handleSubmit
  } = useDeviceEditForm({ device, onDeviceUpdated });
  
  // Check for manager permission
  if (!isManager) {
    toast.error('You do not have permission to edit devices');
    return null;
  }

  // Image update handler - force refresh without closing dialog
  const handleImageUpdate = () => {
    console.log('DeviceEditForm: Image updated, forcing form refresh');
    // Force component re-render to refresh image display
    setRefreshKey(prev => prev + 1);
    // Clear the devicePicture from form data to reflect deletion
    handleChange({
      target: {
        name: 'devicePicture',
        value: ''
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };
  
  return (
    <Card className="animate-slide-up shadow-soft border-none" key={refreshKey}>
      <form onSubmit={handleSubmit} id="device-edit-form" aria-label="Edit device form">
        <CardContent>
          <DeviceFormFields
            deviceData={deviceData}
            deviceTypes={deviceTypes}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateChange={handleDateChange}
            handleFileChange={handleFileChange}
            isEditMode={true}
            onImageUpdate={handleImageUpdate}
          />
        </CardContent>
        
        <CardFooter>
          <FormActions 
            isSubmitting={isSubmitting}
            onCancel={onCancel}
            submitText="Update Device"
          />
        </CardFooter>
      </form>
    </Card>
  );
};

export default DeviceEditForm;
