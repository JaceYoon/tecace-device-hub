
import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import DeviceFormFields from './DeviceFormFields';
import { useDeviceForm } from '@/hooks/useDeviceForm';

interface DeviceFormProps {
  onDeviceAdded?: () => void;
  onCancel?: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ onDeviceAdded, onCancel }) => {
  const { user } = useAuth();
  
  const {
    deviceData,
    deviceTypes,
    isSubmitting,
    handleChange,
    handleSelectChange,
    handleSubmit
  } = useDeviceForm({ onDeviceAdded, onCancel });
  
  const onSubmit = (e: React.FormEvent) => {
    if (user) {
      handleSubmit(e, user.id);
    }
  };
  
  return (
    <Card className="animate-slide-up shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Device
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={onSubmit}>
        <CardContent>
          <DeviceFormFields
            deviceData={deviceData}
            deviceTypes={deviceTypes}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
          />
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
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
