
import React from 'react';
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
  
  return (
    <Card className="animate-slide-up shadow-soft border-none">
      <form onSubmit={handleSubmit}>
        <CardContent>
          <DeviceFormFields
            deviceData={deviceData}
            deviceTypes={deviceTypes}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateChange={handleDateChange}
            handleFileChange={handleFileChange}
            isEditMode={true}
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
