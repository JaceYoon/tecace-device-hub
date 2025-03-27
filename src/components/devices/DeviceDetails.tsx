
import React from 'react';
import { Device } from '@/types';
import { Calendar, Cpu, FileText, Hash, Smartphone } from 'lucide-react';

interface DeviceDetailsProps {
  device: Device;
}

const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-start">
        <Smartphone className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-muted-foreground">Type</p>
          <p className="font-medium">{device.type}</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <Hash className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-muted-foreground">Serial Number</p>
          <p className="font-mono text-sm">{device.serialNumber || 'N/A'}</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <Cpu className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-muted-foreground">IMEI</p>
          <p className="font-mono text-sm">{device.imei || 'N/A'}</p>
        </div>
      </div>
      
      {device.notes && (
        <div className="flex items-start">
          <FileText className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Notes</p>
            <p className="text-sm">{device.notes}</p>
          </div>
        </div>
      )}
      
      {device.receivedDate && (
        <div className="flex items-start">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-muted-foreground">Received Date</p>
            <p className="text-sm">{new Date(device.receivedDate).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetails;
