
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import DeviceFormFields from './DeviceFormFields';
import { Device } from '@/types';
import { dataService } from '@/services/data.service';
import { toast } from 'sonner';

interface DeviceEditFormProps {
  device: Device;
  onDeviceUpdated?: () => void;
  onCancel?: () => void;
}

const DeviceEditForm: React.FC<DeviceEditFormProps> = ({ device, onDeviceUpdated, onCancel }) => {
  const { user, isManager } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deviceData, setDeviceData] = useState({
    project: device.project,
    type: device.type,
    imei: device.imei,
    serialNumber: device.serialNumber,
    status: device.status,
    deviceStatus: device.deviceStatus || '',
    receivedDate: device.receivedDate,
    notes: device.notes || '',
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
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isManager) {
      toast.error('You do not have permission to edit devices');
      return;
    }
    
    const { project, type, imei, serialNumber, status, deviceStatus, receivedDate, notes } = deviceData;
    
    // Basic validation
    if (!project || !type || !imei || !serialNumber) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update the device using the service
      const updatedDevice = await dataService.updateDevice(device.id, {
        project,
        type,
        imei,
        serialNumber,
        status,
        deviceStatus: deviceStatus || undefined,
        receivedDate,
        notes: notes || undefined,
      });
      
      if (updatedDevice) {
        toast.success('Device updated successfully', {
          description: `${project} has been updated`
        });
        
        // Notify parent
        if (onDeviceUpdated) {
          onDeviceUpdated();
        }
      } else {
        toast.error('Failed to update device', {
          description: 'Device not found or update failed'
        });
      }
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="animate-slide-up shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Edit Device
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent>
          <DeviceFormFields
            deviceData={deviceData}
            deviceTypes={deviceTypes}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleDateChange={handleDateChange}
            isEditMode={true}
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
                Updating...
              </>
            ) : (
              'Update Device'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DeviceEditForm;
