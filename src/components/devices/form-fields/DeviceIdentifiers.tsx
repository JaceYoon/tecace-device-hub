
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DeviceIdentifiersProps {
  serialNumber: string;
  imei: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const DeviceIdentifiers: React.FC<DeviceIdentifiersProps> = ({ 
  serialNumber, 
  imei, 
  handleChange 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="serialNumber">Serial Number</Label>
        <Input
          id="serialNumber"
          name="serialNumber"
          placeholder="Enter serial number"
          value={serialNumber}
          onChange={handleChange}
          autoComplete="off"
          aria-label="Serial number"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imei">IMEI</Label>
        <Input
          id="imei"
          name="imei"
          placeholder="Enter 15-digit IMEI number"
          value={imei}
          onChange={handleChange}
          autoComplete="off"
          aria-label="IMEI number"
        />
        <p className="text-xs text-muted-foreground">
          IMEI must be exactly 15 digits
        </p>
      </div>
    </div>
  );
};

export default DeviceIdentifiers;
