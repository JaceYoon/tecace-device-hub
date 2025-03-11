
import React, { useState } from 'react';
import { Device } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { dataStore } from '@/utils/mockData';
import { toast } from '@/components/ui/sonner';
import { Loader2, Plus } from 'lucide-react';

interface DeviceFormProps {
  onDeviceAdded?: () => void;
  onCancel?: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({ onDeviceAdded, onCancel }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deviceData, setDeviceData] = useState<{
    name: string;
    type: string;
    imei: string;
    serialNumber: string;
    notes?: string;
  }>({
    name: '',
    type: 'Smartphone',
    imei: '',
    serialNumber: '',
    notes: '',
  });
  
  const deviceTypes = [
    'Smartphone',
    'Tablet',
    'Laptop',
    'Desktop',
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const { name, type, imei, serialNumber, notes } = deviceData;
    
    // Basic validation
    if (!name || !type || !imei || !serialNumber) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add the device
      const newDevice = dataStore.addDevice({
        name,
        type,
        imei,
        serialNumber,
        status: 'available',
        addedBy: user.id,
        notes: notes || undefined,
      });
      
      toast.success('Device added successfully');
      
      // Reset form
      setDeviceData({
        name: '',
        type: 'Smartphone',
        imei: '',
        serialNumber: '',
        notes: '',
      });
      
      // Notify parent
      if (onDeviceAdded) {
        onDeviceAdded();
      }
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device');
    } finally {
      setIsSubmitting(false);
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
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Device Name *</Label>
            <Input
              id="name"
              name="name"
              value={deviceData.name}
              onChange={handleChange}
              placeholder="e.g. iPhone 13 Pro"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Device Type *</Label>
            <Select
              value={deviceData.type}
              onValueChange={(value) => handleSelectChange(value, 'type')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI Number *</Label>
              <Input
                id="imei"
                name="imei"
                value={deviceData.imei}
                onChange={handleChange}
                placeholder="15-digit IMEI number"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                value={deviceData.serialNumber}
                onChange={handleChange}
                placeholder="Device serial number"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={deviceData.notes}
              onChange={handleChange}
              placeholder="Additional information about this device"
              rows={3}
            />
          </div>
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
