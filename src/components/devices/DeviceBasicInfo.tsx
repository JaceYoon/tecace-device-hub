
import React from 'react';
import { Hash, Cpu } from 'lucide-react';

interface DeviceBasicInfoProps {
  serialNumber?: string;
  imei?: string;
}

const DeviceBasicInfo: React.FC<DeviceBasicInfoProps> = ({
  serialNumber,
  imei
}) => {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-start">
        <Hash className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-muted-foreground">Serial Number</p>
          <p className="font-mono text-xs">{serialNumber || 'N/A'}</p>
        </div>
      </div>

      <div className="flex items-start">
        <Cpu className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-muted-foreground">IMEI</p>
          <p className="font-mono text-xs">{imei || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceBasicInfo;
