
import React from 'react';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DeviceTypeValue } from '@/types';

interface DeviceTypeSelectorProps {
  deviceType: DeviceTypeValue;
  deviceTypeCategory: 'C-Type' | 'Lunchbox';
  deviceTypes: DeviceTypeValue[];
  handleSelectChange: (value: string, field: string) => void;
}

const DeviceTypeSelector: React.FC<DeviceTypeSelectorProps> = ({
  deviceType,
  deviceTypeCategory,
  deviceTypes,
  handleSelectChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="type-select">Device Type *</Label>
        <Select
          value={deviceType}
          onValueChange={(value) => handleSelectChange(value, 'type')}
        >
          <SelectTrigger id="type-select" name="type" aria-label="Select device type">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {deviceTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deviceType-select">Type Category</Label>
        <Select
          value={deviceTypeCategory}
          onValueChange={(value) => handleSelectChange(value, 'deviceType')}
        >
          <SelectTrigger id="deviceType-select" name="deviceType" aria-label="Select device type category">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="C-Type">C-Type</SelectItem>
            <SelectItem value="Lunchbox">Lunchbox</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DeviceTypeSelector;
