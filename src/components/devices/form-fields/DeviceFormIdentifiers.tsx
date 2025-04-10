
import React from 'react';
import DeviceIdentifiers from './DeviceIdentifiers';

interface DeviceFormIdentifiersProps {
  serialNumber: string;
  imei: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const DeviceFormIdentifiers: React.FC<DeviceFormIdentifiersProps> = ({
  serialNumber,
  imei,
  handleChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Device Identifiers</h3>
      <DeviceIdentifiers
        serialNumber={serialNumber}
        imei={imei}
        handleChange={handleChange}
      />
    </div>
  );
};

export default DeviceFormIdentifiers;
