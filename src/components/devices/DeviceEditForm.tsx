
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
    assignedToId: device.assignedToId,
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
    
    // Validate device data
    if (!validateDeviceData()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create update payload - maintain assignedToId unless explicitly changed
      const updatePayload = {
        project,
        projectGroup,
        type,
        deviceType,
        imei: imei || undefined,
        serialNumber: serialNumber || undefined,
        status,
        deviceStatus: deviceStatus || undefined,
        receivedDate,
        notes: notes || undefined,
        devicePicture: devicePicture || undefined,
        // Only include assignedToId if it's different from the original device
        ...(deviceData.assignedToId !== device.assignedToId && {
          assignedToId: deviceData.assignedToId
        })
      };
      
      const updatedDevice = await dataService.updateDevice(device.id, updatePayload);
      
      if (updatedDevice) {
        toast.success('Device updated successfully', {
          description: `${project} has been updated`
        });
        
        // Call onDeviceUpdated which will now close the dialog
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
