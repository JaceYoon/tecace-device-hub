import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import DeviceFormFields from './DeviceFormFields';
import { Device, DeviceTypeCategory, DeviceTypeValue } from '@/types';
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
  
  // Make sure we have a valid deviceType value from the allowed options
  const deviceTypeValue = device.deviceType && 
    (device.deviceType === 'C-Type' || device.deviceType === 'Lunchbox') ? 
    device.deviceType : 'C-Type';
  
  // Ensure device.type is one of the allowed values
  const ensureValidType = (type: string): DeviceTypeValue => {
    const validTypes: DeviceTypeValue[] = [
      'Smartphone',
      'Tablet',
      'Smartwatch',
      'Box',
      'Accessory',
      'Other'
    ];
    
    return validTypes.includes(type as DeviceTypeValue) 
      ? (type as DeviceTypeValue) 
      : 'Other';
  };
  
  const [deviceData, setDeviceData] = useState({
    project: device.project,
    projectGroup: device.projectGroup || 'Eureka',
    type: ensureValidType(device.type),
    deviceType: deviceTypeValue as DeviceTypeCategory,
    imei: device.imei || '',
    serialNumber: device.serialNumber || '',
    status: device.status,
    deviceStatus: device.deviceStatus || '',
    receivedDate: device.receivedDate,
    notes: device.notes || '',
    devicePicture: device.devicePicture || '',
  });
  
  // Strictly typed list of device types matching the database schema
  const deviceTypes: DeviceTypeValue[] = [
    'Smartphone',
    'Tablet',
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
  
  // Function to handle device picture file upload
  const handleFileChange = (file: File | null, fieldName: string) => {
    if (!file) return;
    
    // Handle device picture image upload
    if (fieldName === 'devicePicture') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setDeviceData(prev => ({
          ...prev,
          devicePicture: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isManager) {
      toast.error('You do not have permission to edit devices');
      return;
    }
    
    const { project, projectGroup, type, deviceType, imei, serialNumber, status, deviceStatus, receivedDate, notes, devicePicture } = deviceData;
    
    if (!project || !type || !projectGroup) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Validate that type is one of the allowed values
    if (!deviceTypes.includes(type as DeviceTypeValue)) {
      toast.error('Please select a valid device type');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedDevice = await dataService.updateDevice(device.id, {
        project,
        projectGroup,
        type,
        deviceType,
        imei,
        serialNumber,
        status,
        deviceStatus: deviceStatus || undefined,
        receivedDate,
        notes: notes || undefined,
        devicePicture: devicePicture || undefined,
      });
      
      if (updatedDevice) {
        toast.success('Device updated successfully', {
          description: `${project} has been updated`
        });
        
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
