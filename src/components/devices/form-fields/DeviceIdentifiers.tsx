
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
        <Label htmlFor="serialNumber">Serial Number (Alphanumeric only)</Label>
        <Input
          id="serialNumber"
          name="serialNumber"
          placeholder="Serial Number"
          value={serialNumber}
          onChange={handleChange}
          pattern="[a-zA-Z0-9]*"
          title="Only letters and numbers are allowed"
          autoComplete="off"
          aria-label="Device serial number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imei">IMEI (15 digits only)</Label>
        <Input
          id="imei"
          name="imei"
          placeholder="15-digit IMEI number"
          value={imei}
          onChange={handleChange}
          pattern="\d{15}"
          title="IMEI must be exactly 15 digits"
          maxLength={15}
          autoComplete="off"
          aria-label="Device IMEI number"
        />
      </div>
    </div>
  );
};

export default DeviceIdentifiers;
