
import React from 'react';
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

interface DeviceFormFieldsProps {
  deviceData: {
    name: string;
    type: string;
    imei: string;
    serialNumber: string;
    status?: string;
    notes?: string;
  };
  deviceTypes: string[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string, field: string) => void;
  isEditMode?: boolean;
}

const DeviceFormFields: React.FC<DeviceFormFieldsProps> = ({ 
  deviceData, 
  deviceTypes, 
  handleChange, 
  handleSelectChange,
  isEditMode = false
}) => {
  return (
    <div className="space-y-4">
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
      
      {isEditMode && (
        <div className="space-y-2">
          <Label htmlFor="status">Device Status *</Label>
          <Select
            value={deviceData.status}
            onValueChange={(value) => handleSelectChange(value, 'status')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select device status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="stolen">Stolen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
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
    </div>
  );
};

export default DeviceFormFields;
