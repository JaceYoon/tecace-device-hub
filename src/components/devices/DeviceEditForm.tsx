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
  
  const deviceTypeValue = device.deviceType && 
    (device.deviceType === 'C-Type' || device.deviceType === 'Lunchbox') ? 
    device.deviceType : 'C-Type';
  
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
    assignedToId: device.assignedToId
  });
  
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
    
    if (name === 'serialNumber' && value) {
      const alphanumericRegex = /^[a-zA-Z0-9]*$/;
      if (!alphanumericRegex.test(value)) {
        toast.error('Serial number can only contain letters and numbers');
        return;
      }
    }
    
    if (name === 'imei') {
      if (value === '') {
        setDeviceData(prev => ({
          ...prev,
          [name]: value,
        }));
        return;
      }
      
      const numericRegex = /^[0-9]*$/;
      if (!numericRegex.test(value)) {
        toast.error('IMEI can only contain numbers');
        return;
      }
      
      if (value.length > 15) {
        toast.error('IMEI must be exactly 15 digits');
        return;
      }
    }
    
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
  
  const handleFileChange = (file: File | null, fieldName: string) => {
    if (!file) return;
    
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
    
    const { project, projectGroup, type, deviceType, imei, serialNumber, status, deviceStatus, receivedDate, notes, devicePicture, assignedToId } = deviceData;
    
    if (!project || !type || !projectGroup) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (!deviceTypes.includes(type as DeviceTypeValue)) {
      toast.error('Please select a valid device type');
      return;
    }
    
    if (imei && imei.length !== 15) {
      toast.error('IMEI must be exactly 15 digits or empty');
      return;
    }
    
    if (serialNumber) {
      const alphanumericRegex = /^[a-zA-Z0-9]*$/;
      if (!alphanumericRegex.test(serialNumber)) {
        toast.error('Serial number can only contain letters and numbers');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const preserveOwnership = device.status === 'assigned' && device.assignedToId;
      
      console.log('Updating device with data:', {
        project,
        projectGroup,
        type,
        deviceType,
        imei: imei || null,
        serialNumber: serialNumber || null,
        status: preserveOwnership ? 'assigned' : status,
        assignedToId: preserveOwnership ? device.assignedToId : (assignedToId || null),
        deviceStatus: deviceStatus || null,
        receivedDate,
        notes: notes || null,
        devicePicture: devicePicture || null,
      });

      const updatedDevice = await dataService.updateDevice(device.id, {
        project,
        projectGroup,
        type,
        deviceType,
        imei: imei || null,
        serialNumber: serialNumber || null,
        status: preserveOwnership ? 'assigned' : status,
        assignedToId: preserveOwnership ? device.assignedToId : (assignedToId || null),
        deviceStatus: deviceStatus || null,
        receivedDate,
        notes: notes || null,
        devicePicture: devicePicture || null,
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
